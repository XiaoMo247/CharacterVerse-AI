package service

import (
	"Backend-CharacterVerse/database"
	"Backend-CharacterVerse/model"
	"bytes"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/gorilla/websocket"
	"gorm.io/gorm"
)

// 定义消息类型常量
const (
	MessageTypeText  = "text"
	MessageTypeVoice = "voice"
)

type ChatMessage struct {
	RoleID  uint   `json:"role_id"`
	Message string `json:"message"`
	Type    string `json:"type"`             // text 或 voice
	Format  string `json:"format,omitempty"` // 语音格式，如 mp3, wav
}

type ChatResponse struct {
	RoleID  uint   `json:"role_id"`
	Message string `json:"message"`          // 文本内容或base64编码的语音
	Type    string `json:"type"`             // text 或 voice
	Format  string `json:"format,omitempty"` // 语音格式
}

// 七牛云API请求/响应结构
type QiniuRequest struct {
	Stream   bool      `json:"stream"`
	Model    string    `json:"model"`
	Messages []Message `json:"messages"`
}

type QiniuResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

func HandleChatSession(conn *websocket.Conn, userID uint) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("WebSocket会话发生严重错误: %v", r)
			conn.WriteJSON(map[string]interface{}{"error": "服务器内部错误", "code": 500})
			conn.Close()
		}
	}()

	for {
		_, msgBytes, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket连接异常关闭: %v", err)
			}
			break
		}

		var chatMsg ChatMessage
		if err := json.Unmarshal(msgBytes, &chatMsg); err != nil {
			sendError(conn, "消息格式错误: "+err.Error())
			continue
		}

		// 处理不同类型的消息
		switch chatMsg.Type {
		case MessageTypeText:
			handleTextMessage(conn, userID, chatMsg)
		case MessageTypeVoice:
			handleVoiceMessage(conn, userID, chatMsg)
		default:
			sendError(conn, "不支持的消息类型: "+chatMsg.Type)
		}
	}
}

// 处理文本消息
func handleTextMessage(conn *websocket.Conn, userID uint, chatMsg ChatMessage) {
	response, err := processMessage(userID, chatMsg.RoleID, chatMsg.Message)
	if err != nil {
		sendError(conn, "处理消息失败: "+err.Error())
		return
	}

	// 发送文本回复
	if err := conn.WriteJSON(ChatResponse{
		RoleID:  chatMsg.RoleID,
		Message: response,
		Type:    MessageTypeText,
	}); err != nil {
		log.Printf("发送消息错误: %v", err)
	}
}

// 处理语音消息
func handleVoiceMessage(conn *websocket.Conn, userID uint, chatMsg ChatMessage) {
	// 1. 直接使用前端提供的URL进行语音识别
	text, err := RecognizeSpeech(chatMsg.Message, chatMsg.Format)
	if err != nil {
		sendError(conn, "语音识别失败: "+err.Error())
		return
	}

	log.Printf("语音识别结果 (用户ID: %d, 角色ID: %d): %s", userID, chatMsg.RoleID, text)

	// 2. 处理文本消息
	response, err := processMessage(userID, chatMsg.RoleID, text)
	if err != nil {
		sendError(conn, "处理消息失败: "+err.Error())
		return
	}
	aiResponse := response

	// 3. 语音合成 (TTS)
	// 获取角色信息以确定音色
	role, err := database.GetRoleByID(chatMsg.RoleID)
	if err != nil {
		log.Printf("获取角色信息失败: %v", err)
		// 使用默认音色
		role = &model.Role{Name: "默认角色"}
	}

	// 根据角色名称选择音色
	voiceType := selectVoiceType(role.Name)
	audioData, err := GenerateQiniuTTS(aiResponse, voiceType, "mp3", 1.0)
	if err != nil {
		log.Printf("语音合成失败: %v", err)
		// 如果TTS失败，回退到文本回复
		if err := conn.WriteJSON(ChatResponse{
			RoleID:  chatMsg.RoleID,
			Message: aiResponse,
			Type:    MessageTypeText,
		}); err != nil {
			log.Printf("发送消息错误: %v", err)
		}
		return
	}

	// 4. 发送语音回复
	if err := conn.WriteJSON(ChatResponse{
		RoleID:  chatMsg.RoleID,
		Message: base64.StdEncoding.EncodeToString(audioData),
		Type:    MessageTypeVoice,
		Format:  "mp3",
	}); err != nil {
		log.Printf("发送语音消息错误: %v", err)
	}
}

// 根据角色名称选择音色
func selectVoiceType(roleName string) string {
	// 简单的音色映射
	switch {
	case strings.Contains(roleName, "女") || strings.Contains(roleName, "女性"):
		return "qiniu_zh_female_wwxkjx" // 女性音色
	case strings.Contains(roleName, "男") || strings.Contains(roleName, "男性"):
		return "qiniu_zh_male_wwxkjx" // 男性音色
	default:
		return "qiniu_zh_female_wwxkjx" // 默认女性音色
	}
}

// 处理消息的核心逻辑
func processMessage(userID, roleID uint, message string) (string, error) {
	role, err := database.GetRoleByID(roleID)
	if err != nil {
		return "", fmt.Errorf("获取角色信息失败: %w", err)
	}

	// 获取已有的摘要
	existingSummary, err := getCompressedHistory(userID, roleID)
	if err != nil {
		existingSummary = ""
	}

	// 获取最近的聊天记录
	history, err := database.GetChatHistory(userID, roleID, 5)
	if err != nil {
		return "", fmt.Errorf("获取历史消息失败: %w", err)
	}

	// 第一步：获取聊天回复
	chatMessages := buildChatMessages(role.Description, history, message, existingSummary)
	userResponse, err := callQiniuLLM(chatMessages)
	if err != nil {
		return "", fmt.Errorf("调用大模型获取回复失败: %w", err)
	}

	// 保存聊天记录
	if err := database.SaveChatMessage(userID, roleID, message, userResponse); err != nil {
		log.Printf("保存聊天记录失败: %v", err)
	}

	// 第二步：生成摘要
	summaryMessages := buildSummaryMessages(role.Description, history, message, userResponse, existingSummary)
	newSummary, err := callQiniuLLM(summaryMessages)
	if err != nil {
		// 如果摘要生成失败，使用简单摘要
		newSummary = generateSimpleSummary(message, userResponse)
	}

	// 清理并保存摘要
	if err := updateCompressedHistory(userID, roleID, cleanInvalidUTF8(newSummary)); err != nil {
		log.Printf("更新压缩历史失败: %v", err)
	}

	return userResponse, nil
}

// 构建聊天请求的消息
func buildChatMessages(roleDesc string, history []model.ChatHistory, currentMessage, existingSummary string) []Message {
	systemMessage := "你正在扮演以下角色:\n" + roleDesc +
		"\n请保持角色设定，用角色的语气和风格回答用户问题。"

	// 添加摘要上下文
	if existingSummary != "" {
		systemMessage += "\n\n之前的对话摘要:\n" + existingSummary
	}

	messages := []Message{{Role: "system", Content: systemMessage}}

	// 添加最近的聊天记录
	for _, h := range history {
		role := "user"
		if !h.IsUser {
			role = "assistant"
		}
		messages = append(messages, Message{Role: role, Content: h.Message})
	}

	// 添加当前用户消息
	return append(messages, Message{Role: "user", Content: currentMessage})
}

// 构建摘要请求的消息
func buildSummaryMessages(roleDesc string, history []model.ChatHistory, userMessage, aiResponse, existingSummary string) []Message {
	// 构建完整的对话历史
	var fullHistory strings.Builder
	fullHistory.WriteString("以下是完整的对话历史:\n\n")

	for _, h := range history {
		// 根据IsUser字段判断是用户消息还是AI消息
		if h.IsUser {
			fullHistory.WriteString("用户: " + h.Message + "\n")
		} else {
			fullHistory.WriteString("AI: " + h.Message + "\n")
		}
	}
	fullHistory.WriteString("用户: " + userMessage + "\n")
	fullHistory.WriteString("AI: " + aiResponse + "\n\n")

	// 添加之前的摘要
	if existingSummary != "" {
		fullHistory.WriteString("之前的摘要:\n" + existingSummary + "\n\n")
	}

	// 系统消息
	systemMessage := "你正在扮演以下角色:\n" + roleDesc +
		"\n请根据对话历史生成一个简短的摘要，要求:\n" +
		"1. 保留关键信息\n" +
		"2. 不超过200字\n" +
		"3. 使用第三人称叙述\n" +
		"4. 不要包含任何JSON格式或特殊标记\n\n" +
		fullHistory.String()

	return []Message{
		{Role: "system", Content: systemMessage},
		{Role: "user", Content: "请生成对话摘要"},
	}
}

// 清理无效的UTF-8字符
func cleanInvalidUTF8(s string) string {
	if utf8.ValidString(s) {
		return s
	}

	var validRunes []rune
	for i, r := range s {
		if r == utf8.RuneError {
			_, size := utf8.DecodeRuneInString(s[i:])
			if size == 1 {
				continue // 跳过无效字符
			}
		}
		validRunes = append(validRunes, r)
	}
	return string(validRunes)
}

// 生成简单摘要
func generateSimpleSummary(userMsg, aiResp string) string {
	const maxLength = 200
	summary := fmt.Sprintf("用户: %s\nAI: %s", truncate(userMsg, 50), truncate(aiResp, 50))
	if len(summary) > maxLength {
		return summary[:maxLength] + "..."
	}
	return summary
}

// 获取压缩历史
func getCompressedHistory(userID, roleID uint) (string, error) {
	var history model.UserRoleHistory
	result := database.DB.Where("user_id = ? AND role_id = ?", userID, roleID).First(&history)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return "", nil
		}
		return "", result.Error
	}
	return history.Summary, nil
}

// 更新压缩历史
func updateCompressedHistory(userID, roleID uint, newSummary string) error {
	history := model.UserRoleHistory{
		UserID:  userID,
		RoleID:  roleID,
		Summary: newSummary,
	}

	result := database.DB.Where("user_id = ? AND role_id = ?", userID, roleID).
		Assign(history).
		FirstOrCreate(&history)

	return result.Error
}

// 调用大模型
func callQiniuLLM(messages []Message) (string, error) {
	apiKey := os.Getenv("QINIU_API_KEY")
	if apiKey == "" {
		return "", errors.New("未配置七牛云API密钥")
	}

	modelName := "deepseek/deepseek-v3.1-terminus"
	if envModel := os.Getenv("QINIU_MODEL_NAME"); envModel != "" {
		modelName = envModel
	}

	requestBody := QiniuRequest{
		Stream:   false,
		Model:    modelName,
		Messages: messages,
	}

	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		return "", fmt.Errorf("JSON序列化失败: %w", err)
	}

	req, err := http.NewRequest("POST", "https://openai.qiniu.com/v1/chat/completions", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("创建请求失败: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("API请求失败: %w", err)
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("读取响应体失败: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("API返回错误状态码: %d, 响应: %s", resp.StatusCode, string(bodyBytes))
	}

	var apiResponse QiniuResponse
	if err := json.Unmarshal(bodyBytes, &apiResponse); err != nil {
		return "", fmt.Errorf("解析API响应失败: %w", err)
	}

	if len(apiResponse.Choices) == 0 {
		return "", errors.New("API返回空回复")
	}

	return apiResponse.Choices[0].Message.Content, nil
}

// 辅助函数：截断字符串
func truncate(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}

func sendError(conn *websocket.Conn, message string) {
	if err := conn.WriteJSON(map[string]interface{}{"error": message}); err != nil {
		log.Printf("发送错误消息失败: %v", err)
	}
}

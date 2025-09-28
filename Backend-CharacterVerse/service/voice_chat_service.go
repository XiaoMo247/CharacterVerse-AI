// service/voice_chat_service.go
package service

import (
	"Backend-CharacterVerse/database"
	"Backend-CharacterVerse/model"
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"gorm.io/gorm"
)

// 语音通话消息结构
type VoiceChatMessage struct {
	RoleID   uint   `json:"role_id"`
	VoiceURL string `json:"voice_url"` // 语音文件URL
	Format   string `json:"format"`    // 语音格式 (mp3, wav等)
}

// 语音通话响应结构
type VoiceChatResponse struct {
	Type    string `json:"type"`     // "audio" 或 "error"
	Data    string `json:"data"`     // base64编码的音频数据或错误信息
	Format  string `json:"format"`   // 音频格式
	IsFinal bool   `json:"is_final"` // 是否是最后一个片段
}

// TTS请求结构
type TTSRequest struct {
	Audio   `json:"audio"`
	Request `json:"request"`
}

type Audio struct {
	VoiceType  string  `json:"voice_type"`
	Encoding   string  `json:"encoding"`
	SpeedRatio float64 `json:"speed_ratio"`
}

type Request struct {
	Text string `json:"text"`
}

// TTS响应结构
type TTSResponse struct {
	Reqid     string    `json:"reqid"`
	Operation string    `json:"operation"`
	Sequence  int       `json:"sequence"`
	Data      string    `json:"data"`
	Addition  *Addition `json:"addition,omitempty"`
}

type Addition struct {
	Duration string `json:"duration"`
}

// 处理语音通话会话
func HandleVoiceChatSession(conn *websocket.Conn, userID uint) {
	// 创建通话历史记录
	history := model.VoiceChatHistory{
		UserID:    userID,
		StartTime: time.Now(),
	}
	defer func() {
		// 更新通话结束时间
		history.EndTime = time.Now()
		updateVoiceChatHistory(history)

		if r := recover(); r != nil {
			log.Printf("语音通话会话发生严重错误: %v", r)
			sendVoiceError(conn, "服务器内部错误")
			conn.Close()
		}
	}()

	// 设置超时上下文
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	for {
		_, msgBytes, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("语音通话连接异常关闭: %v", err)
			}
			break
		}

		var voiceMsg VoiceChatMessage
		if err := json.Unmarshal(msgBytes, &voiceMsg); err != nil {
			sendVoiceError(conn, "消息格式错误: "+err.Error())
			continue
		}

		// 记录角色ID
		history.RoleID = voiceMsg.RoleID

		// 处理语音消息
		if err := processVoiceMessage(ctx, conn, userID, voiceMsg); err != nil {
			sendVoiceError(conn, "处理语音消息失败: "+err.Error())
		}
	}
}

// 更新语音通话历史记录
func updateVoiceChatHistory(history model.VoiceChatHistory) {
	// 确保有角色ID
	if history.RoleID == 0 {
		return
	}

	// 创建或更新记录
	record := model.VoiceChatHistory{
		UserID:    history.UserID,
		RoleID:    history.RoleID,
		StartTime: history.StartTime,
		EndTime:   history.EndTime,
	}

	if err := database.DB.Where("user_id = ? AND role_id = ?", history.UserID, history.RoleID).
		Assign(record).
		FirstOrCreate(&record).Error; err != nil {
		log.Printf("更新语音通话历史失败: %v", err)
	}

	historyService := HistoryService{}
	historyService.ClearUserCache(history.UserID)

}

// 处理语音消息
func processVoiceMessage(ctx context.Context, conn *websocket.Conn, userID uint, msg VoiceChatMessage) error {
	// 1. 语音识别 - 使用asr_service中的实现
	log.Printf("开始语音识别: URL=%s, 格式=%s", msg.VoiceURL, msg.Format)
	userText, err := RecognizeSpeech(msg.VoiceURL, msg.Format)
	if err != nil {
		log.Printf("语音识别失败: %v", err)
		return fmt.Errorf("语音识别失败: %w", err)
	}

	log.Printf("语音识别成功! (用户ID: %d, 角色ID: %d): %s", userID, msg.RoleID, userText)

	// 2. 获取角色信息
	log.Printf("获取角色信息: 角色ID=%d", msg.RoleID)
	role, err := database.GetRoleByID(msg.RoleID)
	if err != nil {
		log.Printf("获取角色信息失败: %v", err)
		return fmt.Errorf("获取角色信息失败: %w", err)
	}
	log.Printf("角色信息获取成功: 角色名=%s, 音色类型=%s", role.Name, role.VoiceType)

	// 3. 获取压缩历史
	historySummary, err := getCompressedHistory(userID, msg.RoleID)
	if err != nil {
		log.Printf("获取历史摘要失败: %v", err)
	}
	log.Printf("历史摘要: %s", truncateText(historySummary, 100))

	// 4. 流式调用LLM获取回复并实时处理
	log.Printf("开始调用大语言模型: 模型=deepseek/deepseek-v3.1-terminus, 提示长度=%d", len(userText))
	if err := streamAndProcessLLMResponse(ctx, conn, role, historySummary, userText); err != nil {
		log.Printf("处理LLM回复失败: %v", err)
		return fmt.Errorf("处理LLM回复失败: %w", err)
	}
	log.Printf("大语言模型处理完成!")

	// 5. 异步更新对话摘要
	go func() {
		// 使用大模型生成新摘要
		newSummary, err := generateSummaryWithLLM(ctx, historySummary, userText, "")
		if err != nil {
			log.Printf("生成新摘要失败: %v", err)
			return
		}

		// 更新数据库
		if err := updateConversationSummary(userID, msg.RoleID, newSummary); err != nil {
			log.Printf("更新对话摘要失败: %v", err)
		}
		historyService := HistoryService{}
		historyService.ClearUserCache(userID)
	}()

	return nil
}

// 使用大模型生成摘要
func generateSummaryWithLLM(ctx context.Context, historySummary, userText, aiResponse string) (string, error) {
	// 构建提示词
	prompt := fmt.Sprintf(`
请将以下对话内容压缩成一个简短的摘要，保留关键信息，用于后续对话上下文。摘要长度不超过100字。

当前摘要：%s

新对话：
  用户：%s
  AI：%s

新摘要：`, historySummary, userText, aiResponse)

	// 调用大模型生成摘要
	return callLLMForSummary(ctx, prompt)
}

// 调用大模型生成摘要
func callLLMForSummary(ctx context.Context, prompt string) (string, error) {
	apiKey := os.Getenv("QINIU_API_KEY")
	if apiKey == "" {
		return "", errors.New("未配置七牛云API密钥")
	}

	modelName := "deepseek/deepseek-v3.1-terminus"
	if envModel := os.Getenv("QINIU_MODEL_NAME"); envModel != "" {
		modelName = envModel
	}

	// 构建消息
	messages := []map[string]interface{}{
		{"role": "system", "content": "你是一个专业的对话摘要生成器，请根据对话内容生成简洁的摘要。"},
		{"role": "user", "content": prompt},
	}

	// 创建请求
	requestBody := map[string]interface{}{
		"model":    modelName,
		"messages": messages,
		"stream":   false, // 非流式调用
	}

	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		return "", fmt.Errorf("JSON序列化失败: %w", err)
	}

	log.Printf("发送摘要生成请求: 模型=%s, 请求体大小=%d字节", modelName, len(jsonData))

	req, err := http.NewRequestWithContext(ctx, "POST", "https://openai.qiniu.com/v1/chat/completions", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("创建请求失败: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 30 * time.Second} // 设置30秒超时
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("API请求失败: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		log.Printf("摘要生成API返回错误状态码: %d, 响应: %s", resp.StatusCode, string(bodyBytes))
		return "", fmt.Errorf("API返回错误状态码: %d, 响应: %s", resp.StatusCode, string(bodyBytes))
	}

	// 解析响应
	var response struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}

	bodyBytes, _ := io.ReadAll(resp.Body)
	if err := json.Unmarshal(bodyBytes, &response); err != nil {
		log.Printf("解析摘要生成响应失败: %v, 原始数据: %s", err, string(bodyBytes))
		return "", fmt.Errorf("解析响应失败: %w", err)
	}

	if len(response.Choices) == 0 {
		return "", errors.New("未生成摘要")
	}

	summary := response.Choices[0].Message.Content
	log.Printf("摘要生成成功! 长度=%d, 内容: %s", len(summary), truncateText(summary, 100))
	return summary, nil
}

// 辅助函数：截断长文本用于日志
func truncateText(text string, maxLen int) string {
	if len(text) <= maxLen {
		return text
	}
	return text[:maxLen] + "..."
}

// 流式处理LLM响应并实时分割发送
func streamAndProcessLLMResponse(ctx context.Context, conn *websocket.Conn, role *model.Role, historySummary, prompt string) error {
	apiKey := os.Getenv("QINIU_API_KEY")
	if apiKey == "" {
		return errors.New("未配置七牛云API密钥")
	}

	modelName := "deepseek/deepseek-v3.1-terminus"
	if envModel := os.Getenv("QINIU_MODEL_NAME"); envModel != "" {
		modelName = envModel
	}

	// 确保音色类型不为空
	voiceType := role.VoiceType
	if voiceType == "" {
		voiceType = "qiniu_zh_female_wwxkjx" // 默认音色
		log.Printf("使用默认音色: %s", voiceType)
	} else {
		log.Printf("使用角色音色: %s", voiceType)
	}

	// 构建消息 - 包含历史摘要
	messages := []map[string]interface{}{
		{"role": "system", "content": "你正在扮演角色: " + role.Name + "。" + role.Description},
	}

	// 添加历史摘要
	if historySummary != "" {
		messages = append(messages, map[string]interface{}{
			"role":    "system",
			"content": "以下是之前的对话摘要:\n" + historySummary,
		})
	}

	// 添加用户当前消息
	messages = append(messages, map[string]interface{}{
		"role":    "user",
		"content": prompt,
	})

	// 创建请求
	requestBody := map[string]interface{}{
		"model":    modelName,
		"messages": messages,
		"stream":   true,
	}

	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		return fmt.Errorf("JSON序列化失败: %w", err)
	}

	log.Printf("发送LLM请求: 模型=%s, 消息数=%d, 请求体大小=%d字节", modelName, len(messages), len(jsonData))

	req, err := http.NewRequestWithContext(ctx, "POST", "https://openai.qiniu.com/v1/chat/completions", bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("创建请求失败: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 300 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("API请求失败: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		log.Printf("LLM API返回错误状态码: %d, 响应: %s", resp.StatusCode, string(bodyBytes))
		return fmt.Errorf("API返回错误状态码: %d, 响应: %s", resp.StatusCode, string(bodyBytes))
	}

	log.Printf("LLM API调用成功! 状态码=%d, 开始接收流式响应", resp.StatusCode)

	// 创建HTTP客户端用于TTS请求
	ttsClient := &http.Client{Timeout: 30 * time.Second}

	// 文本缓冲区
	var buffer strings.Builder
	punctuationRegex := regexp.MustCompile(`([。！？；，、])`)
	eventCount := 0
	contentCount := 0
	fragmentCount := 0
	var wg sync.WaitGroup
	ttsQueue := make(chan string, 100) // 缓冲队列防止阻塞

	// 启动TTS处理goroutine
	wg.Add(1)
	go func() {
		defer wg.Done()
		for text := range ttsQueue {
			if text == "" {
				continue
			}

			// 调用TTS生成语音
			audioData, err := synthesizeSpeech(ttsClient, voiceType, text)
			if err != nil {
				log.Printf("生成语音片段失败: %v", err)
				continue
			}

			log.Printf("语音片段生成成功! 大小=%d字节", len(audioData))

			// 发送给前端
			resp := VoiceChatResponse{
				Type:    "audio",
				Data:    audioData,
				Format:  "mp3",
				IsFinal: false, // 流式处理中不是最终片段
			}

			respBytes, err := json.Marshal(resp)
			if err != nil {
				log.Printf("序列化响应失败: %v", err)
				continue
			}

			if err := conn.WriteMessage(websocket.TextMessage, respBytes); err != nil {
				log.Printf("发送音频数据失败: %v", err)
			}

			log.Printf("已发送语音片段 #%d 给前端: 大小=%d字节", fragmentCount, len(respBytes))
			fragmentCount++
		}
	}()

	// 处理流式响应
	scanner := bufio.NewScanner(resp.Body)
	for scanner.Scan() {
		line := scanner.Text()
		if strings.HasPrefix(line, "data: ") {
			eventCount++
			eventData := strings.TrimPrefix(line, "data: ")

			// 检查是否为结束标记
			if eventData == "[DONE]" {
				log.Printf("接收到LLM结束标记 [DONE]")
				break
			}

			// 解析JSON事件
			var event struct {
				Choices []struct {
					Delta struct {
						Content string `json:"content"`
					} `json:"delta"`
				} `json:"choices"`
			}

			if err := json.Unmarshal([]byte(eventData), &event); err != nil {
				log.Printf("解析LLM事件失败: %v, 原始数据: %s", err, eventData)
				continue
			}

			// 提取内容
			if len(event.Choices) > 0 {
				content := event.Choices[0].Delta.Content
				if content != "" {
					contentCount++
					log.Printf("接收到LLM内容片段 #%d: 长度=%d, 内容: %s",
						contentCount, len(content), truncateText(content, 50))

					// 追加到缓冲区
					buffer.WriteString(content)

					// 检查缓冲区中是否有标点符号
					bufferStr := buffer.String()
					if matches := punctuationRegex.FindStringIndex(bufferStr); matches != nil {
						// 提取到标点符号为止的文本
						endPos := matches[1]
						textFragment := bufferStr[:endPos]
						buffer.Reset()
						buffer.WriteString(bufferStr[endPos:])

						// 发送到TTS队列
						ttsQueue <- textFragment
					}
				}
			}
		}
	}

	// 处理剩余的缓冲区内容
	if buffer.Len() > 0 {
		ttsQueue <- buffer.String()
	}

	// 关闭TTS队列并等待处理完成
	close(ttsQueue)
	wg.Wait()

	// 发送结束标记
	endResp := VoiceChatResponse{
		Type:    "audio",
		Data:    "",
		Format:  "mp3",
		IsFinal: true,
	}
	endRespBytes, _ := json.Marshal(endResp)
	conn.WriteMessage(websocket.TextMessage, endRespBytes)
	log.Printf("已发送结束标记")

	if err := scanner.Err(); err != nil {
		log.Printf("读取LLM流式响应失败: %v", err)
		return fmt.Errorf("读取流式响应失败: %w", err)
	}

	log.Printf("LLM流式响应处理完成! 事件总数=%d, 内容片段数=%d, 发送片段数=%d",
		eventCount, contentCount, fragmentCount)

	return nil
}

// 使用HTTP API合成语音
func synthesizeSpeech(client *http.Client, voiceType, text string) (string, error) {
	apiKey := os.Getenv("QINIU_API_KEY")
	if apiKey == "" {
		return "", errors.New("未配置七牛云API密钥")
	}

	// 构建请求
	ttsRequest := TTSRequest{
		Audio: Audio{
			VoiceType:  voiceType,
			Encoding:   "mp3",
			SpeedRatio: 1.0,
		},
		Request: Request{
			Text: text,
		},
	}

	requestBytes, err := json.Marshal(ttsRequest)
	if err != nil {
		return "", fmt.Errorf("序列化TTS请求失败: %w", err)
	}

	log.Printf("发送TTS请求: 文本长度=%d, 请求体大小=%d字节", len(text), len(requestBytes))

	req, err := http.NewRequest("POST", "https://openai.qiniu.com/v1/voice/tts", bytes.NewBuffer(requestBytes))
	if err != nil {
		return "", fmt.Errorf("创建请求失败: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("API请求失败: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		log.Printf("TTS API返回错误状态码: %d, 响应: %s", resp.StatusCode, string(bodyBytes))
		return "", fmt.Errorf("API返回错误状态码: %d, 响应: %s", resp.StatusCode, string(bodyBytes))
	}

	// 解析响应
	var ttsResp TTSResponse
	bodyBytes, _ := io.ReadAll(resp.Body)
	if err := json.Unmarshal(bodyBytes, &ttsResp); err != nil {
		log.Printf("解析TTS响应失败: %v, 原始数据: %s", err, string(bodyBytes))
		return "", fmt.Errorf("解析响应失败: %w", err)
	}

	log.Printf("TTS响应成功! 音频大小=%d字节", len(ttsResp.Data))
	return ttsResp.Data, nil
}

// 发送语音错误
func sendVoiceError(conn *websocket.Conn, message string) {
	resp := VoiceChatResponse{
		Type: "error",
		Data: message,
	}

	respBytes, _ := json.Marshal(resp)
	conn.WriteMessage(websocket.TextMessage, respBytes)
	log.Printf("发送错误消息给前端: %s", message)
}

// 更新对话摘要
func updateConversationSummary(userID, roleID uint, newSummary string) error {
	// 检查记录是否存在
	var existingRecord model.UserRoleHistory
	result := database.DB.Where("user_id = ? AND role_id = ?", userID, roleID).First(&existingRecord)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			// 创建新记录
			newRecord := model.UserRoleHistory{
				UserID:  userID,
				RoleID:  roleID,
				Summary: newSummary,
			}
			return database.DB.Create(&newRecord).Error
		}
		return result.Error
	}

	// 更新现有记录
	return database.DB.Model(&existingRecord).Update("summary", newSummary).Error
}

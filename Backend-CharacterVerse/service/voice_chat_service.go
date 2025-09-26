// service/voice_chat_service.go
package service

import (
	"Backend-CharacterVerse/database"
	"Backend-CharacterVerse/model"
	"bufio"
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/gorilla/websocket"
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

// 处理语音通话会话
func HandleVoiceChatSession(conn *websocket.Conn, userID uint) {
	defer func() {
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

		// 处理语音消息
		if err := processVoiceMessage(ctx, conn, userID, voiceMsg); err != nil {
			sendVoiceError(conn, "处理语音消息失败: "+err.Error())
		}
	}
}

// 处理语音消息
func processVoiceMessage(ctx context.Context, conn *websocket.Conn, userID uint, msg VoiceChatMessage) error {
	// 1. 语音识别 - 使用asr_service中的实现
	log.Printf("开始语音识别: URL=%s, 格式=%s", msg.VoiceURL, msg.Format)
	text, err := RecognizeSpeech(msg.VoiceURL, msg.Format)
	if err != nil {
		log.Printf("语音识别失败: %v", err)
		return fmt.Errorf("语音识别失败: %w", err)
	}

	log.Printf("语音识别成功! (用户ID: %d, 角色ID: %d): %s", userID, msg.RoleID, text)

	// 2. 获取角色信息
	log.Printf("获取角色信息: 角色ID=%d", msg.RoleID)
	role, err := database.GetRoleByID(msg.RoleID)
	if err != nil {
		log.Printf("获取角色信息失败: %v", err)
		return fmt.Errorf("获取角色信息失败: %w", err)
	}
	log.Printf("角色信息获取成功: 角色名=%s, 音色类型=%s", role.Name, role.VoiceType)

	// 3. 流式调用LLM获取回复
	log.Printf("开始调用大语言模型: 模型=deepseek/deepseek-v3.1-terminus, 提示长度=%d", len(text))
	llmResponse, err := streamLLMResponse(ctx, role, text)
	if err != nil {
		log.Printf("获取LLM回复失败: %v", err)
		return fmt.Errorf("获取LLM回复失败: %w", err)
	}
	log.Printf("大语言模型调用成功! 回复长度=%d, 内容: %s", len(llmResponse), truncateText(llmResponse, 100))

	// 4. 流式调用TTS生成语音并发送给前端
	log.Printf("开始调用TTS服务: 音色类型=%s, 文本长度=%d", role.VoiceType, len(llmResponse))
	if err := streamTTSResponse(ctx, conn, role, llmResponse); err != nil {
		log.Printf("生成语音失败: %v", err)
		return fmt.Errorf("生成语音失败: %w", err)
	}
	log.Printf("TTS服务调用成功! 语音已发送给前端")

	return nil
}

// 辅助函数：截断长文本用于日志
func truncateText(text string, maxLen int) string {
	if len(text) <= maxLen {
		return text
	}
	return text[:maxLen] + "..."
}

// 流式调用LLM获取回复（修复版）
func streamLLMResponse(ctx context.Context, role *model.Role, prompt string) (string, error) {
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
		{"role": "system", "content": "你正在扮演角色: " + role.Name + "。" + role.Description},
		{"role": "user", "content": prompt},
	}

	// 创建请求
	requestBody := map[string]interface{}{
		"model":    modelName,
		"messages": messages,
		"stream":   true,
	}

	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		return "", fmt.Errorf("JSON序列化失败: %w", err)
	}

	log.Printf("发送LLM请求: 模型=%s, 消息数=%d, 请求体大小=%d字节", modelName, len(messages), len(jsonData))

	req, err := http.NewRequestWithContext(ctx, "POST", "https://openai.qiniu.com/v1/chat/completions", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("创建请求失败: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 300 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("API请求失败: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		log.Printf("LLM API返回错误状态码: %d, 响应: %s", resp.StatusCode, string(bodyBytes))
		return "", fmt.Errorf("API返回错误状态码: %d, 响应: %s", resp.StatusCode, string(bodyBytes))
	}

	log.Printf("LLM API调用成功! 状态码=%d, 开始接收流式响应", resp.StatusCode)

	// 修复：使用SSE格式解析流式响应
	var responseBuilder strings.Builder
	scanner := bufio.NewScanner(resp.Body)
	eventCount := 0
	contentCount := 0

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
					responseBuilder.WriteString(content)
					log.Printf("接收到LLM内容片段 #%d: 长度=%d, 内容: %s",
						contentCount, len(content), truncateText(content, 50))
				}
			}
		}
	}

	if err := scanner.Err(); err != nil {
		log.Printf("读取LLM流式响应失败: %v", err)
		return "", fmt.Errorf("读取流式响应失败: %w", err)
	}

	log.Printf("LLM流式响应处理完成! 事件总数=%d, 内容片段数=%d, 总内容长度=%d",
		eventCount, contentCount, responseBuilder.Len())

	return responseBuilder.String(), nil
}

// 流式调用TTS生成语音并发送
func streamTTSResponse(ctx context.Context, conn *websocket.Conn, role *model.Role, text string) error {
	// 确保音色类型不为空
	voiceType := role.VoiceType
	if voiceType == "" {
		voiceType = "qiniu_zh_female_wwxkjx" // 默认音色
		log.Printf("使用默认音色: %s", voiceType)
	} else {
		log.Printf("使用角色音色: %s", voiceType)
	}

	// 建立TTS WebSocket连接
	ttsURL := "wss://openai.qiniu.com/v1/voice/tts"
	log.Printf("连接TTS服务: URL=%s, 音色类型=%s", ttsURL, voiceType)

	u := url.URL{Scheme: "wss", Host: "openai.qiniu.com", Path: "/v1/voice/tts"}
	header := http.Header{
		"Authorization": []string{"Bearer " + os.Getenv("QINIU_API_KEY")},
		"VoiceType":     []string{voiceType},
	}

	ttsConn, _, err := websocket.DefaultDialer.DialContext(ctx, u.String(), header)
	if err != nil {
		log.Printf("连接TTS服务失败: %v", err)
		return fmt.Errorf("连接TTS服务失败: %w", err)
	}
	defer ttsConn.Close()
	log.Printf("TTS服务连接成功!")

	// 发送TTS请求
	ttsRequest := map[string]interface{}{
		"audio": map[string]interface{}{
			"voice_type":  voiceType,
			"encoding":    "mp3",
			"speed_ratio": 1.0,
		},
		"request": map[string]interface{}{
			"text": text,
		},
	}

	requestBytes, err := json.Marshal(ttsRequest)
	if err != nil {
		log.Printf("序列化TTS请求失败: %v", err)
		return fmt.Errorf("序列化TTS请求失败: %w", err)
	}

	log.Printf("发送TTS请求: 文本长度=%d, 请求体大小=%d字节", len(text), len(requestBytes))

	if err := ttsConn.WriteMessage(websocket.BinaryMessage, requestBytes); err != nil {
		log.Printf("发送TTS请求失败: %v", err)
		return fmt.Errorf("发送TTS请求失败: %w", err)
	}
	log.Printf("TTS请求发送成功!")

	// 接收TTS响应并转发给前端
	segmentCount := 0
	totalAudioSize := 0

	for {
		_, message, err := ttsConn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("TTS连接异常关闭: %v", err)
				return fmt.Errorf("TTS连接异常关闭: %w", err)
			}
			break
		}

		segmentCount++
		log.Printf("接收到TTS响应片段 #%d: 长度=%d字节", segmentCount, len(message))

		var ttsResp struct {
			Reqid     string `json:"reqid"`
			Operation string `json:"operation"`
			Sequence  int    `json:"sequence"`
			Data      string `json:"data"`
		}

		if err := json.Unmarshal(message, &ttsResp); err != nil {
			log.Printf("解析TTS响应失败: %v, 原始数据: %s", err, truncateText(string(message), 100))
			continue
		}

		log.Printf("解析TTS响应成功: Reqid=%s, Operation=%s, Sequence=%d, Data长度=%d",
			ttsResp.Reqid, ttsResp.Operation, ttsResp.Sequence, len(ttsResp.Data))

		// 解码base64音频数据
		audioData, err := base64.StdEncoding.DecodeString(ttsResp.Data)
		if err != nil {
			log.Printf("解码音频数据失败: %v", err)
			continue
		}

		totalAudioSize += len(audioData)
		log.Printf("音频片段 #%d: 原始大小=%d字节, 解码后大小=%d字节",
			segmentCount, len(ttsResp.Data), len(audioData))

		// 发送给前端
		resp := VoiceChatResponse{
			Type:    "audio",
			Data:    base64.StdEncoding.EncodeToString(audioData),
			Format:  "mp3",
			IsFinal: ttsResp.Sequence < 0,
		}

		respBytes, err := json.Marshal(resp)
		if err != nil {
			log.Printf("序列化响应失败: %v", err)
			continue
		}

		if err := conn.WriteMessage(websocket.TextMessage, respBytes); err != nil {
			log.Printf("发送音频数据失败: %v", err)
			return fmt.Errorf("发送音频数据失败: %w", err)
		}

		log.Printf("已发送音频片段 #%d 给前端: 大小=%d字节, 是否结束=%v",
			segmentCount, len(respBytes), ttsResp.Sequence < 0)

		// 如果是最后一个片段，结束循环
		if ttsResp.Sequence < 0 {
			log.Printf("接收到TTS结束标记! 总片段数=%d, 总音频大小=%d字节", segmentCount, totalAudioSize)
			break
		}
	}

	return nil
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

package service

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
)

// 七牛云TTS请求结构体
type QiniuTTSRequest struct {
	Audio struct {
		VoiceType  string  `json:"voice_type"`
		Encoding   string  `json:"encoding"`
		SpeedRatio float64 `json:"speed_ratio,omitempty"`
	} `json:"audio"`
	Request struct {
		Text string `json:"text"`
	} `json:"request"`
}

// 七牛云TTS响应结构体
type QiniuTTSResponse struct {
	Reqid     string `json:"reqid"`
	Operation string `json:"operation"`
	Sequence  int    `json:"sequence"`
	Data      string `json:"data"` // base64编码的音频数据
	Addition  struct {
		Duration string `json:"duration"`
	} `json:"addition,omitempty"`
}

// GenerateQiniuTTS 调用七牛云TTS服务生成语音
func GenerateQiniuTTS(text string, voiceType string, encoding string, speed float64) ([]byte, error) {
	apiKey := os.Getenv("QINIU_API_KEY")
	if apiKey == "" {
		return nil, errors.New("未配置七牛云API密钥")
	}

	// 验证文本长度
	if len([]rune(text)) < 1 {
		return nil, errors.New("文本不能为空")
	}
	if len([]rune(text)) > 500 {
		return nil, errors.New("文本长度不能超过500字")
	}

	// 构造请求体
	ttsReq := QiniuTTSRequest{
		Audio: struct {
			VoiceType  string  `json:"voice_type"`
			Encoding   string  `json:"encoding"`
			SpeedRatio float64 `json:"speed_ratio,omitempty"`
		}{
			VoiceType:  voiceType,
			Encoding:   encoding,
			SpeedRatio: speed,
		},
		Request: struct {
			Text string `json:"text"`
		}{
			Text: text,
		},
	}

	jsonData, err := json.Marshal(ttsReq)
	if err != nil {
		return nil, fmt.Errorf("JSON序列化失败: %w", err)
	}

	// 创建HTTP请求
	req, err := http.NewRequest(
		"POST",
		"https://openai.qiniu.com/v1/voice/tts",
		bytes.NewBuffer(jsonData),
	)
	if err != nil {
		return nil, fmt.Errorf("创建请求失败: %w", err)
	}

	// 设置请求头
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{
		Timeout: 60 * time.Second, // 增加超时时间
	}

	// 发送请求
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("API请求失败: %w", err)
	}
	defer resp.Body.Close()

	// 检查响应状态
	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("TTS API返回错误状态码: %d, 响应: %s", resp.StatusCode, string(bodyBytes))
	}

	// 解析响应
	var apiResponse QiniuTTSResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResponse); err != nil {
		return nil, fmt.Errorf("解析API响应失败: %w", err)
	}

	// 解码base64音频数据
	audioData, err := base64.StdEncoding.DecodeString(apiResponse.Data)
	if err != nil {
		return nil, fmt.Errorf("解码音频数据失败: %w", err)
	}

	return audioData, nil
}

// TTSHandler 处理TTS请求的API端点
func TTSHandler(c *gin.Context) {
	var request struct {
		Text     string  `json:"text" binding:"required"`
		Voice    string  `json:"voice,omitempty"`
		Encoding string  `json:"encoding,omitempty"`
		Speed    float64 `json:"speed,omitempty"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的请求参数"})
		return
	}

	// 设置默认值
	if request.Voice == "" {
		request.Voice = "qiniu_zh_female_wwxkjx"
	}
	if request.Encoding == "" {
		request.Encoding = "mp3"
	}
	if request.Speed == 0 {
		request.Speed = 1.0
	}

	audioData, err := GenerateQiniuTTS(request.Text, request.Voice, request.Encoding, request.Speed)
	if err != nil {
		log.Printf("TTS生成失败: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "语音生成失败: " + err.Error()})
		return
	}

	// 返回base64编码的音频URL
	c.JSON(http.StatusOK, gin.H{
		"audio_url": "data:audio/" + request.Encoding + ";base64," + base64.StdEncoding.EncodeToString(audioData),
	})
}

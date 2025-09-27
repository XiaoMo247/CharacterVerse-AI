package service

import (
	"Backend-CharacterVerse/database"
	"Backend-CharacterVerse/model"
	"context"
	"encoding/json"
	"fmt"
	"sort"
	"time"

	"github.com/go-redis/redis/v8"
)

type HistoryService struct{}

const (
	cacheDuration = 5 * time.Minute // 缓存时间5分钟
)

// RecentMessage 用于返回最近消息的结构体
type RecentMessage struct {
	RoleID      uint      `json:"role_id"`
	Content     string    `json:"content"`
	CreatedAt   time.Time `json:"created_at"`
	MessageType string    `json:"message_type"`       // text/voice/voice_call
	Duration    string    `json:"duration,omitempty"` // 语音通话时长
}

// 生成缓存键
func (s *HistoryService) allHistoriesKey(userID uint) string {
	return fmt.Sprintf("history:all:%d", userID)
}

func (s *HistoryService) roleHistoriesKey(userID, roleID uint) string {
	return fmt.Sprintf("history:role:%d:%d", userID, roleID)
}

func (s *HistoryService) recentMessagesKey(userID uint) string {
	return fmt.Sprintf("recent:messages:%d", userID)
}

// 从缓存获取数据
func (s *HistoryService) getFromCache(key string, result interface{}) bool {
	ctx := context.Background()
	val, err := database.RedisClient.Get(ctx, key).Result()
	if err == redis.Nil {
		return false // 缓存不存在
	} else if err != nil {
		fmt.Printf("Redis获取错误: %v\n", err)
		return false
	}

	if err := json.Unmarshal([]byte(val), result); err != nil {
		fmt.Printf("JSON解析错误: %v\n", err)
		return false
	}
	return true
}

// 保存数据到缓存
func (s *HistoryService) setToCache(key string, value interface{}) {
	ctx := context.Background()
	jsonData, err := json.Marshal(value)
	if err != nil {
		fmt.Printf("JSON序列化错误: %v\n", err)
		return
	}

	if err := database.RedisClient.Set(ctx, key, jsonData, cacheDuration).Err(); err != nil {
		fmt.Printf("Redis设置错误: %v\n", err)
	}
}

// 获取用户所有聊天记录（带缓存）
func (s *HistoryService) GetAllHistories(userID uint) ([]model.ChatHistory, []model.VoiceChatHistory, error) {
	cacheKey := s.allHistoriesKey(userID)

	// 尝试从缓存获取
	var cacheData struct {
		Text  []model.ChatHistory
		Voice []model.VoiceChatHistory
	}

	if s.getFromCache(cacheKey, &cacheData) {
		return cacheData.Text, cacheData.Voice, nil
	}

	// 缓存未命中，从数据库查询
	db := database.DB
	var textHistories []model.ChatHistory
	if err := db.Where("user_id = ?", userID).Find(&textHistories).Error; err != nil {
		return nil, nil, err
	}

	var voiceHistories []model.VoiceChatHistory
	if err := db.Where("user_id = ?", userID).Find(&voiceHistories).Error; err != nil {
		return nil, nil, err
	}

	// 保存到缓存
	cacheData = struct {
		Text  []model.ChatHistory
		Voice []model.VoiceChatHistory
	}{Text: textHistories, Voice: voiceHistories}
	s.setToCache(cacheKey, cacheData)

	return textHistories, voiceHistories, nil
}

// 获取特定角色聊天记录（带缓存）
func (s *HistoryService) GetHistoriesByRole(userID, roleID uint) ([]model.ChatHistory, []model.VoiceChatHistory, error) {
	cacheKey := s.roleHistoriesKey(userID, roleID)

	// 尝试从缓存获取
	var cacheData struct {
		Text  []model.ChatHistory
		Voice []model.VoiceChatHistory
	}

	if s.getFromCache(cacheKey, &cacheData) {
		return cacheData.Text, cacheData.Voice, nil
	}

	// 缓存未命中，从数据库查询
	db := database.DB
	var textHistories []model.ChatHistory
	if err := db.Where("user_id = ? AND role_id = ?", userID, roleID).Find(&textHistories).Error; err != nil {
		return nil, nil, err
	}

	var voiceHistories []model.VoiceChatHistory
	if err := db.Where("user_id = ? AND role_id = ?", userID, roleID).Find(&voiceHistories).Error; err != nil {
		return nil, nil, err
	}

	// 保存到缓存
	cacheData = struct {
		Text  []model.ChatHistory
		Voice []model.VoiceChatHistory
	}{Text: textHistories, Voice: voiceHistories}
	s.setToCache(cacheKey, cacheData)

	return textHistories, voiceHistories, nil
}

// GetRecentMessages 获取用户与所有角色的最近一条消息
func (s *HistoryService) GetRecentMessages(userID uint) ([]RecentMessage, error) {
	cacheKey := s.recentMessagesKey(userID)

	// 尝试从缓存获取
	var cachedMessages []RecentMessage
	if s.getFromCache(cacheKey, &cachedMessages) {
		return cachedMessages, nil
	}

	db := database.DB

	// 获取所有聊天记录（文本和语音消息）
	var chatHistories []model.ChatHistory
	if err := db.Where("user_id = ?", userID).
		Order("created_at DESC").
		Find(&chatHistories).Error; err != nil {
		return nil, err
	}

	// 获取所有语音通话记录
	var voiceCallHistories []model.VoiceChatHistory
	if err := db.Where("user_id = ?", userID).
		Order("created_at DESC").
		Find(&voiceCallHistories).Error; err != nil {
		return nil, err
	}

	// 按角色分组，获取每个角色的最新消息
	recentByRole := make(map[uint]RecentMessage)

	// 处理聊天记录（文本和语音消息）
	for _, history := range chatHistories {
		// 确定消息类型和内容
		msgType := history.MessageType
		content := history.Message

		if msgType == "voice" {
			// 语音消息使用转写文本
			content = history.ASRText
			if content == "" {
				content = "[语音消息]"
			}
		}

		if existing, exists := recentByRole[history.RoleID]; !exists || history.CreatedAt.After(existing.CreatedAt) {
			recentByRole[history.RoleID] = RecentMessage{
				RoleID:      history.RoleID,
				Content:     content,
				CreatedAt:   history.CreatedAt,
				MessageType: msgType,
			}
		}
	}

	// 处理语音通话记录
	for _, history := range voiceCallHistories {
		// 计算通话时长
		duration := history.EndTime.Sub(history.StartTime).Round(time.Second)

		if existing, exists := recentByRole[history.RoleID]; !exists || history.CreatedAt.After(existing.CreatedAt) {
			recentByRole[history.RoleID] = RecentMessage{
				RoleID:      history.RoleID,
				Content:     fmt.Sprintf("语音通话 (%s)", duration),
				CreatedAt:   history.CreatedAt,
				MessageType: "voice_call",
				Duration:    duration.String(),
			}
		}
	}

	// 转换为切片
	var recentMessages []RecentMessage
	for _, msg := range recentByRole {
		recentMessages = append(recentMessages, msg)
	}

	// 按时间倒序排序
	sort.Slice(recentMessages, func(i, j int) bool {
		return recentMessages[i].CreatedAt.After(recentMessages[j].CreatedAt)
	})

	// 保存到缓存
	s.setToCache(cacheKey, recentMessages)

	return recentMessages, nil
}

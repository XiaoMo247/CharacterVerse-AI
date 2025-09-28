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
	"gorm.io/gorm"
)

type HistoryService struct{}

const (
	cacheDuration = 5 * time.Minute // 缓存时间5分钟
)

// RecentMessage 用于返回最近消息的结构体
type RecentMessage struct {
	RoleID      uint       `json:"role_id"`
	Content     string     `json:"content"`
	CreatedAt   time.Time  `json:"created_at"`
	MessageType string     `json:"message_type"`       // text/voice/voice_call
	Duration    string     `json:"duration,omitempty"` // 语音通话时长
	Role        model.Role `json:"role"`               // 新增：完整的角色信息
}

// UnifiedChatHistory 统一格式的聊天记录结构体
type UnifiedChatHistory struct {
	ID           uint           `json:"id"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"deleted_at" gorm:"index"`
	UserID       uint           `json:"user_id"`
	RoleID       uint           `json:"role_id"`
	Message      string         `json:"message"`
	IsUser       bool           `json:"is_user"`
	MessageType  string         `json:"message_type"`
	VoiceURL     string         `json:"voice_url"`
	ASRText      string         `json:"asr_text"`
	ResponseType int            `json:"response_type"`
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

func (s *HistoryService) unifiedHistoriesKey(userID, roleID uint) string {
	return fmt.Sprintf("unified:history:%d:%d", userID, roleID)
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

// GetUnifiedHistoriesByRole 获取特定角色的统一格式聊天记录（带缓存）
func (s *HistoryService) GetUnifiedHistoriesByRole(userID, roleID uint) ([]UnifiedChatHistory, error) {
	cacheKey := s.unifiedHistoriesKey(userID, roleID)

	// 尝试从缓存获取
	var cachedHistories []UnifiedChatHistory
	if s.getFromCache(cacheKey, &cachedHistories) {
		return cachedHistories, nil
	}

	// 缓存未命中，从数据库查询
	db := database.DB

	// 获取文本聊天记录
	var textHistories []model.ChatHistory
	if err := db.Where("user_id = ? AND role_id = ?", userID, roleID).
		Order("created_at ASC"). // 按时间升序获取
		Find(&textHistories).Error; err != nil {
		return nil, err
	}

	// 获取语音聊天记录
	var voiceHistories []model.VoiceChatHistory
	if err := db.Where("user_id = ? AND role_id = ?", userID, roleID).
		Order("created_at ASC"). // 按时间升序获取
		Find(&voiceHistories).Error; err != nil {
		return nil, err
	}

	// 合并为统一格式并按时间排序
	unifiedHistories := s.mergeAndConvertHistories(textHistories, voiceHistories)

	// 保存到缓存
	s.setToCache(cacheKey, unifiedHistories)

	return unifiedHistories, nil
}

// mergeAndConvertHistories 合并文本和语音记录，并按时间排序
func (s *HistoryService) mergeAndConvertHistories(
	textHistories []model.ChatHistory,
	voiceHistories []model.VoiceChatHistory,
) []UnifiedChatHistory {
	// 使用双指针合并两个有序数组
	var unified []UnifiedChatHistory
	i, j := 0, 0

	for i < len(textHistories) || j < len(voiceHistories) {
		if i < len(textHistories) && j < len(voiceHistories) {
			// 比较两个记录的时间
			if textHistories[i].CreatedAt.Before(voiceHistories[j].CreatedAt) {
				unified = append(unified, convertTextHistory(textHistories[i]))
				i++
			} else {
				unified = append(unified, convertVoiceHistory(voiceHistories[j]))
				j++
			}
		} else if i < len(textHistories) {
			// 只有文本记录剩余
			unified = append(unified, convertTextHistory(textHistories[i]))
			i++
		} else {
			// 只有语音记录剩余
			unified = append(unified, convertVoiceHistory(voiceHistories[j]))
			j++
		}
	}

	return unified
}

// convertTextHistory 将文本记录转换为统一格式
func convertTextHistory(history model.ChatHistory) UnifiedChatHistory {
	return UnifiedChatHistory{
		ID:           history.ID,
		CreatedAt:    history.CreatedAt,
		UpdatedAt:    history.UpdatedAt,
		DeletedAt:    history.DeletedAt,
		UserID:       history.UserID,
		RoleID:       history.RoleID,
		Message:      history.Message,
		IsUser:       history.IsUser,
		MessageType:  history.MessageType,
		VoiceURL:     history.VoiceURL,
		ASRText:      history.ASRText,
		ResponseType: history.ResponseType,
	}
}

// convertVoiceHistory 将语音通话记录转换为统一格式
func convertVoiceHistory(history model.VoiceChatHistory) UnifiedChatHistory {
	duration := history.EndTime.Sub(history.StartTime).Round(time.Second)
	message := fmt.Sprintf("语音通话 (%s)", duration)

	return UnifiedChatHistory{
		ID:           history.ID,
		CreatedAt:    history.CreatedAt,
		UpdatedAt:    history.UpdatedAt,
		DeletedAt:    history.DeletedAt,
		UserID:       history.UserID,
		RoleID:       history.RoleID,
		Message:      message,
		IsUser:       true, // 语音通话总是用户发起的
		MessageType:  "voice_call",
		VoiceURL:     "", // 语音通话没有语音URL
		ASRText:      "", // 语音通话没有ASR文本
		ResponseType: 0,  // 语音通话没有回复类型
	}
}

// GetRecentMessages 获取用户与所有角色的最近一条消息及角色信息
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
	for roleID, msg := range recentByRole {
		// 获取角色信息
		var role model.Role
		if err := db.First(&role, roleID).Error; err == nil {
			msg.Role = role
		}
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

// 清除用户相关的缓存
func (s *HistoryService) ClearUserCache(userID uint) {
	ctx := context.Background()

	// 清除所有聊天记录缓存
	allKey := s.allHistoriesKey(userID)
	database.RedisClient.Del(ctx, allKey)

	// 清除最近消息缓存
	recentKey := s.recentMessagesKey(userID)
	database.RedisClient.Del(ctx, recentKey)

	// 清除角色历史缓存
	rolePattern := fmt.Sprintf("history:role:%d:*", userID)
	roleKeys, _ := database.RedisClient.Keys(ctx, rolePattern).Result()
	if len(roleKeys) > 0 {
		database.RedisClient.Del(ctx, roleKeys...)
	}

	// 清除统一格式历史缓存
	unifiedPattern := fmt.Sprintf("unified:history:%d:*", userID)
	unifiedKeys, _ := database.RedisClient.Keys(ctx, unifiedPattern).Result()
	if len(unifiedKeys) > 0 {
		database.RedisClient.Del(ctx, unifiedKeys...)
	}

	fmt.Printf("已清除用户 %d 的相关缓存\n", userID)
}

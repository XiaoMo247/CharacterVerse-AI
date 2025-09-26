package service

import (
	"Backend-CharacterVerse/database"
	"Backend-CharacterVerse/model"
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/go-redis/redis/v8"
)

type HistoryService struct{}

const (
	cacheDuration = 5 * time.Minute // 缓存时间5分钟
)

// 生成缓存键
func (s *HistoryService) allHistoriesKey(userID uint) string {
	return fmt.Sprintf("history:all:%d", userID)
}

func (s *HistoryService) roleHistoriesKey(userID, roleID uint) string {
	return fmt.Sprintf("history:role:%d:%d", userID, roleID)
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

package database

import (
	"Backend-CharacterVerse/model"
	"errors"
)

func GetRoleByID(roleID uint) (*model.Role, error) {
	var role model.Role
	result := DB.First(&role, roleID)
	if result.Error != nil {
		return nil, errors.New("角色不存在")
	}
	return &role, nil
}

func GetChatHistory(userID, roleID uint, limit int) ([]model.ChatHistory, error) {
	var history []model.ChatHistory
	result := DB.Where("user_id = ? AND role_id = ?", userID, roleID).
		Order("created_at desc").
		Limit(limit).
		Find(&history)

	if result.Error != nil {
		return nil, errors.New("获取历史记录失败")
	}

	// 反转顺序，使最旧的消息在前
	for i, j := 0, len(history)-1; i < j; i, j = i+1, j-1 {
		history[i], history[j] = history[j], history[i]
	}

	return history, nil
}

// 修改后的SaveChatMessage函数
func SaveChatMessage(userID, roleID uint, userMessage, messageType, voiceURL, aiResponse string) error {
	// 保存用户消息
	userHistory := model.ChatHistory{
		UserID:      userID,
		RoleID:      roleID,
		Message:     userMessage,
		IsUser:      true,
		MessageType: messageType,
		VoiceURL:    voiceURL,
		ASRText:     userMessage, // 对于语音消息，ASRText是识别后的文本
	}

	// 保存AI回复
	aiHistory := model.ChatHistory{
		UserID:      userID,
		RoleID:      roleID,
		Message:     aiResponse,
		IsUser:      false,
		MessageType: messageType,
		VoiceURL:    voiceURL,
		ASRText:     aiResponse,
	}

	tx := DB.Begin()
	if err := tx.Create(&userHistory).Error; err != nil {
		tx.Rollback()
		return err
	}

	if err := tx.Create(&aiHistory).Error; err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit().Error
}
func SaveUserMessage(userID, roleID uint, message, messageType, voiceURL string) error {
	history := model.ChatHistory{
		UserID:      userID,
		RoleID:      roleID,
		Message:     message,
		IsUser:      true,
		MessageType: messageType,
		VoiceURL:    voiceURL,
		ASRText:     message,
	}
	return DB.Create(&history).Error
}

// 保存AI文本消息
func SaveAITextMessage(userID, roleID uint, message string) error {
	history := model.ChatHistory{
		UserID:      userID,
		RoleID:      roleID,
		Message:     message,
		IsUser:      false,
		MessageType: "text",
		ASRText:     message,
	}
	return DB.Create(&history).Error
}

// 保存AI语音消息
func SaveAIVoiceMessage(userID, roleID uint, asrText, voiceURL string) error {
	history := model.ChatHistory{
		UserID:      userID,
		RoleID:      roleID,
		Message:     voiceURL, // 存储语音URL
		IsUser:      false,
		MessageType: "voice",
		VoiceURL:    voiceURL,
		ASRText:     asrText,
	}
	return DB.Create(&history).Error
}

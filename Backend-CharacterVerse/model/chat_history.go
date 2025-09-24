package model

import "gorm.io/gorm"

type ChatHistory struct {
	gorm.Model
	UserID      uint   `gorm:"index"` // 用户ID
	RoleID      uint   `gorm:"index"` // 角色ID
	Message     string // 消息内容
	IsUser      bool   // 是否为用户消息
	MessageType string `gorm:"type:enum('text','voice');default:'text'"` // 消息类型
	VoiceURL    string // 语音URL（如果是语音消息）
	ASRText     string // 语音转文字后的文本（如果是语音消息）
}

package model

import (
	"time"

	"gorm.io/gorm"
)

type VoiceChatHistory struct {
	gorm.Model
	UserID    uint      `gorm:"index" json:"user_id"`
	RoleID    uint      `gorm:"index" json:"role_id"`
	StartTime time.Time `json:"start_time"`
	EndTime   time.Time `json:"end_time"`
}

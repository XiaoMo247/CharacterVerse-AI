package model

import "gorm.io/gorm"

type UserRoleHistory struct {
	gorm.Model
	UserID  uint   `gorm:"index" json:"user_id"`
	RoleID  uint   `gorm:"index" json:"role_id"`
	Summary string `gorm:"type:text;charset=utf8mb4" json:"summary"` // 明确指定字符集
}

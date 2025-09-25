package model

import "gorm.io/gorm"

// 分页查询参数
type Pagination struct {
	Page     int `form:"page" binding:"min=1"`      // 页码，从1开始
	PageSize int `form:"page_size" binding:"min=1"` // 每页数量
}

// 分页查询结果
type PaginatedResult struct {
	Total   int64       `json:"total"`    // 总记录数
	List    interface{} `json:"list"`     // 当前页数据
	Page    int         `json:"page"`     // 当前页码
	Pages   int         `json:"pages"`    // 总页数
	HasMore bool        `json:"has_more"` // 是否有下一页
}

type Role struct {
	gorm.Model
	Name        string `gorm:"size:100;not null" json:"name"`               // 角色名称
	Description string `gorm:"type:text;not null" json:"description"`       // 角色描述
	UserID      uint   `gorm:"not null" json:"user_id"`                     // 关联的用户ID
	Gender      string `gorm:"size:10;not null;default:'未知'" json:"gender"` // 性别
	Age         int    `gorm:"not null;default:0" json:"age"`               // 年龄
	VoiceType   string `gorm:"size:50;not null" json:"voice_type"`          // 声音类型标识
}

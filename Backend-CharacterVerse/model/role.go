package model

import "gorm.io/gorm"

// 分页查询参数
type Pagination struct {
	Page     int `form:"page" binding:"min=0"`     // 修改为 min=0
	PageSize int `form:"pageSize" binding:"min=0"` // 修改为 min=0 并修正字段名
}

// 分页查询结果
type PaginatedResult struct {
	Total   int64       `json:"total"`    // 总记录数
	List    interface{} `json:"list"`     // 当前页数据
	Page    int         `json:"page"`     // 当前页码
	Pages   int         `json:"pages"`    // 总页数
	HasMore bool        `json:"has_more"` // 是否有下一页
}

// 角色标签类型
const (
	TagVirtualCharacter = "虚拟角色"
	TagHistorical       = "历史角色"
	TagMovie            = "电影角色"
	TagTVSeries         = "电视剧角色"
	TagGame             = "游戏角色"
	TagAnime            = "动漫角色"
	TagLiterature       = "文学角色"
	TagMythology        = "神话角色"
	TagCelebrity        = "名人角色"
	TagOriginal         = "原创角色"
)

// 有效角色标签列表
var ValidRoleTags = []string{
	TagVirtualCharacter,
	TagHistorical,
	TagMovie,
	TagTVSeries,
	TagGame,
	TagAnime,
	TagLiterature,
	TagMythology,
	TagCelebrity,
	TagOriginal,
}

type Role struct {
	gorm.Model
	Name        string `gorm:"size:100;not null" json:"name"`                  // 角色名称
	Description string `gorm:"type:text;not null" json:"description"`          // 角色描述
	UserID      uint   `gorm:"not null" json:"user_id"`                        // 关联的用户ID
	Gender      string `gorm:"size:10;not null;default:'未知'" json:"gender"`    // 性别
	Age         int    `gorm:"not null;default:0" json:"age"`                  // 年龄
	VoiceType   string `gorm:"size:50;not null" json:"voice_type"`             // 声音类型标识
	AvatarURL   string `gorm:"size:255;not null;default:''" json:"avatar_url"` // 头像URL
	Tag         string `gorm:"size:50;not null;default:'原创角色'" json:"tag"`     // 新增：角色标签
}

package service

import (
	"Backend-CharacterVerse/database"
	"Backend-CharacterVerse/model"
	"errors"

	"gorm.io/gorm"
)

// 预定义有效性别选项
var validGenders = map[string]bool{
	"男": true, "女": true, "其他": true, "未知": true,
}

func AddRole(userID uint, name, description, gender string, age int, voiceType string) (uint, error) {
	// 参数校验集中处理
	if name == "" {
		return 0, errors.New("角色名称不能为空")
	}
	if !validGenders[gender] {
		return 0, errors.New("无效的性别参数")
	}
	if age < 0 || age > 120 {
		return 0, errors.New("年龄必须在0-120之间")
	}
	if _, valid := model.GetVoiceInfo(voiceType); !valid {
		return 0, errors.New("无效的声音类型")
	}

	newRole := model.Role{
		Name:        name,
		Description: description,
		UserID:      userID,
		Gender:      gender,
		Age:         age,
		VoiceType:   voiceType,
	}

	if err := database.DB.Create(&newRole).Error; err != nil {
		return 0, err
	}

	return newRole.ID, nil
}

// 通用分页查询逻辑
func paginateRoles(query *gorm.DB, pagination model.Pagination) (*model.PaginatedResult, error) {
	var total int64
	var roles []model.Role

	// 获取总数
	if err := query.Model(&model.Role{}).Count(&total).Error; err != nil {
		return nil, err
	}

	// 计算分页
	offset := (pagination.Page - 1) * pagination.PageSize
	totalPages := (int(total) + pagination.PageSize - 1) / pagination.PageSize
	hasMore := pagination.Page < totalPages

	// 获取数据
	if err := query.
		Order("created_at DESC").
		Offset(offset).
		Limit(pagination.PageSize).
		Find(&roles).Error; err != nil {
		return nil, err
	}

	return &model.PaginatedResult{
		Total:   total,
		List:    roles,
		Page:    pagination.Page,
		Pages:   totalPages,
		HasMore: hasMore,
	}, nil
}

func GetRoles(pagination model.Pagination) (*model.PaginatedResult, error) {
	return paginateRoles(database.DB, pagination)
}

func GetRolesByUserID(userID uint, pagination model.Pagination) (*model.PaginatedResult, error) {
	query := database.DB.Where("user_id = ?", userID)
	return paginateRoles(query, pagination)
}

// 删除角色
func DeleteRole(roleID, userID uint) error {
	// 检查角色是否存在且属于当前用户
	var role model.Role
	result := database.DB.Where("id = ? AND user_id = ?", roleID, userID).First(&role)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return errors.New("角色不存在或您无权删除此角色")
		}
		return result.Error
	}

	// 执行删除
	if err := database.DB.Delete(&role).Error; err != nil {
		return err
	}

	return nil
}

// 更新角色
func UpdateRole(roleID, userID uint, updates map[string]interface{}) error {
	// 检查角色是否存在且属于当前用户
	var role model.Role
	result := database.DB.Where("id = ? AND user_id = ?", roleID, userID).First(&role)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return errors.New("角色不存在或您无权修改此角色")
		}
		return result.Error
	}

	// 验证更新字段
	validFields := map[string]bool{
		"name":        true,
		"description": true,
		"gender":      true,
		"age":         true,
		"voice_type":  true,
	}

	// 过滤无效字段
	cleanUpdates := make(map[string]interface{})
	for key, value := range updates {
		if validFields[key] {
			cleanUpdates[key] = value
		}
	}

	// 验证性别
	if gender, ok := cleanUpdates["gender"]; ok {
		if !validGenders[gender.(string)] {
			return errors.New("无效的性别参数")
		}
	}

	// 验证年龄
	if age, ok := cleanUpdates["age"]; ok {
		ageInt := int(age.(float64))
		if ageInt < 0 || ageInt > 120 {
			return errors.New("年龄必须在0-120之间")
		}
		cleanUpdates["age"] = ageInt
	}

	// 验证声音类型
	if voiceType, ok := cleanUpdates["voice_type"]; ok {
		if _, valid := model.GetVoiceInfo(voiceType.(string)); !valid {
			return errors.New("无效的声音类型")
		}
	}

	// 执行更新
	if err := database.DB.Model(&role).Updates(cleanUpdates).Error; err != nil {
		return err
	}

	return nil
}

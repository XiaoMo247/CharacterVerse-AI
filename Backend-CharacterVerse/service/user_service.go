package service

import (
	"Backend-CharacterVerse/database"
	"Backend-CharacterVerse/model"
	"Backend-CharacterVerse/utils"
	"errors"

	"golang.org/x/crypto/bcrypt"
)

func RegisterUser(username, password string) error {
	// 检查用户名是否已存在
	var existingUser model.User
	result := database.DB.Where("username = ?", username).First(&existingUser)
	if result.Error == nil {
		return errors.New("用户名已存在")
	}

	// 密码哈希处理
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	// 创建新用户
	newUser := model.User{
		Username: username,
		Password: string(hashedPassword),
	}

	if err := database.DB.Create(&newUser).Error; err != nil {
		return err
	}

	return nil
}

type LoginResponse struct {
	Token    string `json:"token"`
	UserID   uint   `json:"user_id"`
	Username string `json:"username"`
}

func LoginUser(username, password string) (*LoginResponse, error) {
	var user model.User
	result := database.DB.Where("username = ?", username).First(&user)
	if result.Error != nil {
		return nil, errors.New("用户不存在")
	}

	// 验证密码
	err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return nil, errors.New("密码错误")
	}

	// 生成JWT
	token, err := utils.GenerateToken(user.ID)
	if err != nil {
		return nil, err
	}

	// 返回包含用户信息的响应
	return &LoginResponse{
		Token:    token,
		UserID:   user.ID,
		Username: user.Username,
	}, nil
}

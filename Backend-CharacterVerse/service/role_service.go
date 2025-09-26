package service

import (
	"Backend-CharacterVerse/database"
	"Backend-CharacterVerse/model"
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"strings"
	"time"

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

	// 先创建角色（不带头像）
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

	// 异步生成头像
	go func(roleID uint, name, description string) {
		// 生成头像提示词
		prompt := fmt.Sprintf("角色头像：%s，%s", name, description)

		// 调用阿里云API生成头像（带重试）
		var imageURL string
		var err error
		for attempt := 1; attempt <= 3; attempt++ {
			log.Printf("尝试生成头像 (第 %d/3 次)", attempt)
			imageURL, err = generateAvatarWithAliyun(prompt)
			if err == nil {
				break
			}
			log.Printf("头像生成失败 (第 %d/3 次): %v", attempt, err)
			time.Sleep(2 * time.Second) // 重试前等待
		}

		if err != nil {
			log.Printf("头像生成最终失败: %v", err)
			return
		}

		// 下载生成的图片
		imageData, err := downloadImage(imageURL)
		if err != nil {
			log.Printf("图片下载失败: %v", err)
			return
		}

		// 上传到服务器（带重试）
		var avatarURL string
		for attempt := 1; attempt <= 3; attempt++ {
			log.Printf("尝试上传头像 (第 %d/3 次)", attempt)
			avatarURL, err = uploadImageToServer(imageData, fmt.Sprintf("%s_avatar.png", name))
			if err == nil {
				break
			}
			log.Printf("图片上传失败 (第 %d/3 次): %v", attempt, err)
			time.Sleep(2 * time.Second) // 重试前等待
		}

		if err != nil {
			log.Printf("图片上传最终失败: %v", err)
			return
		}

		// 更新角色头像URL
		if err := database.DB.Model(&model.Role{}).
			Where("id = ?", roleID).
			Update("avatar_url", avatarURL).Error; err != nil {
			log.Printf("更新头像URL失败: %v", err)
		} else {
			log.Printf("角色头像更新成功: %s", avatarURL)
		}
	}(newRole.ID, name, description)

	return newRole.ID, nil
}

// 调用阿里云API生成头像
func generateAvatarWithAliyun(prompt string) (string, error) {
	apiKey := os.Getenv("DASHSCOPE_API_KEY")
	if apiKey == "" {
		return "", errors.New("阿里云API密钥未配置")
	}

	// 调用阿里云API - 创建任务
	taskID, err := createImageTask(apiKey, prompt)
	if err != nil {
		return "", err
	}

	// 轮询获取任务结果
	return pollImageTask(apiKey, taskID)
}

// 创建图片生成任务
func createImageTask(apiKey, prompt string) (string, error) {
	url := "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis"

	payload := map[string]interface{}{
		"model": "wan2.2-t2i-flash", // 使用更快的极速版模型
		"input": map[string]interface{}{
			"prompt": prompt,
		},
		"parameters": map[string]interface{}{
			"size":          "1024*1024",
			"n":             1,
			"prompt_extend": true, // 开启智能提示词优化
		},
	}

	jsonData, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))

	// 添加必要请求头
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-DashScope-Async", "enable") // 必须添加的异步头

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("API请求失败: 状态码 %d, 响应: %s", resp.StatusCode, string(body))
	}

	body, _ := io.ReadAll(resp.Body)

	// 解析任务ID
	type TaskResponse struct {
		Output struct {
			TaskID string `json:"task_id"`
		} `json:"output"`
		Code    string `json:"code"`
		Message string `json:"message"`
	}

	var result TaskResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return "", fmt.Errorf("解析任务响应失败: %v, 响应体: %s", err, string(body))
	}

	if result.Code != "" {
		return "", fmt.Errorf("API错误: %s - %s", result.Code, result.Message)
	}

	if result.Output.TaskID == "" {
		return "", errors.New("未获取到任务ID")
	}

	log.Printf("任务创建成功, ID: %s", result.Output.TaskID)
	return result.Output.TaskID, nil
}

// 轮询任务结果
func pollImageTask(apiKey, taskID string) (string, error) {
	url := fmt.Sprintf("https://dashscope.aliyuncs.com/api/v1/tasks/%s", taskID)

	// 设置轮询参数
	maxAttempts := 50        // 最大尝试次数
	delay := 5 * time.Second // 每次轮询间隔

	for i := 0; i < maxAttempts; i++ {
		req, _ := http.NewRequest("GET", url, nil)
		req.Header.Set("Authorization", "Bearer "+apiKey)

		client := &http.Client{Timeout: 30 * time.Second}
		resp, err := client.Do(req)
		if err != nil {
			return "", err
		}

		if resp.StatusCode != http.StatusOK {
			resp.Body.Close()
			return "", fmt.Errorf("任务查询失败: 状态码 %d", resp.StatusCode)
		}

		body, _ := io.ReadAll(resp.Body)
		resp.Body.Close()

		// 解析任务状态
		type TaskStatusResponse struct {
			Output struct {
				TaskStatus string `json:"task_status"`
				Results    []struct {
					URL string `json:"url"`
				} `json:"results"`
			} `json:"output"`
			Code    string `json:"code"`
			Message string `json:"message"`
		}

		var status TaskStatusResponse
		if err := json.Unmarshal(body, &status); err != nil {
			// 如果解析失败，打印原始响应体
			log.Printf("解析任务状态失败: %v, 响应体: %s", err, string(body))
			return "", fmt.Errorf("解析任务状态失败: %v", err)
		}

		// 打印任务状态
		log.Printf("任务状态: %s, 等待中... (尝试 %d/%d)", status.Output.TaskStatus, i+1, maxAttempts)

		switch status.Output.TaskStatus {
		case "SUCCEEDED":
			if len(status.Output.Results) > 0 && status.Output.Results[0].URL != "" {
				log.Printf("任务成功完成, 图片URL: %s", status.Output.Results[0].URL)
				return status.Output.Results[0].URL, nil
			}
			return "", errors.New("任务成功但未获取到图片URL")

		case "FAILED", "CANCELED":
			return "", fmt.Errorf("任务失败: %s - %s", status.Code, status.Message)

		default: // PENDING, RUNNING
			time.Sleep(delay)
		}
	}

	return "", errors.New("任务超时未完成")
}

// 下载图片
func downloadImage(url string) ([]byte, error) {
	// 创建带超时的HTTP客户端
	client := &http.Client{
		Timeout: 60 * time.Second,
	}

	resp, err := client.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("图片下载失败: 状态码 %d", resp.StatusCode)
	}

	// 检查Content-Type是否为图片
	contentType := resp.Header.Get("Content-Type")
	if !strings.HasPrefix(contentType, "image/") {
		return nil, fmt.Errorf("下载的内容不是图片: %s", contentType)
	}

	return io.ReadAll(resp.Body)
}

// 上传图片到服务器
func uploadImageToServer(imageData []byte, filename string) (string, error) {
	// 创建表单数据
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	// 添加文件字段
	part, err := writer.CreateFormFile("file", filename)
	if err != nil {
		return "", err
	}

	if _, err := part.Write(imageData); err != nil {
		return "", err
	}

	// 关闭writer
	if err := writer.Close(); err != nil {
		return "", err
	}

	// 创建请求
	req, err := http.NewRequest("POST", "https://ai.mcell.top/api/upload_voice", body)
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	// 发送请求（增加超时时间）
	client := &http.Client{
		Timeout: 120 * time.Second, // 更长的超时时间
	}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	// 检查响应状态码
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("上传失败: 状态码 %d, 响应: %s", resp.StatusCode, string(body))
	}

	// 解析响应
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	type UploadResponse struct {
		Code     int    `json:"code"`
		Message  string `json:"message"`
		Filename string `json:"filename"`
		URL      string `json:"url"`
	}

	var result UploadResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return "", fmt.Errorf("解析上传响应失败: %v, 响应体: %s", err, string(respBody))
	}

	if result.Code != 0 {
		return "", fmt.Errorf("上传失败: %s (代码 %d)", result.Message, result.Code)
	}

	return fmt.Sprintf("https://ai.mcell.top%s", result.URL), nil
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

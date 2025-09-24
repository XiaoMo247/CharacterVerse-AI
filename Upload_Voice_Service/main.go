package main

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
)

func main() {
	router := gin.Default()

	// 添加CORS支持
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// 增加文件大小限制到64MB
	router.MaxMultipartMemory = 64 << 20

	// 创建上传目录（如果不存在）
	uploadDir := "./uploads"
	if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
		os.Mkdir(uploadDir, 0755)
	}

	// 设置文件上传路由
	router.POST("/api/upload_voice", func(c *gin.Context) {
		// 获取上传的文件
		file, err := c.FormFile("file")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "文件上传失败: " + err.Error()})
			return
		}

		// 验证文件类型（音频文件）
		allowedTypes := map[string]bool{
			".mp3": true, ".wav": true, ".ogg": true, ".flac": true,
		}
		ext := filepath.Ext(file.Filename)
		if !allowedTypes[ext] {
			c.JSON(http.StatusBadRequest, gin.H{"error": "不支持的文件类型"})
			return
		}

		// 生成唯一文件名
		newFilename := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
		filePath := filepath.Join(uploadDir, newFilename)

		// 保存文件
		if err := c.SaveUploadedFile(file, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "文件保存失败: " + err.Error()})
			return
		}

		// 返回成功响应
		c.JSON(http.StatusOK, gin.H{
			"message":  "文件上传成功",
			"filename": newFilename,
			"url":      fmt.Sprintf("/uploads/%s", newFilename),
		})
	})

	// 提供静态文件访问
	router.Static("/uploads", uploadDir)

	// 添加测试页面路由
	router.StaticFile("/upload-test", "./upload_test.html")

	// 启动服务器（监听所有接口）
	fmt.Println("服务器已启动，访问地址: http://localhost:6060")
	router.Run(":6060")
}

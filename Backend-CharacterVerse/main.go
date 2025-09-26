package main

import (
	"Backend-CharacterVerse/config"
	"Backend-CharacterVerse/database"
	"Backend-CharacterVerse/middleware"
	"Backend-CharacterVerse/router"
	"fmt"
	"log"

	"github.com/gin-gonic/gin"
)

func main() {
	config.LoadConfig()
	// 初始化数据库
	database.InitDB()

	// 初始化Redis
	database.InitRedis()

	// 程序退出时关闭连接
	defer func() {
		database.CloseRedis()
	}()

	// 创建Gin引擎
	r := gin.Default()
	r.Use(middleware.CorsMiddleware()) // 添加CORS中间件

	// 初始化路由
	router.RouterInit(r)

	// 启动服务
	fmt.Println("服务启动中，监听端口: 8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("服务启动失败: %v", err)
	}
}

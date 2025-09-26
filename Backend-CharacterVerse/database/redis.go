package database

import (
	"Backend-CharacterVerse/config"
	"context"
	"fmt"
	"time"

	"github.com/go-redis/redis/v8"
)

var RedisClient *redis.Client

func InitRedis() {
	cfg := config.LoadConfig()

	RedisClient = redis.NewClient(&redis.Options{
		Addr:         fmt.Sprintf("%s:%s", cfg.RedisHost, cfg.RedisPort), // Redis地址
		Password:     cfg.RedisPassword,                                  // Redis密码
		DB:           cfg.RedisDB,                                        // Redis数据库索引
		DialTimeout:  5 * time.Second,                                    // 连接超时
		ReadTimeout:  3 * time.Second,                                    // 读取超时
		WriteTimeout: 3 * time.Second,                                    // 写入超时
		PoolSize:     20,                                                 // 连接池大小
		MinIdleConns: 5,                                                  // 最小空闲连接数
	})

	// 测试连接
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if _, err := RedisClient.Ping(ctx).Result(); err != nil {
		panic(fmt.Sprintf("failed to connect to Redis: %v", err))
	}
}

// CloseRedis 关闭Redis连接
func CloseRedis() {
	if RedisClient != nil {
		_ = RedisClient.Close()
	}
}

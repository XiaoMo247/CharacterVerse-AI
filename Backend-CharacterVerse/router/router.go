package router

import (
	"Backend-CharacterVerse/api"
	"Backend-CharacterVerse/middleware"
	"Backend-CharacterVerse/service"

	"github.com/gin-gonic/gin"
)

func RouterInit(r *gin.Engine) {
	// 公共路由
	public := r.Group("/api")
	{
		public.POST("/user/register", api.Register)
		public.POST("/user/login", api.Login)
		public.POST("/tts", service.TTSHandler)
		public.POST("/asr", service.ASRHandler)
	}

	// 需要认证的路由
	auth := r.Group("/api")
	auth.Use(middleware.JWTAuth())
	{
		auth.POST("/user/addRole", api.AddRole)
		auth.GET("/ws/chat", api.ChatHandler)
	}
}

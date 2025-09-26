package router

import (
	"Backend-CharacterVerse/api"
	"Backend-CharacterVerse/middleware"

	"github.com/gin-gonic/gin"
)

func RouterInit(r *gin.Engine) {
	// 公共路由
	public := r.Group("/api")
	{
		public.POST("/user/register", api.Register)
		public.POST("/user/login", api.Login)
		public.GET("/voiceTypes", api.GetAllVoiceTypes)
	}

	// 需要认证的路由
	auth := r.Group("/api")
	auth.Use(middleware.JWTAuth())
	{
		auth.GET("/ws/chat", api.ChatHandler)
		auth.GET("/ws/voice_chat", api.VoiceChatHandler)

		roleGroup := auth.Group("/role")
		{
			roleGroup.POST("/add", api.AddRole)
			roleGroup.GET("/list", api.ListRoles)
			roleGroup.GET("/user/:user_id", api.GetRolesByUserID)
			roleGroup.DELETE("/:role_id", api.DeleteRole)
			roleGroup.PUT("/:role_id", api.UpdateRole)
		}
	}
}

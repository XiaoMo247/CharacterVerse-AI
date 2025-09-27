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
			roleGroup.GET("/user", api.GetRolesByUsername)
			roleGroup.GET("/tag", api.GetRolesByTag)
			roleGroup.GET("/search", api.SearchRoles)
			roleGroup.DELETE("/:role_id", api.DeleteRole)
			roleGroup.PUT("/:role_id", api.UpdateRole)
		}

		historyGroup := auth.Group("/history")
		{
			historyGroup.GET("/all", api.GetAllChatHistories)
			historyGroup.GET("/role/:role_id", api.GetChatHistoryByRole)
		}
	}
}

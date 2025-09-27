package api

import (
	"Backend-CharacterVerse/service"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// GetAllChatHistories 获取用户与所有角色的最近一条聊天记录
func GetAllChatHistories(c *gin.Context) {
	// 从JWT中获取用户ID
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户未认证"})
		return
	}

	// 将userID转换为uint类型
	uid, ok := userID.(uint)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "用户ID格式错误"})
		return
	}

	historyService := service.HistoryService{}
	recentMessages, err := historyService.GetRecentMessages(uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取最近消息失败"})
		return
	}

	c.JSON(http.StatusOK, recentMessages)
}

// GetChatHistoryByRole 获取特定角色的聊天记录
func GetChatHistoryByRole(c *gin.Context) {
	// 从JWT中获取用户ID
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户未认证"})
		return
	}

	uid, ok := userID.(uint)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "用户ID格式错误"})
		return
	}

	roleID, err := strconv.ParseUint(c.Param("role_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的角色ID"})
		return
	}

	historyService := service.HistoryService{}
	textHistories, voiceHistories, err := historyService.GetHistoriesByRole(uid, uint(roleID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取聊天记录失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"text_histories":  textHistories,
		"voice_histories": voiceHistories,
	})
}

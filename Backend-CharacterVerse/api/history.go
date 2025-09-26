package api

import (
	"Backend-CharacterVerse/service"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// GetAllChatHistories 获取用户所有聊天记录
func GetAllChatHistories(c *gin.Context) {
	userID, err := strconv.ParseUint(c.Param("user_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	historyService := service.HistoryService{}
	textHistories, voiceHistories, err := historyService.GetAllHistories(uint(userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch histories"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"text_histories":  textHistories,
		"voice_histories": voiceHistories,
	})
}

// GetChatHistoryByRole 获取特定角色的聊天记录
func GetChatHistoryByRole(c *gin.Context) {
	userID, err := strconv.ParseUint(c.Param("user_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	roleID, err := strconv.ParseUint(c.Param("role_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role ID"})
		return
	}

	historyService := service.HistoryService{}
	textHistories, voiceHistories, err := historyService.GetHistoriesByRole(uint(userID), uint(roleID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch histories"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"text_histories":  textHistories,
		"voice_histories": voiceHistories,
	})
}

package api

import (
	"Backend-CharacterVerse/service"
	"Backend-CharacterVerse/utils/response"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// GetAllChatHistories 获取用户与所有角色的最近一条聊天记录及角色信息
func GetAllChatHistories(c *gin.Context) {
	// 从JWT中获取用户ID
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(response.Unauthorized("用户未认证").Code, response.Unauthorized("用户未认证"))
		return
	}

	// 将userID转换为uint类型
	uid, ok := userID.(uint)
	if !ok {
		c.JSON(response.InternalError("用户ID格式错误").Code, response.InternalError("用户ID格式错误"))
		return
	}

	historyService := service.HistoryService{}
	recentMessages, err := historyService.GetRecentMessages(uid)
	if err != nil {
		c.JSON(response.InternalError("获取最近消息失败").Code, response.InternalError("获取最近消息失败"))
		return
	}

	c.JSON(http.StatusOK, response.Success(recentMessages))
}

// GetChatHistoryByRole 获取特定角色的聊天记录（统一格式数组）
func GetChatHistoryByRole(c *gin.Context) {
	// 从JWT中获取用户ID
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(response.Unauthorized("用户未认证").Code, response.Unauthorized("用户未认证"))
		return
	}

	uid, ok := userID.(uint)
	if !ok {
		c.JSON(response.InternalError("用户ID格式错误").Code, response.InternalError("用户ID格式错误"))
		return
	}

	roleID, err := strconv.ParseUint(c.Param("role_id"), 10, 32)
	if err != nil {
		c.JSON(response.BadRequest("无效的角色ID").Code, response.BadRequest("无效的角色ID"))
		return
	}

	historyService := service.HistoryService{}
	// 获取统一格式的聊天记录数组
	unifiedHistories, err := historyService.GetUnifiedHistoriesByRole(uid, uint(roleID))
	if err != nil {
		c.JSON(response.InternalError("获取聊天记录失败").Code, response.InternalError("获取聊天记录失败"))
		return
	}

	c.JSON(http.StatusOK, response.Success(unifiedHistories))
}

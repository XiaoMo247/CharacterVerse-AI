// api/voice_chat.go
package api

import (
	"Backend-CharacterVerse/service"
	"Backend-CharacterVerse/utils/response"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var voiceUpgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // 生产环境应限制来源
	},
}

func VoiceChatHandler(c *gin.Context) {
	// 验证JWT
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, response.Unauthorized("用户未认证"))
		return
	}

	// 升级为WebSocket连接
	conn, err := voiceUpgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.InternalError("WebSocket升级失败"))
		return
	}
	defer conn.Close()

	// 处理语音通话会话
	service.HandleVoiceChatSession(conn, userID.(uint))
}

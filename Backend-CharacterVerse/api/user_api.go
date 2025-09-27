package api

import (
	"Backend-CharacterVerse/service"
	"Backend-CharacterVerse/utils/response"
	"net/http"

	"github.com/gin-gonic/gin"
)

type RegisterRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.BadRequest("参数错误"))
		return
	}

	if err := service.RegisterUser(req.Username, req.Password); err != nil {
		c.JSON(http.StatusInternalServerError, response.InternalError(err.Error()))
		return
	}

	c.JSON(http.StatusOK, response.Success("注册成功"))
}

func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.BadRequest("参数错误"))
		return
	}

	// 获取包含用户信息的响应
	loginRes, err := service.LoginUser(req.Username, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Unauthorized(err.Error()))
		return
	}

	// 返回包含用户信息的响应
	c.JSON(http.StatusOK, response.Success(gin.H{
		"token":    loginRes.Token,
		"user_id":  loginRes.UserID,
		"username": loginRes.Username,
	}))
}

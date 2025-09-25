package api

import (
	"Backend-CharacterVerse/model"
	"Backend-CharacterVerse/service"
	"Backend-CharacterVerse/utils/response"
	"strconv"

	"github.com/gin-gonic/gin"
)

type AddRoleRequest struct {
	Name        string `json:"name" binding:"required,min=2,max=100"`
	Description string `json:"description" binding:"required,min=10"`
	Gender      string `json:"gender" binding:"required,oneof=男 女 其他 未知"`
	Age         int    `json:"age" binding:"required,min=0,max=120"`
	VoiceType   string `json:"voice_type" binding:"required"`
}

func AddRole(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(response.Unauthorized("用户未认证").Code, response.Unauthorized("用户未认证"))
		return
	}

	var req AddRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		resp := response.BadRequest("参数错误: " + err.Error())
		c.JSON(resp.Code, resp)
		return
	}

	roleID, err := service.AddRole(
		userID.(uint),
		req.Name,
		req.Description,
		req.Gender,
		req.Age,
		req.VoiceType,
	)
	if err != nil {
		resp := response.InternalError(err.Error())
		c.JSON(resp.Code, resp)
		return
	}

	resp := response.SuccessWithMessage("角色创建成功", gin.H{"role_id": roleID})
	c.JSON(resp.Code, resp)
}

// 公共分页参数处理
func parsePagination(c *gin.Context) (model.Pagination, *response.Response) {
	var pagination model.Pagination
	if err := c.ShouldBindQuery(&pagination); err != nil {
		return pagination, response.BadRequest("分页参数错误: " + err.Error())
	}

	// 设置默认值
	if pagination.Page == 0 {
		pagination.Page = 1
	}
	if pagination.PageSize == 0 {
		pagination.PageSize = 10
	}

	return pagination, nil
}

func ListRoles(c *gin.Context) {
	pagination, resp := parsePagination(c)
	if resp != nil {
		c.JSON(resp.Code, resp)
		return
	}

	result, err := service.GetRoles(pagination)
	if err != nil {
		resp := response.InternalError(err.Error())
		c.JSON(resp.Code, resp)
		return
	}

	c.JSON(response.Success(result).Code, response.Success(result))
}

func GetRolesByUserID(c *gin.Context) {
	pagination, resp := parsePagination(c)
	if resp != nil {
		c.JSON(resp.Code, resp)
		return
	}

	userIDStr := c.Param("user_id")
	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil || userID == 0 {
		resp := response.BadRequest("无效的用户ID")
		c.JSON(resp.Code, resp)
		return
	}

	result, err := service.GetRolesByUserID(uint(userID), pagination)
	if err != nil {
		resp := response.InternalError(err.Error())
		c.JSON(resp.Code, resp)
		return
	}

	c.JSON(response.Success(result).Code, response.Success(result))
}

// 删除角色
func DeleteRole(c *gin.Context) {
	// 从JWT获取用户ID
	currentUserID, exists := c.Get("userID")
	if !exists {
		c.JSON(response.Unauthorized("用户未认证").Code, response.Unauthorized("用户未认证"))
		return
	}

	// 获取角色ID
	roleIDStr := c.Param("role_id")
	roleID, err := strconv.ParseUint(roleIDStr, 10, 32)
	if err != nil {
		resp := response.BadRequest("无效的角色ID")
		c.JSON(resp.Code, resp)
		return
	}

	// 调用服务层删除
	err = service.DeleteRole(uint(roleID), currentUserID.(uint))
	if err != nil {
		resp := response.InternalError(err.Error())
		c.JSON(resp.Code, resp)
		return
	}

	resp := response.SuccessWithMessage("角色删除成功", nil)
	c.JSON(resp.Code, resp)
}

// 更新角色
func UpdateRole(c *gin.Context) {
	// 从JWT获取用户ID
	currentUserID, exists := c.Get("userID")
	if !exists {
		c.JSON(response.Unauthorized("用户未认证").Code, response.Unauthorized("用户未认证"))
		return
	}

	// 获取角色ID
	roleIDStr := c.Param("role_id")
	roleID, err := strconv.ParseUint(roleIDStr, 10, 32)
	if err != nil {
		resp := response.BadRequest("无效的角色ID")
		c.JSON(resp.Code, resp)
		return
	}

	// 解析更新数据
	var updateData map[string]interface{}
	if err := c.ShouldBindJSON(&updateData); err != nil {
		resp := response.BadRequest("参数错误: " + err.Error())
		c.JSON(resp.Code, resp)
		return
	}

	// 调用服务层更新
	err = service.UpdateRole(uint(roleID), currentUserID.(uint), updateData)
	if err != nil {
		resp := response.InternalError(err.Error())
		c.JSON(resp.Code, resp)
		return
	}

	resp := response.SuccessWithMessage("角色更新成功", nil)
	c.JSON(resp.Code, resp)
}

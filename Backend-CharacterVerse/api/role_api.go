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
	Tag         string `json:"tag" binding:"required"` // 新增标签字段
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
		req.Tag, // 新增标签参数
	)
	if err != nil {
		resp := response.InternalError(err.Error())
		c.JSON(resp.Code, resp)
		return
	}

	resp := response.SuccessWithMessage("角色创建成功", gin.H{"role_id": roleID})
	c.JSON(resp.Code, resp)
}

// 公共分页参数处理（修复版本）
func parsePagination(c *gin.Context) (model.Pagination, *response.Response) {
	var pagination model.Pagination

	// 手动获取参数（解决大小写问题）
	if pageStr := c.Query("page"); pageStr != "" {
		if page, err := strconv.Atoi(pageStr); err == nil {
			pagination.Page = page
		}
	}

	if pageSizeStr := c.Query("pageSize"); pageSizeStr != "" {
		if pageSize, err := strconv.Atoi(pageSizeStr); err == nil {
			pagination.PageSize = pageSize
		}
	}

	// 设置默认值
	if pagination.Page <= 0 {
		pagination.Page = 1
	}
	if pagination.PageSize <= 0 {
		pagination.PageSize = 10
	}

	// 添加最大限制
	if pagination.PageSize > 100 {
		pagination.PageSize = 100
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

// 通过用户名模糊查询角色
func GetRolesByUsername(c *gin.Context) {
	pagination, resp := parsePagination(c)
	if resp != nil {
		c.JSON(resp.Code, resp)
		return
	}

	// 从查询参数获取用户名
	username := c.Query("username")
	if username == "" {
		resp := response.BadRequest("必须提供用户名")
		c.JSON(resp.Code, resp)
		return
	}

	result, err := service.GetRolesByUsername(username, pagination)
	if err != nil {
		resp := response.InternalError(err.Error())
		c.JSON(resp.Code, resp)
		return
	}

	c.JSON(response.Success(result).Code, response.Success(result))
}

// 通过标签模糊查询角色
func GetRolesByTag(c *gin.Context) {
	pagination, resp := parsePagination(c)
	if resp != nil {
		c.JSON(resp.Code, resp)
		return
	}

	// 从查询参数获取标签
	tag := c.Query("tag")
	if tag == "" {
		resp := response.BadRequest("必须提供标签")
		c.JSON(resp.Code, resp)
		return
	}

	result, err := service.GetRolesByTag(tag, pagination)
	if err != nil {
		resp := response.InternalError(err.Error())
		c.JSON(resp.Code, resp)
		return
	}

	c.JSON(response.Success(result).Code, response.Success(result))
}

// 通过关键字模糊查询角色
func SearchRoles(c *gin.Context) {
	pagination, resp := parsePagination(c)
	if resp != nil {
		c.JSON(resp.Code, resp)
		return
	}

	// 从查询参数获取关键字
	keyword := c.Query("keyword")
	if keyword == "" {
		resp := response.BadRequest("必须提供关键字")
		c.JSON(resp.Code, resp)
		return
	}

	result, err := service.SearchRolesByKeyword(keyword, pagination)
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

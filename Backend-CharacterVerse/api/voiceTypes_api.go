package api

import (
	"Backend-CharacterVerse/model"
	"Backend-CharacterVerse/utils/response"

	"github.com/gin-gonic/gin"
)

func GetAllVoiceTypes(c *gin.Context) {
	// 获取所有声音类型信息
	voiceTypes := model.GetVoiceList()

	// 转换为前端需要的格式
	result := make([]gin.H, 0, len(voiceTypes))
	for _, info := range voiceTypes {
		result = append(result, gin.H{
			"voice_type": info.VoiceType,
			"voice_name": info.VoiceName,
			"category":   info.Category,
			"sample_url": info.URL,
		})
	}

	// 返回响应
	resp := response.Success(result)
	c.JSON(resp.Code, resp)
}

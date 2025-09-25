package model

// 声音类型常量
const (
	VoiceSweetTeacher           = "qiniu_zh_female_tmjxxy"    // 甜美教学小源
	VoiceCampusSister           = "qiniu_zh_female_xyqxxj"    // 校园清新学姐
	VoiceTutorBrother           = "qiniu_zh_male_ljfdxz"      // 邻家辅导学长
	VoiceTutorSister            = "qiniu_zh_female_ljfdxx"    // 邻家辅导学姐
	VoiceGentleTeacher          = "qiniu_zh_female_wwxkjx"    // 温婉学科讲师
	VoiceCampusGuide            = "qiniu_zh_male_szxyxd"      // 率真校园向导
	VoiceClassroomSisi          = "qiniu_zh_female_glktss"    // 干练课堂思思
	VoiceSubjectGuy             = "qiniu_zh_male_whxkxg"      // 温和学科小哥
	VoiceWarmSenior             = "qiniu_zh_male_wncwxz"      // 温暖沉稳学长
	VoiceCheerfulSupervisor     = "qiniu_zh_female_kljxdd"    // 开朗教学督导
	VoiceKnowledgeableTeacher   = "qiniu_zh_male_ybxknjs"     // 渊博学科男教师
	VoiceEnergeticKai           = "qiniu_zh_male_hlsnkk"      // 火力少年凯凯
	VoiceSunnyLecturer          = "qiniu_zh_male_tyygjs"      // 通用阳光讲师
	VoiceIntellectualTeacher    = "qiniu_zh_female_zxjxnjs"   // 知性教学女教师
	VoiceAussieEnglishFemale    = "qiniu_en_female_azyy"      // 澳洲英语女
	VoiceJapaneseSpanishFemale1 = "qiniu_multi_female_rxsyn1" // 日西双语女1
	VoiceJapaneseSpanishMale2   = "qiniu_multi_male_rxsyn2"   // 日西双语男2
	VoiceBritishEnglishMale     = "qiniu_en_male_ysyyn"       // 英式英语男
	VoiceBritishEnglishFemale   = "qiniu_en_female_ysyyn"     // 英式英语女
	VoiceAmericanEnglishFemale  = "qiniu_en_female_msyyn"     // 美式英语女
	VoiceAmericanEnglishMale    = "qiniu_en_male_msyyn"       // 美式英语男
	VoiceAussieEnglishMale      = "qiniu_en_male_azyyn"       // 澳洲英语男
	VoiceJapaneseSpanishMale1   = "qiniu_multi_male_rxsyn1"   // 日西双语男1
	VoiceJapaneseSpanishFemale2 = "qiniu_multi_female_rxsyn2" // 日西双语女2
	VoiceKindlyAdvisor          = "qiniu_zh_female_cxjxgw"    // 慈祥教学顾问
	VoiceCommunityAuntie        = "qiniu_zh_female_sqjyay"    // 社区教育阿姨
	VoiceAnimeSakura            = "qiniu_zh_female_dmytwz"    // 动漫樱桃丸子
	VoiceChildrenStoryFemale    = "qiniu_zh_female_segsby"    // 少儿故事配音
	VoiceRelaxedLazy            = "qiniu_zh_male_qslymb"      // 轻松懒音绵宝
	VoiceEnergeticMeng          = "qiniu_zh_male_hllzmz"      // 活力率真萌仔
	VoiceGentleCourseware       = "qiniu_zh_female_wwkjby"    // 温婉课件配音
	VoiceChildrenStoryBear      = "qiniu_zh_male_etgsxe"      // 儿童故事熊二
	VoiceCostumeDrama           = "qiniu_zh_male_gzjjxb"      // 古装剧教学版
	VoiceMagneticCourseware     = "qiniu_zh_male_cxkjns"      // 磁性课件男声
	VoiceFunKnowledge           = "qiniu_zh_female_qwzscb"    // 趣味知识传播
	VoiceClassicMonkeyKing      = "qiniu_zh_male_mzjsxg"      // 名著角色猴哥
	VoiceEnglishPeppa           = "qiniu_zh_female_yyqmpq"    // 英语启蒙佩奇
	VoiceGeniusBoy              = "qiniu_zh_male_tcsnsf"      // 天才少年示范
)

// VoiceInfo 声音类型信息结构
type VoiceInfo struct {
	VoiceName string `json:"voice_name"`
	VoiceType string `json:"voice_type"`
	URL       string `json:"url"`
	Category  string `json:"category"`
}

// GetVoiceList 获取所有可用声音类型
func GetVoiceList() []VoiceInfo {
	return []VoiceInfo{
		{
			VoiceName: "甜美教学小源",
			VoiceType: VoiceSweetTeacher,
			URL:       "https://aitoken-public.qnaigc.com/ai-voice/qiniu_zh_female_tmjxxy.mp3",
			Category:  "传统音色",
		},
		{
			VoiceName: "校园清新学姐",
			VoiceType: VoiceCampusSister,
			URL:       "https://aitoken-public.qnaigc.com/ai-voice/qiniu_zh_female_xyqxxj.mp3",
			Category:  "传统音色",
		},
		{
			VoiceName: "邻家辅导学长",
			VoiceType: VoiceTutorBrother,
			URL:       "https://aitoken-public.qnaigc.com/ai-voice/qiniu_zh_male_ljfdxz.mp3",
			Category:  "传统音色",
		},
		{
			VoiceName: "邻家辅导学姐",
			VoiceType: VoiceTutorSister,
			URL:       "https://aitoken-public.qnaigc.com/ai-voice/qiniu_zh_female_ljfdxx.mp3",
			Category:  "传统音色",
		},
		{
			VoiceName: "温婉学科讲师",
			VoiceType: VoiceGentleTeacher,
			URL:       "https://aitoken-public.qnaigc.com/ai-voice/qiniu_zh_female_wwxkjx.mp3",
			Category:  "传统音色",
		},
		{
			VoiceName: "率真校园向导",
			VoiceType: VoiceCampusGuide,
			URL:       "https://aitoken-public.qnaigc.com/ai-voice/qiniu_zh_male_szxyxd.mp3",
			Category:  "传统音色",
		},
		{
			VoiceName: "干练课堂思思",
			VoiceType: VoiceClassroomSisi,
			URL:       "https://aitoken-public.qnaigc.com/ai-voice/qiniu_zh_female_glktss.mp3",
			Category:  "传统音色",
		},
		{
			VoiceName: "温和学科小哥",
			VoiceType: VoiceSubjectGuy,
			URL:       "https://aitoken-public.qnaigc.com/ai-voice/qiniu_zh_male_whxkxg.mp3",
			Category:  "传统音色",
		},
		{
			VoiceName: "温暖沉稳学长",
			VoiceType: VoiceWarmSenior,
			URL:       "https://aitoken-public.qnaigc.com/ai-voice/qiniu_zh_male_wncwxz.mp3",
			Category:  "传统音色",
		},
		{
			VoiceName: "开朗教学督导",
			VoiceType: VoiceCheerfulSupervisor,
			URL:       "https://aitoken-public.qnaigc.com/ai-voice/qiniu_zh_female_kljxdd.mp3",
			Category:  "传统音色",
		},
		{
			VoiceName: "渊博学科男教师",
			VoiceType: VoiceKnowledgeableTeacher,
			URL:       "https://aitoken-public.qnaigc.com/ai-voice/qiniu_zh_male_ybxknjs.mp3",
			Category:  "传统音色",
		},
		{
			VoiceName: "火力少年凯凯",
			VoiceType: VoiceEnergeticKai,
			URL:       "https://aitoken-public.qnaigc.com/ai-voice/qiniu_zh_male_hlsnkk.mp3",
			Category:  "传统音色",
		},
		{
			VoiceName: "通用阳光讲师",
			VoiceType: VoiceSunnyLecturer,
			URL:       "https://aitoken-public.qnaigc.com/ai-voice/qiniu_zh_male_tyygjs.mp3",
			Category:  "传统音色",
		},
		{
			VoiceName: "知性教学女教师",
			VoiceType: VoiceIntellectualTeacher,
			URL:       "https://aitoken-public.qnaigc.com/ai-voice/qiniu_zh_female_zxjxnjs.mp3",
			Category:  "传统音色",
		},
		{
			VoiceName: "澳洲英语女",
			VoiceType: VoiceAussieEnglishFemale,
			URL:       "https://aitoken-public.qnaigc.com/ai-voice/qiniu_en_female_azyy.mp3",
			Category:  "双语音色",
		},
		{
			VoiceName: "日西双语女1",
			VoiceType: VoiceJapaneseSpanishFemale1,
			URL:       "https://aitoken-public.qnaigc.com/ai-voice/qiniu_multi_female_rxsyn1.mp3",
			Category:  "双语音色",
		},
		{
			VoiceName: "日西双语男2",
			VoiceType: VoiceJapaneseSpanishMale2,
			URL:       "https://aitoken-public.qnaigc.com/ai-voice/qiniu_multi_male_rxsyn2.mp3",
			Category:  "双语音色",
		},
		{
			VoiceName: "英式英语男",
			VoiceType: VoiceBritishEnglishMale,
			URL:       "https://aitoken-public.qnaigc.com/ai-voice/qiniu_en_male_ysyyn.mp3",
			Category:  "双语音色",
		},
		{
			VoiceName: "英式英语女",
			VoiceType: VoiceBritishEnglishFemale,
			URL:       "https://aitoken-public.qnaigc.com/ai-voice/qiniu_en_female_ysyyn.mp3",
			Category:  "双语音色",
		},
		{
			VoiceName: "美式英语女",
			VoiceType: VoiceAmericanEnglishFemale,
			URL:       "https://aitoken-public.qnaigc.com/ai-voice/qiniu_en_female_msyyn.mp3",
			Category:  "双语音色",
		},
		{
			VoiceName: "美式英语男",
			VoiceType: VoiceAmericanEnglishMale,
			URL:       "https://aitoken-public.qnaigc.com/ai-voice/qiniu_en_male_msyyn.mp3",
			Category:  "双语音色",
		},
		{
			VoiceName: "澳洲英语男",
			VoiceType: VoiceAussieEnglishMale,
			URL:       "https://aitoken-public.qnaigc.com/ai-voice/qiniu_en_male_azyyn.mp3",
			Category:  "双语音色",
		},
		{
			VoiceName: "日西双语男1",
			VoiceType: VoiceJapaneseSpanishMale1,
			URL:       "https://aitoken-public.qnaigc.com/ai-voice/qiniu_multi_male_rxsyn1.mp3",
			Category:  "双语音色",
		},
		{
			VoiceName: "日西双语女2",
			VoiceType: VoiceJapaneseSpanishFemale2,
			URL:       "https://aitoken-public.qnaigc.com/ai-voice/qiniu_multi_female_rxsyn2.mp3",
			Category:  "双语音色",
		},
		{
			VoiceName: "慈祥教学顾问",
			VoiceType: VoiceKindlyAdvisor,
			URL:       "https://aitoken-public.qnaigc.com/ai-voice/qiniu_zh_female_cxjxgw.mp3",
			Category:  "特殊音色",
		},
		{
			VoiceName: "社区教育阿姨",
			VoiceType: VoiceCommunityAuntie,
			URL:       "https://aitoken-public.qnaigc.com/ai-voice/qiniu_zh_female_sqjyay.mp3",
			Category:  "特殊音色",
		},
		{
			VoiceName: "动漫樱桃丸子",
			VoiceType: VoiceAnimeSakura,
			URL:       "https://aitoken-public.qnaigc.com/ai-voice/qiniu_zh_female_dmytwz.mp3",
			Category:  "特殊音色",
		},
		{
			VoiceName: "少儿故事配音",
			VoiceType: VoiceChildrenStoryFemale,
			URL:       "https://aitoken-public.qnaigc.com/ai-voice/qiniu_zh_female_segsby.mp3",
			Category:  "特殊音色",
		},
		{
			VoiceName: "轻松懒音绵宝",
			VoiceType: VoiceRelaxedLazy,
			URL:       "https://aitoken-public.qnaigc.com/ai-voice/qiniu_zh_male_qslymb.mp3",
			Category:  "特殊音色",
		},
		{
			VoiceName: "活力率真萌仔",
			VoiceType: VoiceEnergeticMeng,
			URL:       "https://aitoken-public.qnaigc.com/ai-voice/qiniu_zh_male_hllzmz.mp3",
			Category:  "特殊音色",
		},
		{
			VoiceName: "温婉课件配音",
			VoiceType: VoiceGentleCourseware,
			URL:       "https://aitoken-public.qnaigc.com/ai-voice/qiniu_zh_female_wwkjby.mp3",
			Category:  "特殊音色",
		},
		{
			VoiceName: "儿童故事熊二",
			VoiceType: VoiceChildrenStoryBear,
			URL:       "https://aitoken-public.qnaigc.com/ai-voice/qiniu_zh_male_etgsxe.mp3",
			Category:  "特殊音色",
		},
		{
			VoiceName: "古装剧教学版",
			VoiceType: VoiceCostumeDrama,
			URL:       "https://aitoken-public.qnaigc.com/ai-voice/qiniu_zh_male_gzjjxb.mp3",
			Category:  "特殊音色",
		},
		{
			VoiceName: "磁性课件男声",
			VoiceType: VoiceMagneticCourseware,
			URL:       "https://aitoken-public.qnaigc.com/ai-voice/qiniu_zh_male_cxkjns.mp3",
			Category:  "特殊音色",
		},
		{
			VoiceName: "趣味知识传播",
			VoiceType: VoiceFunKnowledge,
			URL:       "https://aitoken-public.qnaigc.com/ai-voice/qiniu_zh_female_qwzscb.mp3",
			Category:  "特殊音色",
		},
		{
			VoiceName: "名著角色猴哥",
			VoiceType: VoiceClassicMonkeyKing,
			URL:       "https://aitoken-public.qnaigc.com/ai-voice/qiniu_zh_male_mzjsxg.mp3",
			Category:  "特殊音色",
		},
		{
			VoiceName: "英语启蒙佩奇",
			VoiceType: VoiceEnglishPeppa,
			URL:       "https://aitoken-public.qnaigc.com/ai-voice/qiniu_zh_female_yyqmpq.mp3",
			Category:  "特殊音色",
		},
		{
			VoiceName: "天才少年示范",
			VoiceType: VoiceGeniusBoy,
			URL:       "https://aitoken-public.qnaigc.com/ai-voice/qiniu_zh_male_tcsnsf.mp3",
			Category:  "特殊音色",
		},
	}
}

// GetVoiceInfo 根据声音类型标识获取详细信息
func GetVoiceInfo(voiceType string) (VoiceInfo, bool) {
	for _, voice := range GetVoiceList() {
		if voice.VoiceType == voiceType {
			return voice, true
		}
	}
	return VoiceInfo{}, false
}

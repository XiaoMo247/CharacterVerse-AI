import { request } from "../../../utils/request";

// AI回复模板
const AI_RESPONSES = {
  1: [ // 小助手
    '我很乐意帮助您！有什么我可以为您做的吗？',
    '这是一个很好的问题，让我来为您解答。',
    '我理解您的需求，让我们一起来解决这个问题。',
    '感谢您的信任，我会尽力为您提供帮助。',
    '您说得很对，让我为您提供更多信息。'
  ],
  2: [ // 创意伙伴
    '哇，这个想法很有趣！让我们一起发挥创意吧！',
    '我有一个很棒的创意想法要和您分享！',
    '让我们用不同的角度来看待这个问题，也许会有意想不到的收获！',
    '创意无限！我们可以尝试一些全新的方法。',
    '太棒了！您的想法激发了我的灵感。'
  ],
  3: [ // 智慧导师
    '这是一个值得深入思考的问题，让我为您详细分析。',
    '从学术角度来看，我们可以这样理解这个概念。',
    '让我引用一些相关的理论来帮助您更好地理解。',
    '知识的海洋无边无际，让我们一起探索吧。',
    '您提出了一个很有深度的问题，值得我们仔细讨论。'
  ]
}

// 聊天服务
export const chatService = {
  // 发送消息并获取AI回复
  async sendMessage(characterId, message) {
    return new Promise((resolve) => {
      // 模拟网络延迟
      const delay = 1000 + Math.random() * 2000
      
      setTimeout(() => {
        const responses = AI_RESPONSES[characterId] || ['我明白了，让我想想如何回答您。']
        const randomResponse = responses[Math.floor(Math.random() * responses.length)]
        
        resolve({
          success: true,
          data: {
            content: randomResponse,
            timestamp: new Date().toLocaleTimeString(),
            characterId
          }
        })
      }, delay)
    })
  },

  // 获取聊天历史
  async getChatHistory(characterId, page = 1, limit = 50) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // 模拟分页数据
        resolve({
          success: true,
          data: {
            messages: [],
            pagination: {
              page,
              limit,
              total: 0,
              hasMore: false
            }
          }
        })
      }, 300)
    })
  },

  // 保存聊天记录
  async saveChatHistory(characterId, messages) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: {
            characterId,
            savedCount: messages.length
          },
          message: '聊天记录保存成功'
        })
      }, 200)
    })
  },

  // 删除聊天记录
  async deleteChatHistory(characterId) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: { characterId },
          message: '聊天记录删除成功'
        })
      }, 300)
    })
  },

  // 搜索聊天记录
  async searchMessages(keyword, characterId = null) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // 模拟搜索结果
        resolve({
          success: true,
          data: {
            keyword,
            results: [],
            total: 0
          }
        })
      }, 500)
    })
  }
}

// 角色服务
export const characterService = {
  // 获取可用角色列表
  async getAvailableCharacters() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: [
            {
              id: 1,
              name: '小助手',
              avatar: '🤖',
              personality: '友善、乐于助人',
              description: '一个贴心的AI助手，随时准备为您提供帮助和支持。',
              tags: ['助手', '友善', '智能'],
              online: true,
              responseTime: '通常在1-2秒内回复'
            },
            {
              id: 2,
              name: '创意伙伴',
              avatar: '🎨',
              personality: '创意、活泼',
              description: '充满创意的伙伴，能够激发您的灵感，一起探索无限可能。',
              tags: ['创意', '灵感', '艺术'],
              online: true,
              responseTime: '通常在2-3秒内回复'
            },
            {
              id: 3,
              name: '智慧导师',
              avatar: '📚',
              personality: '博学、耐心',
              description: '知识渊博的导师，耐心解答您的疑问，引导您学习成长。',
              tags: ['博学', '导师', '教育'],
              online: false,
              responseTime: '暂时离线'
            }
          ]
        })
      }, 400)
    })
  },

  // 获取角色详细信息
  async getCharacterDetails(characterId) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!characterId) {
          reject(new Error('角色ID不能为空'))
          return
        }

        resolve({
          success: true,
          data: {
            id: characterId,
            name: '角色名称',
            avatar: '🤖',
            personality: '性格描述',
            description: '详细描述',
            capabilities: ['能力1', '能力2', '能力3'],
            limitations: ['限制1', '限制2'],
            examples: [
              { input: '示例输入1', output: '示例输出1' },
              { input: '示例输入2', output: '示例输出2' }
            ]
          }
        })
      }, 300)
    })
  },

  // 更新角色在线状态
  async updateCharacterStatus(characterId, online) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: {
            characterId,
            online,
            updatedAt: new Date().toISOString()
          },
          message: `角色状态更新为${online ? '在线' : '离线'}`
        })
      }, 200)
    })
  }
}

// 实时通信服务
export const realtimeService = {
  // 模拟WebSocket连接
  connect(onMessage, onStatusChange) {
    console.log('建立实时连接...')
    
    // 模拟连接成功
    setTimeout(() => {
      onStatusChange && onStatusChange('connected')
    }, 1000)

    // 模拟接收消息
    const messageInterval = setInterval(() => {
      if (Math.random() > 0.95) { // 5%概率收到系统消息
        onMessage && onMessage({
          type: 'system',
          content: '系统消息：有新的角色上线了！',
          timestamp: new Date().toLocaleTimeString()
        })
      }
    }, 5000)

    // 返回断开连接的方法
    return () => {
      clearInterval(messageInterval)
      onStatusChange && onStatusChange('disconnected')
      console.log('实时连接已断开')
    }
  },

  // 发送实时消息
  sendRealtimeMessage(message) {
    console.log('发送实时消息:', message)
    return Promise.resolve({
      success: true,
      data: { messageId: Date.now() }
    })
  }
}

// 聊天统计服务
export const statsService = {
  // 获取聊天统计数据
  async getChatStats() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: {
            totalMessages: Math.floor(Math.random() * 1000) + 100,
            totalChats: Math.floor(Math.random() * 50) + 10,
            averageResponseTime: (Math.random() * 2 + 1).toFixed(1) + 's',
            activeCharacters: Math.floor(Math.random() * 5) + 2,
            todayMessages: Math.floor(Math.random() * 100) + 20
          }
        })
      }, 300)
    })
  },

  // 获取消息趋势数据
  async getMessageTrends(days = 7) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const data = Array.from({ length: days }, (_, i) => ({
          date: new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          messages: Math.floor(Math.random() * 100) + 20,
          characters: Math.floor(Math.random() * 5) + 1
        }))

        resolve({
          success: true,
          data
        })
      }, 400)
    })
  }
}

export const processAndSendAudio = async (formData) => {
    const res = await fetch('https://ai.mcell.top/api/upload_voice', {
    method: 'POST',
    body: formData
    // 不设置任何headers，让浏览器自动处理
  })
   const data = await res.json();
   return data
}
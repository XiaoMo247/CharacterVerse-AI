// Home页面相关的API服务
import { http } from '../../../utils/index'

// 模拟数据
const mockData = [
  { id: 1, type: 'character', name: '小助手', avatar: '🤖', description: '友善的AI助手' },
  { id: 2, type: 'character', name: '创意伙伴', avatar: '🎨', description: '充满创意的伙伴' },
  { id: 3, type: 'character', name: '智慧导师', avatar: '📚', description: '博学的导师' },
  { id: 4, type: 'chat', name: '与小助手的对话', content: '今天天气怎么样？', time: '2小时前' },
  { id: 5, type: 'chat', name: '创意讨论', content: '我们来聊聊艺术创作吧', time: '1天前' },
  { id: 6, type: 'feature', name: '角色管理', description: '创建和管理AI角色' },
  { id: 7, type: 'feature', name: '智能对话', description: '与AI角色对话交流' }
]

// 搜索服务
export const searchService = {
  // 全局搜索
  async search(keyword) {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!keyword.trim()) {
          resolve([])
          return
        }

        const results = mockData.filter(item => 
          item.name.toLowerCase().includes(keyword.toLowerCase()) ||
          (item.description && item.description.toLowerCase().includes(keyword.toLowerCase())) ||
          (item.content && item.content.toLowerCase().includes(keyword.toLowerCase()))
        )
        
        resolve(results)
      }, 300 + Math.random() * 500) // 模拟网络延迟
    })
  },

  // 获取搜索建议
  async getSuggestions(keyword) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const suggestions = mockData
          .filter(item => item.name.toLowerCase().includes(keyword.toLowerCase()))
          .slice(0, 5)
          .map(item => item.name)
        
        resolve(suggestions)
      }, 200)
    })
  }
}

// 统计数据服务
export const statsService = {
  // 获取首页统计数据
  async getHomeStats() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          totalCharacters: mockData.filter(item => item.type === 'character').length,
          totalChats: mockData.filter(item => item.type === 'chat').length,
          totalFeatures: mockData.filter(item => item.type === 'feature').length,
          activeUsers: Math.floor(Math.random() * 100) + 50,
          todayMessages: Math.floor(Math.random() * 500) + 100
        })
      }, 300)
    })
  },

  // 获取实时数据
  async getRealTimeData() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          onlineUsers: Math.floor(Math.random() * 20) + 5,
          activeChats: Math.floor(Math.random() * 10) + 2,
          systemStatus: 'healthy'
        })
      }, 100)
    })
  }
}

// 内容推荐服务
export const recommendService = {
  // 获取推荐角色
  async getRecommendedCharacters() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const characters = mockData.filter(item => item.type === 'character')
        resolve(characters.slice(0, 3))
      }, 200)
    })
  },

  // 获取热门功能
  async getPopularFeatures() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const features = mockData.filter(item => item.type === 'feature')
        resolve(features)
      }, 200)
    })
  }
}

export const searchList = async(params) => {
    const { get } = await import('../../../utils/request')
    const res = await get('/role/list', params)
    return res
}
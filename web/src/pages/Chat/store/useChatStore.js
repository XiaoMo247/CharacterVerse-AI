import { create } from 'zustand'

const useChatStore = create((set, get) => ({
  // 聊天状态
  selectedCharacter: null,
  messages: [],
  isTyping: false,
  inputValue: '',

  // 从URL跳转传入的角色
  pendingCharacter: null,

  // 角色列表
  characters: [
    {
      id: 1,
      name: '小助手',
      avatar: '🤖',
      personality: '友善、乐于助人',
      description: '一个贴心的AI助手，随时准备为您提供帮助和支持。',
      tags: ['助手', '友善', '智能'],
      online: true
    },
    {
      id: 2,
      name: '创意伙伴',
      avatar: '🎨',
      personality: '创意、活泼',
      description: '充满创意的伙伴，能够激发您的灵感，一起探索无限可能。',
      tags: ['创意', '灵感', '艺术'],
      online: true
    },
    {
      id: 3,
      name: '智慧导师',
      avatar: '📚',
      personality: '博学、耐心',
      description: '知识渊博的导师，耐心解答您的疑问，引导您学习成长。',
      tags: ['博学', '导师', '教育'],
      online: false
    }
  ],

  // 聊天历史记录
  chatHistory: {},

  // 设置待处理的角色（从URL跳转传入）
  setPendingCharacter: (character) => set({ pendingCharacter: character }),

  // 清除待处理的角色
  clearPendingCharacter: () => set({ pendingCharacter: null }),

  // 选择角色
  selectCharacter: (character) => set({ selectedCharacter: character }),

  // 添加角色到列表（如果不存在）
  addCharacterIfNotExists: (character) => {
    const { characters } = get()
    const exists = characters.find(c => c.id === character.id)
    
    if (!exists) {
      // 转换角色数据格式以适配聊天页面
      console.log(character,'character');
      const chatCharacter = {
        id: character.ID,
        name: character.name,
        avatar: character.avatar || character.name?.charAt(0) || '👤',
        personality: character.gender && character.age ? 
          `${character.gender === 'male' ? '男' : character.gender === 'female' ? '女' : character.gender}, ${character.age}岁` : 
          '未知',
        description: character.description,
        tags: [
          character.gender && (character.gender === 'male' ? '男性' : character.gender === 'female' ? '女性' : character.gender),
          character.age && `${character.age}岁`,
          character.voice_type
        ].filter(Boolean),
        online: true
      }
      
      set((state) => ({
        characters: [...state.characters, chatCharacter]
      }))
      
      return chatCharacter
    }
    
    return exists
  },

  // 处理待处理的角色
  processPendingCharacter: () => {
    const { pendingCharacter, addCharacterIfNotExists, selectCharacter, clearPendingCharacter } = get()
    
    if (pendingCharacter) {
      const character = addCharacterIfNotExists(pendingCharacter)
      selectCharacter(character)
      clearPendingCharacter()
      return character
    }
    
    return null
  }

}))

export default useChatStore
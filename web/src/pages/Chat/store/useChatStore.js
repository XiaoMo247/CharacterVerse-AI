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
  characters: [],

  // 聊天历史记录
  chatHistory: {},

  // 设置待处理的角色（从URL跳转传入）
  setPendingCharacter: (character) => set({ pendingCharacter: character }),

  // 清除待处理的角色
  clearPendingCharacter: () => set({ pendingCharacter: null }),

  // 选择角色
  selectCharacter: (character) =>{ 
    set({ selectedCharacter: character })
    },

  // 添加角色到列表（如果不存在）
  addCharacterIfNotExists: (character) => {
    const { characters } = get()
    const exists = characters.find(c => c.ID === character.ID)
    
    if (!exists) {
      // 转换角色数据格式以适配聊天页面
      const chatCharacter = {
        ID: character.ID,
        name: character.name,
        avatar_url: character.avatar_url || '',
        tags: [
          character.gender && (character.gender === 'male' ? '男性' : character.gender === 'female' ? '女性' : character.gender),
          character.age && `${character.age}岁`,

        ].filter(Boolean),
        online: true
      }
      const newCharacters = [...characters, chatCharacter]
      set({ characters: newCharacters })
      
      return chatCharacter
    }
    
    return exists
  },

  // 设置角色列表
  setCharacters: (characters) => set({ characters }),

  // 从历史消息中提取并设置角色列表
  setCharactersFromHistory: (historyData) => {
    if (!Array.isArray(historyData)) return

    // 提取唯一的角色信息
    const roleMap = new Map()
    
    historyData.forEach(message => {
      if (message.role && message.role.ID) {
        const role = message.role
        if (!roleMap.has(role.ID)) {
          const chatCharacter = {
            ID: role.ID,
            name: role.name || `角色${role.ID}`,
            avatar_url: role.avatar_url || '',
            tags: [
              role.gender && (role.gender === 'male' ? '男性' : role.gender === 'female' ? '女性' : role.gender),
              role.age && `${role.age}岁`,
            ].filter(Boolean),
            online: true
          }
          roleMap.set(role.ID, chatCharacter)
        }
      }
    })

    const characters = Array.from(roleMap.values())
    console.log('setCharactersFromHistory:', characters)
    set({ characters })
    return characters
  },

  // 处理待处理的角色
  processPendingCharacter: () => {
    const { pendingCharacter, addCharacterIfNotExists, selectCharacter, clearPendingCharacter } = get()
    
    if (pendingCharacter) {
      const character = addCharacterIfNotExists(pendingCharacter)
      console.log(character,'addCharacterIfNotExists')
      selectCharacter(character)
      clearPendingCharacter()
      return character
    }
    
    return null
  }

}))

export default useChatStore
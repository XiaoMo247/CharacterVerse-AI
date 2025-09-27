import { create } from 'zustand'

const useHomeStore = create((set, get) => ({
  // 搜索相关状态
  searchResults: [],
  isSearching: false,
  searchKeyword: '',

  // 角色列表相关状态
  characterList: [],
  isLoading: false,
  hasMore: false,
  currentPage: 1,
  pageSize: 10,
  total: 0,
  totalPages: 0,

  // 统计数据
  stats: {
    totalCharacters: 3,
    totalChats: 0,
    totalFeatures: 6
  },

  // 搜索功能
  setSearching: (loading) => set({ isSearching: loading }),
  
  setSearchResults: (results) => set({ searchResults: results }),
  
  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),

  // 清空搜索
  clearSearch: () => set({ 
    searchResults: [], 
    searchKeyword: '',
    isSearching: false 
  }),

  // 角色列表功能
  setLoading: (loading) => set({ isLoading: loading }),
  
  setCharacterList: (list, isAppend = false) => set((state) => ({
    characterList: isAppend ? [...state.characterList, ...list] : list
  })),
  
  setListData: (data) => set({
    total: data.total,
    totalPages: data.pages,
    hasMore: data.has_more,
    currentPage: data.page
  }),

  // 重置角色列表
  resetCharacterList: () => set({
    characterList: [],
    currentPage: 1,
    hasMore: false,
    total: 0,
    totalPages: 0
  }),

  // 加载下一页
  loadNextPage: () => set((state) => ({
    currentPage: state.currentPage + 1
  })),

  // 更新统计数据
  updateStats: (newStats) => set((state) => ({
    stats: { ...state.stats, ...newStats }
  })),

  // 增加聊天次数
  incrementChatCount: () => set((state) => ({
    stats: { 
      ...state.stats, 
      totalChats: state.stats.totalChats + 1 
    }
  }))
}))

export default useHomeStore
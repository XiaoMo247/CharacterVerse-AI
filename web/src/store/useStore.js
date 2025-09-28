import { create } from 'zustand'

// 主要的应用状态管理
const useStore = create((set, get) => ({
  // 用户状态
  user: null,
  isAuthenticated: false,
  
  // 应用状态
  loading: false,
  theme: 'light',
  
  // 计数器示例
  count: 0,
  
  // Actions
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  
  logout: () => set({ user: null, isAuthenticated: false }),
  
  setLoading: (loading) => set({ loading }),
  
  toggleTheme: () => set((state) => ({ 
    theme: state.theme === 'light' ? 'dark' : 'light' 
  })),
  
  increment: () => set((state) => ({ count: state.count + 1 })),
  
  decrement: () => set((state) => ({ count: state.count - 1 })),
  
  reset: () => set({ count: 0 }),
}))

export default useStore
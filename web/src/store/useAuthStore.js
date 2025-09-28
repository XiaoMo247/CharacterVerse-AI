import { create } from 'zustand'
import { userRegister,userLogin } from '../servers'
// 从localStorage获取存储的认证信息
const getStoredAuth = () => {
  try {
    const stored = localStorage.getItem('auth')
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

// 保存认证信息到localStorage
const saveAuth = (authData) => {
  try {
    localStorage.setItem('auth', JSON.stringify(authData))
  } catch (error) {
    console.error('Failed to save auth data:', error)
  }
}

// 清除认证信息
const clearAuth = () => {
  try {
    localStorage.removeItem('auth')
  } catch (error) {
    console.error('Failed to clear auth data:', error)
  }
}

export const useAuthStore = create((set, get) => {
  // 初始化时检查存储的认证信息
  const storedAuth = getStoredAuth()
  const initialState = {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false
  }

  if (storedAuth && storedAuth.token) {
      initialState.user = storedAuth.username
      initialState.token = storedAuth.token
      initialState.isAuthenticated = true
  }

  return {
    ...initialState,

    // 登录
    login: async (username, password, remember = true, loginType = '') => {
      set({ loading: true })
      
      try {
        if (loginType === 'github') {
          // 模拟GitHub登录
          const githubUser = {
            id: Date.now(),
            username: 'github_user',
            email: 'github@example.com',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=github',
            role: 'user',
            loginType: 'github'
          }
          
          const token = generateToken(githubUser)
          const authData = { token, remember }
          
          set({
            user: githubUser,
            token,
            isAuthenticated: true,
            loading: false
          })
          
          if (remember) {
            saveAuth(authData)
          }
          
          return true
        } else {
          // 登录验证
         const { data } = await userLogin({username, password})
         const token = data.token
         const user_id = data.user_id
            set({
              user: {
                username,
                user_id: data?.user_id,
              },
              token,
              isAuthenticated: true,
              loading: false
            })
            const authData = { token, username ,user_id}
            if (remember) {
              saveAuth(authData)
            }
            
            return true
        }
      } catch (error) {
        set({ loading: false })
        console.error('Login error:', error)
        return false
      }
    },

    // 注册
    register: async (username, password) => {
      set({ loading: true })
      
      try {
        await userRegister({username, password})
        set({ loading: false })
        return true
      } catch (error) {
        set({ loading: false })
        console.error('Register error:', error)
        return false
      }
    },

    // 登出
    logout: () => {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false
      })
      clearAuth()
    },

    // 检查认证状态
    checkAuth: () => {
      const { token } = get()
      if (!token) {
        // Token过期，清除认证状态
        get().logout()
        return false
      }
      return !!token
    }
  }
})
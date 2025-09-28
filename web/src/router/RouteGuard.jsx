import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

// 路由守卫组件 - 处理需要认证的路由
function RouteGuard({ children, requiresAuth = false }) {
  const { isAuthenticated, checkAuth } = useAuthStore()
  const location = useLocation()

  useEffect(() => {
    // 检查认证状态
    checkAuth()
  }, [checkAuth])

  // 对于需要认证的路由，AuthGuard会在App层面处理登录弹窗
  // 这里只需要渲染子组件
  return children
}

export default RouteGuard
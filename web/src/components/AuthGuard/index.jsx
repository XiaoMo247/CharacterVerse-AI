import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import LoginModal from '../LoginModal'

// 需要登录才能访问的路由
const protectedRoutes = [
  '/chat',
  '/characters',
  '/profile',
  '/settings'
]

// 检查路由是否需要认证
const isProtectedRoute = (pathname) => {
  return protectedRoutes.some(route => pathname.startsWith(route))
}

const AuthGuard = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, checkAuth } = useAuthStore()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [pendingRoute, setPendingRoute] = useState(null)

  useEffect(() => {
    // 检查认证状态
    const isAuth = checkAuth()
    
    // 如果当前路由需要认证且用户未登录
    if (isProtectedRoute(location.pathname) && !isAuth) {
      setPendingRoute(location.pathname)
      setShowLoginModal(true)
    }
  }, [location.pathname, checkAuth])

  useEffect(() => {
    // 用户登录成功后，跳转到之前想访问的路由
    if (isAuthenticated && pendingRoute) {
      setShowLoginModal(false)
      setPendingRoute(null)
      navigate(pendingRoute)
    }
  }, [isAuthenticated, pendingRoute, navigate])

  const handleLoginModalCancel = () => {
    setShowLoginModal(false)
    setPendingRoute(null)
    
    // 如果用户取消登录且当前在受保护的路由，跳转到首页
    if (isProtectedRoute(location.pathname)) {
      navigate('/')
    }
  }

  return (
    <>
      {children}
      <LoginModal
        visible={showLoginModal}
        onCancel={handleLoginModalCancel}
      />
    </>
  )
}

export default AuthGuard
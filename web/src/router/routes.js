import { lazy } from 'react'

// 懒加载页面组件
const Home = lazy(() => import('../pages/Home'))
const CharacterManagement = lazy(() => import('../pages/CharacterManagement'))
const Chat = lazy(() => import('../pages/Chat'))
const Profile = lazy(() => import('../pages/Profile'))
const Settings = lazy(() => import('../pages/Settings'))
const VoiceDemo = lazy(() => import('../pages/VoiceDemo'))

// 路由配置表
export const routes = [
  {
    path: '/',
    element: Home,
    name: 'home',
    title: '首页',
    icon: '🏠',
    showInNav: true,
    meta: {
      requiresAuth: false,
      description: '应用首页'
    }
  },
  {
    path: '/characters',
    element: CharacterManagement,
    name: 'characters',
    title: '角色管理',
    icon: '👤',
    showInNav: true,
    meta: {
      requiresAuth: true,
      description: '管理您的AI角色'
    }
  },
  {
    path: '/chat',
    element: Chat,
    name: 'chat',
    title: '智能聊天',
    icon: '💬',
    showInNav: true,
    meta: {
      requiresAuth: true,
      description: '与AI角色对话'
    }
  },
  {
    path: '/profile',
    element: Profile,
    name: 'profile',
    title: '个人资料',
    icon: '👤',
    showInNav: false,
    meta: {
      requiresAuth: true,
      description: '查看和编辑个人资料'
    }
  },
  {
    path: '/settings',
    element: Settings,
    name: 'settings',
    title: '设置',
    icon: '⚙️',
    showInNav: false,
    meta: {
      requiresAuth: true,
      description: '应用设置和偏好'
    }
  },
  {
    path: '/voice-demo',
    element: VoiceDemo,
    name: 'voiceDemo',
    title: '语音录音演示',
    icon: '🎵',
    showInNav: true,
    meta: {
      requiresAuth: false,
      description: '类似QQ/微信的语音录音波形效果演示'
    }
  }
]

// 获取导航路由
export const getNavRoutes = () => {
  return routes.filter(route => route.showInNav)
}

// 根据路径获取路由
export const getRouteByPath = (path) => {
  return routes.find(route => route.path === path)
}

// 根据名称获取路由
export const getRouteByName = (name) => {
  return routes.find(route => route.name === name)
}
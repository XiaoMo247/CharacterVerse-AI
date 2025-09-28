import { useState } from 'react'
import { 
  Avatar, 
  Dropdown, 
  Space, 
  Typography, 
  Button,
  Divider
} from 'antd'
import { 
  UserOutlined, 
  SettingOutlined, 
  LogoutOutlined,
  LoginOutlined,
  ProfileOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import LoginModal from '../LoginModal'

const { Text } = Typography

const UserAvatar = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuthStore()
  const [showLoginModal, setShowLoginModal] = useState(false)

  const handleLogin = () => {
    setShowLoginModal(true)
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleProfile = () => {
    navigate('/profile')
  }

  const handleSettings = () => {
    navigate('/settings')
  }

  // 未登录状态的菜单
  const guestMenuItems = [
    {
      key: 'login',
      icon: <LoginOutlined />,
      label: '登录',
      onClick: handleLogin
    }
  ]

  // 已登录状态的菜单
  const userMenuItems = [
    {
      key: 'profile',
      icon: <ProfileOutlined />,
      label: '个人资料',
      onClick: handleProfile
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
      onClick: handleSettings
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
      danger: true
    }
  ]

  const menuItems = isAuthenticated ? userMenuItems : guestMenuItems

  const dropdownRender = (menu) => (
    <div style={{ minWidth: 160 }}>
      {isAuthenticated && (
        <>
          <div style={{ padding: '12px 16px' }}>
            <Space direction="vertical" size={4}>
              <Text strong>{user?.username}</Text>
              <Text type="secondary" style={{ fontSize: '0.75rem' }}>
                {user?.email}
              </Text>
            </Space>
          </div>
          <Divider style={{ margin: 0 }} />
        </>
      )}
      {menu}
    </div>
  )

  return (
    <>
      <Dropdown
        menu={{ items: menuItems }}
        placement="bottomRight"
        trigger={['click']}
        dropdownRender={dropdownRender}
      >
        <div style={{ cursor: 'pointer' }}>
          {isAuthenticated ? (
            <Space>
              <Avatar
                size={32}
                src={user?.avatar}
                icon={<UserOutlined />}
              />
              <Text style={{ color: 'var(--text-primary)' }}>
                {user?.username}
              </Text>
            </Space>
          ) : (
            <Button
              type="text"
              icon={<UserOutlined />}
              onClick={handleLogin}
            >
              登录
            </Button>
          )}
        </div>
      </Dropdown>

      <LoginModal
        visible={showLoginModal}
        onCancel={() => setShowLoginModal(false)}
      />
    </>
  )
}

export default UserAvatar
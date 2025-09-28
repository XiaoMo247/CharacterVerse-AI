import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button, Tooltip } from 'antd'
import { 
  HomeOutlined, 
  UserOutlined, 
  MessageOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons'
import { getNavRoutes } from '../router'
import UserAvatar from './UserAvatar'
import './Sidebar.css'

const Sidebar = () => {
  const location = useLocation()
  const navRoutes = getNavRoutes()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    // 设置 CSS 变量来控制侧边栏宽度
    document.documentElement.style.setProperty(
      '--sidebar-width', 
      collapsed ? '4rem' : '16rem'
    )
  }, [collapsed])

  // 图标映射
  const iconMap = {
    '🏠': <HomeOutlined />,
    '👤': <UserOutlined />,
    '💬': <MessageOutlined />
  }

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* 应用标题 */}
      <div className="sidebar-header">
        <div className="app-logo">
          <span className="logo-icon"></span>
          {!collapsed && <h2 className="app-title">AI模拟宇宙</h2>}
        </div>
      </div>

      {/* 导航菜单 */}
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {navRoutes.map(route => (
            <li key={route.path} className="nav-item">
              <Link
                to={route.path}
                className={`nav-link ${location.pathname === route.path ? 'active' : ''}`}
                title={collapsed ? route.title : route.meta?.description}
              >
                <span className="nav-icon">
                  {iconMap[route.icon] || route.icon}
                </span>
                {!collapsed && <span className="nav-text">{route.title}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* 用户信息 */}
      <div className="sidebar-footer">
        <div className="user-section">
          {!collapsed && <UserAvatar />}
        </div>
      </div>
        {/* 折叠按钮 */}
        <Tooltip title={collapsed ? '展开侧边栏' : '折叠侧边栏'} placement="right">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="sidebar-toggle"
          />
        </Tooltip>
    </div>
  )
}

export default Sidebar
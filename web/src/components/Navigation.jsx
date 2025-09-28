import { Link, useLocation } from 'react-router-dom'
import useStore from '../store/useStore'
import { getNavRoutes } from '../router'
import './Navigation.css'

function Navigation() {
  const location = useLocation()
  const { isAuthenticated, user, theme } = useStore()
  const navRoutes = getNavRoutes()

  const isActive = (path) => location.pathname === path

  return (
    <nav className={`navigation ${theme}`}>
      <div className="nav-container">
        <div className="nav-brand">
          <Link to="/">React App</Link>
        </div>
        
        <div className="nav-links">
          {navRoutes.map((route) => (
            <Link 
              key={route.path}
              to={route.path} 
              className={isActive(route.path) ? 'active' : ''}
              title={route.meta?.description}
            >
              <span className="nav-icon">{route.icon}</span>
              <span className="nav-text">{route.title}</span>
            </Link>
          ))}
        </div>

        <div className="nav-status">
          {isAuthenticated ? (
            <span className="user-status">
              👋 {user.name}
            </span>
          ) : (
            <span className="user-status">
              未登录
            </span>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navigation
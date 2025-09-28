import { useEffect } from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { ConfigProvider, theme } from 'antd'
import Sidebar from './components/Sidebar'
import ThemeController from './components/ThemeController'
import AuthGuard from './components/AuthGuard'
import { RouterView } from './router'
import useThemeStore from './store/useThemeStore'
import 'antd/dist/reset.css'
import './styles/variables.css'
import './App.css'

function App() {
  const { theme: currentTheme, customColors, initTheme } = useThemeStore()

  // 初始化主题
  useEffect(() => {
    initTheme()
  }, [initTheme])

  // 设置全局主题属性
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme)
  }, [currentTheme])

  return (
    <ConfigProvider
      theme={{
        algorithm: currentTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: customColors.primary,
          colorSuccess: customColors.success,
          colorWarning: customColors.warning,
          colorError: customColors.error,
          colorInfo: customColors.info,
          borderRadius: 6,
        },
      }}
    >
      <Router>
        <AuthGuard>
          <div className={`app ${currentTheme === 'dark' ? 'dark' : ''}`}>
            <Sidebar />
            <main className="main-content">
              <RouterView />
            </main>
            <ThemeController />
          </div>
        </AuthGuard>
      </Router>
    </ConfigProvider>
  )
}

export default App
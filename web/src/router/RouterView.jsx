import { Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { routes } from './routes'

// 加载中组件
const LoadingComponent = () => (
  <div style={{ 
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '12.5rem',
    fontSize: 'var(--font-size-lg)',
    color: 'var(--text-secondary)'
  }}>
    <div>
      <div style={{ marginBottom: 'var(--spacing-md)', fontSize: '2rem' }}>⏳</div>
      <div>加载中...</div>
    </div>
  </div>
)

// 路由视图组件 - 根据路由表渲染路由
function RouterView() {
  return (
    <Suspense fallback={<LoadingComponent />}>
      <Routes>
        {routes.map((route) => {
          const Component = route.element
          return (
            <Route
              key={route.path}
              path={route.path}
              element={<Component />}
            />
          )
        })}
        {/* 404 页面 */}
        <Route 
          path="*" 
          element={
            <div style={{ 
              textAlign: 'center', 
              padding: 'var(--spacing-xl)',
              color: 'var(--text-secondary)'
            }}>
              <h1 style={{ fontSize: 'var(--font-size-xxl)', marginBottom: 'var(--spacing-md)' }}>404</h1>
              <p style={{ fontSize: 'var(--font-size-base)', marginBottom: 'var(--spacing-lg)' }}>页面未找到</p>
              <a href="/" style={{ 
                color: 'var(--primary-color)', 
                textDecoration: 'none',
                fontSize: 'var(--font-size-base)'
              }}>
                返回首页
              </a>
            </div>
          } 
        />
      </Routes>
    </Suspense>
  )
}

export default RouterView
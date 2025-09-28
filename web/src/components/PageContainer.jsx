import { Layout } from 'antd'
import './PageContainer.css'

const { Content } = Layout

const PageContainer = ({ 
  children, 
  title, 
  description, 
  className = '',
  style = {},
  centered = false,
  extra
}) => {
  return (
    <Content 
      className={`page-container ${centered ? 'page-container-centered' : ''} ${className}`} 
      style={style}
    >
      {(title || description || extra) && (
        <div className="page-header">
          <div className="page-header-content">
            {(title || description) && (
              <div className="page-header-text">
                {title && <h1 className="page-title">{title}</h1>}
                {description && <p className="page-description">{description}</p>}
              </div>
            )}
            {extra && <div className="page-header-extra">{extra}</div>}
          </div>
        </div>
      )}
      <div className="page-content">
        {children}
      </div>
    </Content>
  )
}

export default PageContainer
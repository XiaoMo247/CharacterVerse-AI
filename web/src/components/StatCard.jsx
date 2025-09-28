import { Card, Statistic, Space, Button } from 'antd'
import './StatCard.css'

const StatCard = ({ 
  title,
  value,
  suffix,
  prefix,
  icon,
  actions = [],
  className = '',
  ...props 
}) => {
  return (
    <Card className={`stat-card ${className}`} {...props}>
      <Statistic
        title={title}
        value={value}
        suffix={suffix}
        prefix={prefix || (icon && <span style={{ fontSize: '1.5rem' }}>{icon}</span>)}
        valueStyle={{ 
          color: 'var(--primary-color)',
          fontSize: 'var(--font-size-xl)',
          fontWeight: 'var(--font-weight-bold)'
        }}
      />
      {actions.length > 0 && (
        <div className="stat-actions">
          <Space>
            {actions.map((action, index) => (
              <Button
                key={index}
                type={action.type || 'default'}
                size={action.size || 'small'}
                icon={action.icon}
                onClick={action.onClick}
                danger={action.danger}
              >
                {action.text}
              </Button>
            ))}
          </Space>
        </div>
      )}
    </Card>
  )
}

export default StatCard
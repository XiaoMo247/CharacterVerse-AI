import { useState } from 'react'
import { 
  Card, 
  Switch, 
  Select, 
  Button, 
  Space, 
  Typography, 
  Divider,
  Row,
  Col,
  message,
  Alert,
  Modal
} from 'antd'
import { 
  BellOutlined,
  GlobalOutlined,
  SecurityScanOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import { useAuthStore } from '../../store/useAuthStore'
import useThemeStore from '../../store/useThemeStore'
import PageContainer from '../../components/PageContainer'
import ThemeController from '../../components/ThemeController'

const { Title, Text } = Typography
const { Option } = Select

const Settings = () => {
  const { user, logout } = useAuthStore()
  const { theme, mode } = useThemeStore()
  const [loading, setLoading] = useState(false)

  // 设置状态
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: false,
      chat: true,
      system: true
    },
    privacy: {
      profileVisible: true,
      activityVisible: false,
      onlineStatus: true
    },
    language: 'zh-CN',
    timezone: 'Asia/Shanghai'
  })

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }))
    message.success('设置已更新')
  }

  const handleLanguageChange = (value) => {
    setSettings(prev => ({ ...prev, language: value }))
    message.success('语言设置已更新')
  }

  const handleTimezoneChange = (value) => {
    setSettings(prev => ({ ...prev, timezone: value }))
    message.success('时区设置已更新')
  }

  const handleExportData = async () => {
    setLoading(true)
    try {
      // 模拟导出数据
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const data = {
        user: user,
        settings: settings,
        exportTime: new Date().toISOString()
      }
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `characterverse-data-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
      
      message.success('数据导出成功！')
    } catch (error) {
      message.error('数据导出失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = () => {
    Modal.confirm({
      title: '确认删除账户',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>删除账户将会：</p>
          <ul>
            <li>永久删除您的所有个人数据</li>
            <li>删除您创建的所有AI角色</li>
            <li>清除所有聊天记录</li>
            <li>此操作不可恢复</li>
          </ul>
          <p><strong>请确认您真的要删除账户吗？</strong></p>
        </div>
      ),
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          // 模拟删除账户API调用
          await new Promise(resolve => setTimeout(resolve, 1000))
          message.success('账户已删除')
          logout()
        } catch (error) {
          message.error('删除账户失败')
        }
      }
    })
  }

  return (
    <PageContainer
      title="设置"
      description="管理您的应用偏好和账户设置"
    >
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          {/* 主题设置 */}
          <Card title="外观设置" style={{ marginBottom: '1rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <Text strong>主题模式</Text>
              <div style={{ marginTop: '0.5rem' }}>
                <Text type="secondary">
                  当前主题: {mode === 'light' ? '亮色模式' : mode === 'dark' ? '暗色模式' : '自定义模式'}
                </Text>
              </div>
            </div>
            <ThemeController />
          </Card>

          {/* 通知设置 */}
          <Card title="通知设置" style={{ marginBottom: '1rem' }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text strong>邮件通知</Text>
                  <div>
                    <Text type="secondary">接收重要更新和消息的邮件通知</Text>
                  </div>
                </div>
                <Switch
                  checked={settings.notifications.email}
                  onChange={(checked) => handleSettingChange('notifications', 'email', checked)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text strong>推送通知</Text>
                  <div>
                    <Text type="secondary">在浏览器中接收推送通知</Text>
                  </div>
                </div>
                <Switch
                  checked={settings.notifications.push}
                  onChange={(checked) => handleSettingChange('notifications', 'push', checked)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text strong>聊天通知</Text>
                  <div>
                    <Text type="secondary">收到新消息时显示通知</Text>
                  </div>
                </div>
                <Switch
                  checked={settings.notifications.chat}
                  onChange={(checked) => handleSettingChange('notifications', 'chat', checked)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text strong>系统通知</Text>
                  <div>
                    <Text type="secondary">接收系统更新和维护通知</Text>
                  </div>
                </div>
                <Switch
                  checked={settings.notifications.system}
                  onChange={(checked) => handleSettingChange('notifications', 'system', checked)}
                />
              </div>
            </Space>
          </Card>

          {/* 隐私设置 */}
          <Card title="隐私设置" style={{ marginBottom: '1rem' }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text strong>公开个人资料</Text>
                  <div>
                    <Text type="secondary">允许其他用户查看您的个人资料</Text>
                  </div>
                </div>
                <Switch
                  checked={settings.privacy.profileVisible}
                  onChange={(checked) => handleSettingChange('privacy', 'profileVisible', checked)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text strong>显示活动状态</Text>
                  <div>
                    <Text type="secondary">让其他用户看到您的在线活动</Text>
                  </div>
                </div>
                <Switch
                  checked={settings.privacy.activityVisible}
                  onChange={(checked) => handleSettingChange('privacy', 'activityVisible', checked)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text strong>在线状态</Text>
                  <div>
                    <Text type="secondary">显示您的在线/离线状态</Text>
                  </div>
                </div>
                <Switch
                  checked={settings.privacy.onlineStatus}
                  onChange={(checked) => handleSettingChange('privacy', 'onlineStatus', checked)}
                />
              </div>
            </Space>
          </Card>

          {/* 语言和地区 */}
          <Card title="语言和地区" style={{ marginBottom: '1rem' }}>
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ marginBottom: '1rem' }}>
                  <Text strong>语言</Text>
                  <Select
                    value={settings.language}
                    onChange={handleLanguageChange}
                    style={{ width: '100%', marginTop: '0.5rem' }}
                  >
                    <Option value="zh-CN">简体中文</Option>
                    <Option value="zh-TW">繁體中文</Option>
                    <Option value="en-US">English</Option>
                    <Option value="ja-JP">日本語</Option>
                  </Select>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: '1rem' }}>
                  <Text strong>时区</Text>
                  <Select
                    value={settings.timezone}
                    onChange={handleTimezoneChange}
                    style={{ width: '100%', marginTop: '0.5rem' }}
                  >
                    <Option value="Asia/Shanghai">北京时间 (UTC+8)</Option>
                    <Option value="Asia/Tokyo">东京时间 (UTC+9)</Option>
                    <Option value="America/New_York">纽约时间 (UTC-5)</Option>
                    <Option value="Europe/London">伦敦时间 (UTC+0)</Option>
                  </Select>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          {/* 数据管理 */}
          <Card title="数据管理" style={{ marginBottom: '1rem' }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>导出数据</Text>
                <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
                  <Text type="secondary">
                    下载您的所有数据，包括个人资料、角色和聊天记录
                  </Text>
                </div>
                <Button
                  icon={<GlobalOutlined />}
                  onClick={handleExportData}
                  loading={loading}
                  block
                >
                  导出我的数据
                </Button>
              </div>

              <Divider />

              <div>
                <Text strong>清除缓存</Text>
                <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
                  <Text type="secondary">
                    清除本地缓存数据，可能会提高应用性能
                  </Text>
                </div>
                <Button
                  onClick={() => {
                    localStorage.clear()
                    message.success('缓存已清除')
                  }}
                  block
                >
                  清除缓存
                </Button>
              </div>
            </Space>
          </Card>

          {/* 账户安全 */}
          <Card title="账户安全" style={{ marginBottom: '1rem' }}>
            <Alert
              message="危险操作"
              description="以下操作将永久影响您的账户，请谨慎操作。"
              type="warning"
              showIcon
              style={{ marginBottom: '1rem' }}
            />
            
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleDeleteAccount}
                block
              >
                删除账户
              </Button>
            </Space>
          </Card>

          {/* 关于 */}
          <Card title="关于">
            <Space direction="vertical" size="small">
              <div>
                <Text strong>CharacterVerse AI</Text>
              </div>
              <div>
                <Text type="secondary">版本 1.0.0</Text>
              </div>
              <div>
                <Text type="secondary">
                  一个智能AI角色对话平台，让您与虚拟角色进行自然对话。
                </Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </PageContainer>
  )
}

export default Settings
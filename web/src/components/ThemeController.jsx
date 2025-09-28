import React, { useState } from 'react'
import { 
  Button, 
  Drawer, 
  Switch, 
  ColorPicker, 
  Space, 
  Divider, 
  Typography, 
  Row, 
  Col,
  Card,
  message
} from 'antd'
import { 
  SettingOutlined, 
  BgColorsOutlined,
  SunOutlined,
  MoonOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import useThemeStore from '../store/useThemeStore'
import './ThemeController.css'

const { Title, Text } = Typography

const ThemeController = () => {
  const [drawerVisible, setDrawerVisible] = useState(false)
  const {
    theme,
    customColors,
    presetColors,
    toggleTheme,
    setCustomColor,
    applyPresetTheme,
    resetToDefault,
    saveThemeToLocal,
    loadThemeFromLocal
  } = useThemeStore()

  // 预设主题颜色
  const themePresets = [
    { name: '默认蓝', primary: '#1890ff', description: '经典蓝色主题' },
    { name: '科技紫', primary: '#722ed1', description: '现代科技感' },
    { name: '活力橙', primary: '#fa8c16', description: '充满活力' },
    { name: '自然绿', primary: '#52c41a', description: '清新自然' },
    { name: '热情红', primary: '#f5222d', description: '热情洋溢' },
    { name: '优雅粉', primary: '#eb2f96', description: '优雅浪漫' },
    { name: '深海蓝', primary: '#13c2c2', description: '深邃神秘' },
    { name: '金色', primary: '#faad14', description: '尊贵典雅' }
  ]

  const handlePresetSelect = (preset) => {
    applyPresetTheme(preset.primary)
    message.success(`已应用 ${preset.name} 主题`)
  }

  const handleCustomColorChange = (color, colorType) => {
    const hexColor = typeof color === 'string' ? color : color.toHexString()
    setCustomColor(colorType, hexColor)
  }

  const handleReset = () => {
    resetToDefault()
    message.success('已重置为默认主题')
  }

  const handleSave = () => {
    saveThemeToLocal()
    message.success('主题设置已保存')
  }

  return (
    <>
      {/* 主题控制按钮 */}
      <Button
        type="text"
        icon={<SettingOutlined />}
        onClick={() => setDrawerVisible(true)}
        className="theme-controller-trigger"
        title="主题设置"
      />

      {/* 主题设置抽屉 */}
      <Drawer
        title={
          <Space>
            <BgColorsOutlined />
            <span>主题设置</span>
          </Space>
        }
        placement="right"
        width={400}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        className="theme-controller-drawer"
      >
        <div className="theme-controller-content">
          {/* 主题模式切换 */}
          <Card size="small" className="theme-section">
            <Title level={5}>主题模式</Title>
            <Row align="middle" justify="space-between">
              <Col>
                <Space>
                  {theme === 'light' ? <SunOutlined /> : <MoonOutlined />}
                  <Text>{theme === 'light' ? '亮色模式' : '暗色模式'}</Text>
                </Space>
              </Col>
              <Col>
                <Switch
                  checked={theme === 'dark'}
                  onChange={toggleTheme}
                  checkedChildren="暗"
                  unCheckedChildren="亮"
                />
              </Col>
            </Row>
          </Card>

          <Divider />

          {/* 预设主题 */}
          <Card size="small" className="theme-section">
            <Title level={5}>预设主题</Title>
            <div className="preset-themes">
              {themePresets.map((preset, index) => (
                <div
                  key={index}
                  className={`preset-theme-item ${
                    customColors.primary === preset.primary ? 'active' : ''
                  }`}
                  onClick={() => handlePresetSelect(preset)}
                >
                  <div
                    className="preset-color"
                    style={{ backgroundColor: preset.primary }}
                  />
                  <div className="preset-info">
                    <Text strong>{preset.name}</Text>
                    <Text type="secondary" className="preset-description">
                      {preset.description}
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Divider />

          {/* 自定义颜色 */}
          <Card size="small" className="theme-section">
            <Title level={5}>自定义颜色</Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Row align="middle" justify="space-between">
                <Col>
                  <Text>主色调</Text>
                </Col>
                <Col>
                  <ColorPicker
                    value={customColors.primary}
                    onChange={(color) => handleCustomColorChange(color, 'primary')}
                    showText
                    size="small"
                  />
                </Col>
              </Row>

              <Row align="middle" justify="space-between">
                <Col>
                  <Text>成功色</Text>
                </Col>
                <Col>
                  <ColorPicker
                    value={customColors.success}
                    onChange={(color) => handleCustomColorChange(color, 'success')}
                    showText
                    size="small"
                  />
                </Col>
              </Row>

              <Row align="middle" justify="space-between">
                <Col>
                  <Text>警告色</Text>
                </Col>
                <Col>
                  <ColorPicker
                    value={customColors.warning}
                    onChange={(color) => handleCustomColorChange(color, 'warning')}
                    showText
                    size="small"
                  />
                </Col>
              </Row>

              <Row align="middle" justify="space-between">
                <Col>
                  <Text>错误色</Text>
                </Col>
                <Col>
                  <ColorPicker
                    value={customColors.error}
                    onChange={(color) => handleCustomColorChange(color, 'error')}
                    showText
                    size="small"
                  />
                </Col>
              </Row>
            </Space>
          </Card>

          <Divider />

          {/* 操作按钮 */}
          <Card size="small" className="theme-section">
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleReset}
              >
                重置默认
              </Button>
              <Button
                type="primary"
                onClick={handleSave}
              >
                保存设置
              </Button>
            </Space>
          </Card>

          {/* 主题预览 */}
          <Card size="small" className="theme-section">
            <Title level={5}>主题预览</Title>
            <div className="theme-preview">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button type="primary">主要按钮</Button>
                <Button>默认按钮</Button>
                <Button type="dashed">虚线按钮</Button>
                <Button type="text">文本按钮</Button>
                <div className="preview-colors">
                  <div className="color-item">
                    <div 
                      className="color-block" 
                      style={{ backgroundColor: customColors.primary }}
                    />
                    <Text>主色调</Text>
                  </div>
                  <div className="color-item">
                    <div 
                      className="color-block" 
                      style={{ backgroundColor: customColors.success }}
                    />
                    <Text>成功色</Text>
                  </div>
                  <div className="color-item">
                    <div 
                      className="color-block" 
                      style={{ backgroundColor: customColors.warning }}
                    />
                    <Text>警告色</Text>
                  </div>
                  <div className="color-item">
                    <div 
                      className="color-block" 
                      style={{ backgroundColor: customColors.error }}
                    />
                    <Text>错误色</Text>
                  </div>
                </div>
              </Space>
            </div>
          </Card>
        </div>
      </Drawer>
    </>
  )
}

export default ThemeController
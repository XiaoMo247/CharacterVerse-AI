import { useState } from 'react'
import { 
  Modal, 
  Form, 
  Input, 
  Button, 
  Tabs, 
  Space, 
  Divider, 
  Typography, 
  message,
  Checkbox
} from 'antd'
import { 
  UserOutlined, 
  LockOutlined, 
  MailOutlined,
  GithubOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone
} from '@ant-design/icons'
import { useAuthStore } from '../../store/useAuthStore'
import './LoginModal.css'

const { Text, Link } = Typography

const LoginModal = ({ visible, onCancel }) => {
  const [activeTab, setActiveTab] = useState('login')
  const [loading, setLoading] = useState(false)
  const [githubLoading, setGithubLoading] = useState(false)
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)
  const { login, register } = useAuthStore()

  const [loginForm] = Form.useForm()
  const [registerForm] = Form.useForm()

  // 处理登录
  const handleLogin = async (values) => {
    setLoading(true)
    try {
      // 更新全局状态
      const success = await login(values.username, values.password, values.remember)
      
      if (success) {
        message.success('登录成功！')
        onCancel()
        loginForm.resetFields()
      }
    } catch (error) {
      message.error('登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 处理注册
  const handleRegister = async (values) => {
    setLoading(true)
    try {
      // 更新全局状态
      const success = await register(values.username, values.password)
      
      if (success) {
        message.success('注册成功！请登录')
        setActiveTab('login')
        registerForm.resetFields()
      }
    } catch (error) {
      message.error('注册失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // GitHub登录
  const handleGithubLogin = async () => {
    setGithubLoading(true)
    try {
      // 模拟GitHub OAuth流程
      message.info('正在跳转到GitHub授权页面...')
      
      // 实际项目中这里应该跳转到GitHub OAuth URL
      // window.location.href = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=user:email`
      
      // 模拟授权成功
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const success = await login('github_user', null, false, 'github')
      
      if (success) {
        message.success('GitHub登录成功！')
        onCancel()
      } else {
        message.error('GitHub登录失败')
      }
    } catch (error) {
      message.error('GitHub登录失败，请重试')
    } finally {
      setGithubLoading(false)
    }
  }

  // 重置表单
  const handleCancel = () => {
    loginForm.resetFields()
    registerForm.resetFields()
    setActiveTab('login')
    onCancel()
  }

  const loginTabContent = (
    <Form
      form={loginForm}
      name="login"
      onFinish={handleLogin}
      autoComplete="off"
      layout="vertical"
      size="large"
    >
      <Form.Item
        name="username"
        rules={[
          { required: true, message: '请输入用户名或邮箱' },
          { min: 3, message: '用户名至少3个字符' }
        ]}
      >
        <Input
          prefix={<UserOutlined />}
          placeholder="用户名或邮箱"
          autoComplete="username"
        />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[
          { required: true, message: '请输入密码' },
          { min: 6, message: '密码至少6个字符' }
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="密码"
          autoComplete="current-password"
          iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
        />
      </Form.Item>

      <Form.Item>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox>记住我</Checkbox>
          </Form.Item>
          <Link href="#" onClick={(e) => e.preventDefault()}>
            忘记密码？
          </Link>
        </div>
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          block
          size="large"
        >
          登录
        </Button>
      </Form.Item>
    </Form>
  )

  const registerTabContent = (
    <Form
      form={registerForm}
      name="register"
      onFinish={handleRegister}
      autoComplete="off"
      layout="vertical"
      size="large"
    >
      <Form.Item
        name="username"
        rules={[
          { required: true, message: '请输入用户名' },
          { min: 3, message: '用户名至少3个字符' },
          { max: 20, message: '用户名最多20个字符' },
          { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' }
        ]}
      >
        <Input
          prefix={<UserOutlined />}
          placeholder="用户名"
          autoComplete="username"
        />
      </Form.Item>
      <Form.Item
        name="password"
        rules={[
          { required: true, message: '请输入密码' },
          { min: 6, message: '密码至少6个字符' },
          { max: 50, message: '密码最多50个字符' }
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="密码"
          autoComplete="new-password"
          iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
        />
      </Form.Item>

      <Form.Item
        name="confirmPassword"
        dependencies={['password']}
        rules={[
          { required: true, message: '请确认密码' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve()
              }
              return Promise.reject(new Error('两次输入的密码不一致'))
            },
          }),
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="确认密码"
          autoComplete="new-password"
          iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
        />
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          block
          size="large"
        >
          注册
        </Button>
      </Form.Item>
    </Form>
  )

  const tabItems = [
    {
      key: 'login',
      label: '登录',
      children: loginTabContent
    },
    {
      key: 'register',
      label: '注册',
      children: registerTabContent
    }
  ]

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={400}
      centered
      destroyOnClose
      className="login-modal"
    >
      <div className="login-modal-content">
        <div className="login-modal-header">
          <h2>欢迎来到 CharacterVerse</h2>
          <Text type="secondary">连接您的AI角色世界</Text>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          centered
          items={tabItems}
        />

        <Divider>
          <Text type="secondary">或</Text>
        </Divider>

        <Button
          icon={<GithubOutlined />}
          onClick={handleGithubLogin}
          loading={githubLoading}
          block
          size="large"
          className="github-login-btn"
        >
          使用 GitHub 登录
        </Button>

        <div className="login-modal-footer">
          <Text type="secondary" style={{ fontSize: '0.75rem' }}>
            登录即表示您同意我们的{' '}
            <Link href="#" onClick={(e) => e.preventDefault()}>
              服务条款
            </Link>{' '}
            和{' '}
            <Link href="#" onClick={(e) => e.preventDefault()}>
              隐私政策
            </Link>
          </Text>
        </div>
      </div>
    </Modal>
  )
}

export default LoginModal
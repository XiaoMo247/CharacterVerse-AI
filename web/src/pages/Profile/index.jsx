import { useState } from 'react'
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Avatar, 
  Upload, 
  Space, 
  Typography, 
  Divider,
  Row,
  Col,
  message,
  Tag
} from 'antd'
import { 
  UserOutlined, 
  MailOutlined, 
  EditOutlined,
  CameraOutlined,
  SaveOutlined,
  GithubOutlined
} from '@ant-design/icons'
import { useAuthStore } from '../../store/useAuthStore'
import PageContainer from '../../components/PageContainer'

const { Title, Text } = Typography

const Profile = () => {
  const { user, updateUser } = useAuthStore()
  const [form] = Form.useForm()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)

  // 初始化表单值
  const initialValues = {
    username: user?.username || '',
    email: user?.email || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || ''
  }

  const handleEdit = () => {
    setEditing(true)
    form.setFieldsValue(initialValues)
  }

  const handleCancel = () => {
    setEditing(false)
    form.resetFields()
  }

  const handleSave = async (values) => {
    setLoading(true)
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      updateUser(values)
      message.success('个人资料更新成功！')
      setEditing(false)
    } catch (error) {
      message.error('更新失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarChange = (info) => {
    if (info.file.status === 'done') {
      // 这里应该处理头像上传
      message.success('头像上传成功！')
    } else if (info.file.status === 'error') {
      message.error('头像上传失败！')
    }
  }

  const uploadButton = (
    <div>
      <CameraOutlined />
      <div style={{ marginTop: 8 }}>更换头像</div>
    </div>
  )

  return (
    <PageContainer
      title="个人资料"
      description="查看和编辑您的个人信息"
    >
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          {/* 头像和基本信息卡片 */}
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <Avatar
                  size={120}
                  src={user?.avatar}
                  icon={<UserOutlined />}
                  style={{ marginBottom: '1rem' }}
                />
                {editing && (
                  <Upload
                    name="avatar"
                    listType="picture-card"
                    className="avatar-uploader"
                    showUploadList={false}
                    action="/api/upload/avatar"
                    onChange={handleAvatarChange}
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: 40,
                      height: 40,
                      borderRadius: '50%'
                    }}
                  >
                    <Button
                      type="primary"
                      shape="circle"
                      icon={<CameraOutlined />}
                      size="small"
                    />
                  </Upload>
                )}
              </div>
              
              <Title level={3} style={{ marginBottom: '0.5rem' }}>
                {user?.username}
              </Title>
              
              <Space direction="vertical" size="small">
                <Text type="secondary">
                  <MailOutlined /> {user?.email}
                </Text>
                
                {user?.loginType && (
                  <Tag 
                    icon={user.loginType === 'github' ? <GithubOutlined /> : <UserOutlined />}
                    color={user.loginType === 'github' ? 'blue' : 'green'}
                  >
                    {user.loginType === 'github' ? 'GitHub登录' : '本地账户'}
                  </Tag>
                )}
                
                <Text type="secondary">
                  角色: {user?.role === 'admin' ? '管理员' : '用户'}
                </Text>
              </Space>
            </div>
          </Card>

          {/* 统计信息卡片 */}
          <Card title="使用统计" style={{ marginTop: '1rem' }}>
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ textAlign: 'center' }}>
                  <Title level={2} style={{ margin: 0, color: 'var(--primary-color)' }}>
                    5
                  </Title>
                  <Text type="secondary">创建角色</Text>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ textAlign: 'center' }}>
                  <Title level={2} style={{ margin: 0, color: 'var(--success-color)' }}>
                    128
                  </Title>
                  <Text type="secondary">聊天消息</Text>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          {/* 详细信息卡片 */}
          <Card
            title="详细信息"
            extra={
              !editing ? (
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={handleEdit}
                >
                  编辑资料
                </Button>
              ) : (
                <Space>
                  <Button onClick={handleCancel}>
                    取消
                  </Button>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={loading}
                    onClick={() => form.submit()}
                  >
                    保存
                  </Button>
                </Space>
              )
            }
          >
            {!editing ? (
              // 显示模式
              <div>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Text strong>用户名</Text>
                    <div>{user?.username || '未设置'}</div>
                  </Col>
                  <Col span={12}>
                    <Text strong>邮箱</Text>
                    <div>{user?.email || '未设置'}</div>
                  </Col>
                  <Col span={24}>
                    <Text strong>个人简介</Text>
                    <div>{user?.bio || '这个人很懒，什么都没有留下...'}</div>
                  </Col>
                  <Col span={12}>
                    <Text strong>所在地</Text>
                    <div>{user?.location || '未设置'}</div>
                  </Col>
                  <Col span={12}>
                    <Text strong>个人网站</Text>
                    <div>{user?.website || '未设置'}</div>
                  </Col>
                </Row>
              </div>
            ) : (
              // 编辑模式
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSave}
                initialValues={initialValues}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="username"
                      label="用户名"
                      rules={[
                        { required: true, message: '请输入用户名' },
                        { min: 3, message: '用户名至少3个字符' },
                        { max: 20, message: '用户名最多20个字符' }
                      ]}
                    >
                      <Input placeholder="请输入用户名" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="email"
                      label="邮箱"
                      rules={[
                        { required: true, message: '请输入邮箱' },
                        { type: 'email', message: '请输入有效的邮箱地址' }
                      ]}
                    >
                      <Input placeholder="请输入邮箱" />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item
                      name="bio"
                      label="个人简介"
                      rules={[
                        { max: 200, message: '个人简介最多200个字符' }
                      ]}
                    >
                      <Input.TextArea
                        rows={3}
                        placeholder="介绍一下自己吧..."
                        showCount
                        maxLength={200}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="location"
                      label="所在地"
                      rules={[
                        { max: 50, message: '所在地最多50个字符' }
                      ]}
                    >
                      <Input placeholder="请输入所在地" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="website"
                      label="个人网站"
                      rules={[
                        { type: 'url', message: '请输入有效的网址' }
                      ]}
                    >
                      <Input placeholder="https://example.com" />
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            )}
          </Card>

          {/* 账户安全卡片 */}
          <Card title="账户安全" style={{ marginTop: '1rem' }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text strong>登录密码</Text>
                  <div>
                    <Text type="secondary">定期更换密码可以提高账户安全性</Text>
                  </div>
                </div>
                <Button>修改密码</Button>
              </div>
              
              <Divider />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text strong>两步验证</Text>
                  <div>
                    <Text type="secondary">为您的账户添加额外的安全保护</Text>
                  </div>
                </div>
                <Button>启用</Button>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </PageContainer>
  )
}

export default Profile
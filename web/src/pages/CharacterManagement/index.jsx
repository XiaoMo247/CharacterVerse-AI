import { useState, useEffect, useCallback } from 'react'
import { Row, Col, Button, Modal, Form, Input, Select, message, Space, Tag, Pagination, Alert } from 'antd'
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  UserOutlined,
  HeartOutlined,
  StarOutlined
} from '@ant-design/icons'
import { CharacterCard } from '../../components'
import PageContainer from '../../components/PageContainer'
import StatCard from '../../components/StatCard'
import { addRole, getRole, detailRole, updateRole, getvoiceTypes} from './server/characterService'
import { useNavigate } from 'react-router-dom'
import  useChatStore  from '../Chat/store/useChatStore'

const { TextArea } = Input
const { Option } = Select

// 标签常量
const TAG_OPTIONS = [
  { value: "虚拟角色", label: "虚拟角色" },
  { value: "历史角色", label: "历史角色" },
  { value: "电影角色", label: "电影角色" },
  { value: "电视剧角色", label: "电视剧角色" },
  { value: "游戏角色", label: "游戏角色" },
  { value: "动漫角色", label: "动漫角色" },
  { value: "文学角色", label: "文学角色" },
  { value: "神话角色", label: "神话角色" },
  { value: "名人角色", label: "名人角色" },
  { value: "原创角色", label: "原创角色" }
]

const CharacterManagement = () => {
  const [characters, setCharacters] = useState([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    hasMore: false
  })
  const [loading, setLoading] = useState(false)

  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingCharacter, setEditingCharacter] = useState(null)
  const [form] = Form.useForm()
  const [voiceTypes, setVoiceTypes] = useState([])
  
  const navigate = useNavigate()
  const { setPendingCharacter } = useChatStore()

  // 获取角色列表
  const fetchRoles = async (page = 1, pageSize = 10) => {
    setLoading(true)
    try {
      const params = {
        page,
        page_size: pageSize
      }
      const response = await getRole(params)
      
      if (response && response.data) {
        const { list, total, pages, has_more } = response.data
        console.log('list', list)
        setCharacters(list || [])
        setPagination({
          current: page,
          pageSize,
          total,
          hasMore: has_more
        })
      }
    } catch (error) {
      message.error('获取角色列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 获取声音类型列表
  const fetchVoiceTypes = async () => {
    try {
      const response = await getvoiceTypes()
      if (response && Array.isArray(response)) {
        setVoiceTypes(response)
      }
    } catch (error) {
      console.error('获取声音类型失败:', error)
      message.error('获取声音类型失败')
    }
  }

  // 初始化加载数据
  useEffect(() => {
    fetchRoles()
    fetchVoiceTypes()
  }, [])

  const avatarOptions = ['🤖', '👨', '👩', '🧑', '👦', '👧', '🎨', '📚', '🌟', '💎', '🦄', '🐱']
  const personalityOptions = ['友善', '活泼', '沉稳', '幽默', '严肃', '温柔', '热情', '冷静', '创意', '博学']

  // 处理聊天按钮点击
  const handleChat = useCallback((character) => {
    // 将角色信息存储到 ChatStore 中
    setPendingCharacter(character)
    // 跳转到聊天页面
    navigate('/chat')
  }, [setPendingCharacter, navigate])

  const handleCreate = () => {
    setEditingCharacter(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  const handleEdit = (character) => {
    setEditingCharacter(character)
    form.setFieldsValue({
      name: character.name,
      description: character.description,
      gender: character.gender,
      age: character.age,
      voice_type: character.voice_type,
      tag: character.tag || ""
    })
    setIsModalVisible(true)
  }

  const handleDelete = (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个角色吗？此操作不可恢复。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      async onOk() {
        try {
          const res = await detailRole(id)
          if (res) {
            message.success('角色删除成功')
            // 删除成功后重新获取当前页数据
            fetchRoles(pagination.current, pagination.pageSize)
          } else {
            message.error('角色删除失败')
          }
        } catch (error) {
          console.error('删除角色失败:', error)
          message.error('角色删除失败')
        }
      }
    })
  }

  // 收藏/喜欢角色
  // const handleToggleFavorite = (id) => {
  // const handleToggleFavorite = (id) => {
  //   setCharacters(characters.map(char => 
  //     char.id === id ? { ...char, favorited: !char.favorited } : char
  //   ))
  // }

  const handleSubmit =async (values) => {
    // 转换数据类型和字段名
    const formattedValues = {
      ...values,
      age: parseInt(values.age), // 将年龄转换为数字类型
      tag: values.tag // 标签字段（字符串类型）
    }

    if (editingCharacter) {
      // 编辑现有角色
      try {
        const res = await updateRole(editingCharacter.ID, formattedValues)
        if (res) {
          message.success('角色更新成功')
          // 更新成功后重新获取当前页数据
          fetchRoles(pagination.current, pagination.pageSize)
        } else {
          message.error('角色更新失败')
        }
      } catch (error) {
        console.error('更新角色失败:', error)
        message.error('角色更新失败')
      }
    } else {
      // 创建新角色
      try {
        const res = await addRole(formattedValues)
        if(res?.role_id){
          message.success('角色创建成功')
          // 创建成功后重新获取第一页数据
          fetchRoles(1)
        } else {
          message.error('角色创建失败')
        }
      } catch (error) {
        console.error('角色创建失败:', error)
        message.error('角色创建失败')
      }
    }
    setIsModalVisible(false)
    form.resetFields()
  }

  const totalChats = characters.reduce((sum, char) => sum + char.chatCount, 0)
  const favoriteCount = characters.filter(char => char.favorited).length

  const extraActions = (
    <Button 
      type="primary" 
      icon={<PlusOutlined />}
      onClick={handleCreate}
    >
      创建角色
    </Button>
  )

  return (
    <PageContainer
      title="个人角色管理"
      description="创建和管理您的AI角色"
      extra={extraActions}
    >
      {/* 统计信息 */}
      <div style={{ marginBottom: '2rem' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <StatCard
              title="角色总数"
              value={characters.length}
              suffix="个"
              icon={<UserOutlined />}
            />
          </Col>
          <Col xs={24} sm={8}>
            <StatCard
              title="收藏角色"
              value={favoriteCount}
              suffix="个"
              icon={<HeartOutlined />}
            />
          </Col>
          {/* <Col xs={24} sm={8}>
            <StatCard
              title="总对话数"
              value={totalChats}
              suffix="次"
              icon={<StarOutlined />}
            />
          </Col> */}
        </Row>
      </div>

      {/* 角色列表容器 */}
      <div style={{ 
        maxHeight: '600px', 
        overflowY: 'auto',
        marginBottom: '24px',
        paddingRight: '8px'
      }}>
        <Row gutter={[24, 24]}>
          {characters.map((character) => (
            <Col xs={24} sm={12} lg={8} key={character.ID}>
              <CharacterCard
                character={character}
                onEdit={() => handleEdit(character)}
                onDelete={() => handleDelete(character.ID)}
                onChat={() => handleChat(character)}
                // onToggleFavorite={() => handleToggleFavorite(character.id)}
              />
            </Col>
          ))}
        </Row>
      </div>

      {/* 分页 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Pagination
          current={pagination.current}
          pageSize={pagination.pageSize}
          total={pagination.total}
          onChange={(page, pageSize) => fetchRoles(page, pageSize)}
          showSizeChanger
          showQuickJumper
          showTotal={(total) => `共 ${total} 个角色`}
        />
      </div>

      {/* 创建/编辑角色弹窗 */}
      <Modal
        title={editingCharacter ? '编辑角色' : '创建新角色'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ marginTop: '1rem' }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="角色名称"
                rules={[
                  { required: true, message: '请输入角色名称' },
                  { min: 2, max: 100, message: '角色名称长度应在2-100字符之间' }
                ]}
              >
                <Input placeholder="请输入角色名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="gender"
                label="性别"
                rules={[{ required: true, message: '请选择性别' }]}
              >
                <Select placeholder="请选择性别">
                  <Option value="男">男</Option>
                  <Option value="女">女</Option>
                  <Option value="其他">其他</Option>
                  <Option value="未知">未知</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="age"
                label="年龄"
                rules={[
                  { required: true, message: '请输入年龄' },
                  { 
                    validator: (_, value) => {
                      const age = parseInt(value);
                      if (isNaN(age) || age < 0 || age > 120) {
                        return Promise.reject(new Error('年龄应在0-120之间'));
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <Input type="number" placeholder="请输入年龄" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="voice_type"
                label="声音类型"
                rules={[{ required: true, message: '请选择声音类型' }]}
              >
                <Select placeholder="请选择声音类型">
                  {voiceTypes.map((voice) => (
                    <Option key={voice.voice_type} value={voice.voice_type}>
                      {voice.voice_name} ({voice.category})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="角色描述"
            rules={[
              { required: true, message: '请输入角色描述' },
              { min: 10, message: '角色描述至少需要10个字符' }
            ]}
          >
            <TextArea
              rows={4}
              placeholder="描述这个角色的特点、背景或能力..."
            />
          </Form.Item>

          <Form.Item
            name="tag"
            label="标签"
            rules={[{ required: true, message: '请选择一个标签' }]}
          >
            <Select placeholder="请选择标签">
              {TAG_OPTIONS.map((tag) => (
                <Option key={tag.value} value={tag.value}>
                  {tag.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Alert
            message="角色头像将由AI自动生成"
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingCharacter ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  )
}

export default CharacterManagement
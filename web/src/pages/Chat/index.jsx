import { useState, useRef, useEffect } from 'react'
import { 
  Row, 
  Col, 
  Card, 
  Input, 
  Button, 
  Avatar, 
  List, 
  Typography, 
  Space, 
  Tag, 
  Empty,
  Divider,
  Tooltip,
  message
} from 'antd'
import { 
  SendOutlined, 
  UserOutlined, 
  RobotOutlined,
  DeleteOutlined,
  HistoryOutlined,
  MessageOutlined,
  WifiOutlined,
  DisconnectOutlined
} from '@ant-design/icons'
import PageContainer from '../../components/PageContainer'
import StatCard from '../../components/StatCard'
import StreamingChat from '../../utils/webSocket'
import './Chat.css'

const { TextArea } = Input
const { Text, Title } = Typography

const Chat = () => {
  const [selectedCharacter, setSelectedCharacter] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState('')
  const messagesEndRef = useRef(null)
  const streamingChatRef = useRef(null)

  const characters = [
    {
      role_id: 1,
      name: '小助手',
      avatar: '🤖',
      personality: '友善、乐于助人',
      description: '一个贴心的AI助手，随时准备为您提供帮助和支持。',
      tags: ['助手', '友善', '智能'],
      online: true
    },
    {
      role_id: 2,
      name: '创意伙伴',
      avatar: '🎨',
      personality: '创意、活泼',
      description: '充满创意的伙伴，能够激发您的灵感，一起探索无限可能。',
      tags: ['创意', '灵感', '艺术'],
      online: true
    },
    {
      role_id: 3,
      name: '智慧导师',
      avatar: '📚',
      personality: '博学、耐心',
      description: '知识渊博的导师，耐心解答您的疑问，引导您学习成长。',
      tags: ['博学', '导师', '教育'],
      online: false
    }
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingMessage])

  // 初始化WebSocket连接
  useEffect(() => {
    const initWebSocket = () => {
      streamingChatRef.current = new StreamingChat({
        onConnected: () => {
          message.success('WebSocket连接成功')
        },
        onDisconnected: () => {
          setIsTyping(false)
          setStreamingMessage('')
        },
        onStreamStart: () => {
          setIsTyping(true)
          setStreamingMessage('')
        },
        onStreamChunk: (chunk, fullMessage) => {
          setStreamingMessage(fullMessage)
        },
        onStreamEnd: (finalMessage, messageData) => {
          setIsTyping(false)
          setStreamingMessage('')
          console.log('finalMessage:',messageData)
          // 添加AI回复到消息列表
          const aiMessage = {
            type:'ai',
            message: messageData.message,
            timestamp: new Date().toLocaleTimeString(),
            role_id: messageData.role_id
          }
          setMessages(prev => [...prev, aiMessage])
        },
        onError: (error) => {
          setIsTyping(false)
          setStreamingMessage('')
          message.error(`连接错误: ${error.message}`)
          console.error('WebSocket错误:', error)
        }
      })

      streamingChatRef.current.connect()
    }

    initWebSocket()

    // 清理函数
    return () => {
      if (streamingChatRef.current) {
        streamingChatRef.current.disconnect()
      }
    }
  }, [])

  const handleCharacterSelect = (character) => {
    setSelectedCharacter(character)
    setMessages([
      {
        id: 1,
        type: 'ai',
        content: `你好！我是${character.name}，${character.description}`,
        timestamp: new Date().toLocaleTimeString()
      }
    ])
  }

  const handleSendMessage = () => {
    if (!inputValue.trim() || !selectedCharacter) return

    // 检查WebSocket连接状态
    if ( !streamingChatRef.current) {
      message.error('WebSocket未连接，请稍后重试')
      return
    }

    const userMessage = {
      type: 'user',
      message: inputValue,
      role_id: selectedCharacter.role_id,
      timestamp: new Date().toLocaleTimeString()
    }

    // 添加用户消息到列表
    setMessages(prev => [...prev, userMessage])
    
    // 发送消息到WebSocket服务器
    const success = streamingChatRef.current.sendMessage(inputValue, selectedCharacter.role_id)
    
    if (success) {
      setInputValue('')
      // 注意：不在这里设置isTyping，而是等待stream_start事件
    } else {
      message.error('发送消息失败')
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const clearMessages = () => {
    if (selectedCharacter) {
      setMessages([])
    }
  }

  const onlineCharacters = characters.filter(char => char.online)
  const totalMessages = messages.length

  return (
    <PageContainer
      title="智能聊天"
      description="与您的AI角色进行对话交流"
    >
      <div className="chat-page">
        <Row gutter={[24, 24]} style={{ height: 'calc(100vh - 12rem)' }}>
          {/* 左侧角色列表 */}
          <Col xs={24} lg={4}>
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

              {/* 角色列表 */}
              <Card 
                title="选择聊天角色" 
                style={{ flex: 1, overflow: 'hidden' }}
                bodyStyle={{ padding: 0, height: 'calc(100%)', overflow: 'auto' }}
              >
                <List
                  dataSource={characters}
                  renderItem={(character) => (
                    <List.Item
                      className={`character-list-item ${selectedCharacter?.role_id === character.role_id ? 'selected' : ''}`}
                      onClick={() => handleCharacterSelect(character)}
                    >
                      <List.Item.Meta
                        avatar={
                          <div style={{ padding: '1rem'}}>
                            <Avatar size={48} style={{ fontSize: '1.5rem' }}>
                              {character.avatar}
                            </Avatar>
                          </div>
                        }
                        title={
                          <Space>
                            <Text strong>{character.name}</Text>
                          </Space>
                        }
                        description={
                          <div>
                            <Text type="secondary" style={{ fontSize: '0.75rem' }}>
                              {character.personality}
                            </Text>
                            <div className="character-tags">
                              {character.tags.slice(0, 2).map(tag => (
                                <Tag key={tag} size="small" color="blue">
                                  {tag}
                                </Tag>
                              ))}
                            </div>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </div>
          </Col>

          {/* 右侧聊天区域 */}
          <Col xs={24} lg={16}>
            <Card 
              style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
              bodyStyle={{ padding: 0, flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              {selectedCharacter ? (
                <>
                  {/* 聊天头部 */}
                  <div className="chat-header">
                    <Space>
                      <Avatar size={40} style={{ fontSize: '1.25rem' }}>
                        {selectedCharacter.avatar}
                      </Avatar>
                      <div>
                        <Title level={5} style={{ margin: 0 }}>
                          {selectedCharacter.name}
                        </Title>
                        <Space>
                          <Text type="secondary" style={{ fontSize: '0.75rem' }}>
                            {selectedCharacter.personality}
                          </Text>
                        </Space>
                      </div>
                    </Space>
                    <Space>
                      <Tooltip title="清空聊天记录">
                        <Button 
                          icon={<DeleteOutlined />} 
                          onClick={clearMessages}
                          type="text"
                        />
                      </Tooltip>
                    </Space>
                  </div>

                  {/* 消息列表 */}
                  <div className="messages-container">
                    {messages.map((message) => (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                          marginBottom: '1rem'
                        }}
                      >
                        <div
                          style={{
                            maxWidth: '70%',
                            display: 'flex',
                            flexDirection: message.type === 'user' ? 'row-reverse' : 'row',
                            alignItems: 'flex-start',
                            gap: '0.5rem'
                          }}
                        >
                          <div className={`message-avatar ${message.type}`}>
                            <Avatar 
                              size={32}
                              icon={message.type === 'user' ? <UserOutlined /> : <RobotOutlined />}
                              style={{ fontSize: '0.875rem' }}
                            >
                              {message.type === 'ai' ? selectedCharacter.avatar : null}
                            </Avatar>
                          </div>
                          <div>
                            <div className={`message-bubble ${message.type}`}>
                              {message?.message}
                            </div>
                            <div className={`message-timestamp ${message.type}`}>
                              {message.timestamp}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* 流式消息显示 */}
                    {isTyping && (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'flex-start',
                          marginBottom: '1rem'
                        }}
                      >
                        <div
                          style={{
                            maxWidth: '70%',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.5rem'
                          }}
                        >
                          <div className="message-avatar ai">
                            <Avatar size={32} style={{ fontSize: '0.875rem' }}>
                              {selectedCharacter.avatar}
                            </Avatar>
                          </div>
                          <div>
                            <div className="message-bubble ai streaming">
                              {!streamingMessage && (
                                <Text type="secondary">
                                  <span className="typing-dots">正在思考</span>
                                </Text>
                              )}
                              {streamingMessage && <span className="streaming-cursor">|</span>}
                            </div>
                            <div className="message-timestamp ai">
                              {new Date().toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* 输入区域 */}
                  <div className="chat-input-area">
                    <Space.Compact style={{ width: '100%' }}>
                      <TextArea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={`与 ${selectedCharacter.name} 对话...`}
                        autoSize={{ minRows: 1, maxRows: 4 }}
                        style={{ resize: 'none' }}
                      />
                      <Button
                        type="primary"
                        icon={<SendOutlined />}
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() ||  isTyping}
                        loading={isTyping}
                        style={{ height: 'auto' }}
                      >
                        {isTyping ? '发送中' : '发送'}
                      </Button>
                    </Space.Compact>
                  </div>
                </>
              ) : (
                <div className="chat-empty-state">
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="请选择一个角色开始聊天"
                  />
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </div>
    </PageContainer>
  )
}

export default Chat
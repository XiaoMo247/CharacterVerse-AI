import { useState, useRef, useEffect } from 'react'
import { 
  Avatar, 
  Button, 
  Input, 
  Space, 
  Typography, 
  Empty 
} from 'antd'
import { 
  UserOutlined, 
  RobotOutlined, 
  SendOutlined 
} from '@ant-design/icons'

const { TextArea } = Input
const { Text } = Typography

const ChatArea = ({
  selectedCharacter,
  messages = [],
  isTyping = false,
  streamingMessage = '',
  onSendMessage,
  className = ''
}) => {
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef(null)

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingMessage])

  // 处理发送消息
  const handleSendMessage = () => {
    if (!inputValue.trim() || isTyping) return
    
    onSendMessage?.(inputValue.trim())
    setInputValue('')
  }

  // 处理键盘事件
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // 如果没有选择角色，显示空状态
  if (!selectedCharacter) {
    return (
      <div className={`chat-area ${className}`}>
        <div className="chat-empty-state">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="请选择一个角色开始聊天"
          />
        </div>
      </div>
    )
  }

  return (
    <div className={`chat-area ${className}`}>
      {/* 消息列表容器 */}
      <div className="messages-container">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message-wrapper ${message.type}`}
          >
            <div className="message-content">
              <div className={`message-avatar ${message.type}`}>
                <Avatar 
                  size={32}
                  icon={message.type === 'user' ? <UserOutlined /> : <RobotOutlined />}
                  style={{ fontSize: '0.875rem' }}
                >
                  {message.type === 'ai' ? selectedCharacter.avatar : null}
                </Avatar>
              </div>
              <div className="message-body">
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
          <div className="message-wrapper ai">
            <div className="message-content">
              <div className="message-avatar ai">
                <Avatar size={32} style={{ fontSize: '0.875rem' }}>
                  {selectedCharacter.avatar}
                </Avatar>
              </div>
              <div className="message-body">
                <div className="message-bubble ai streaming">
                  {!streamingMessage && (
                    <Text type="secondary">
                      <span className="typing-dots">正在思考</span>
                    </Text>
                  )}
                  {streamingMessage && (
                    <>
                      {streamingMessage}
                      <span className="streaming-cursor">|</span>
                    </>
                  )}
                </div>
                <div className="message-timestamp ai">
                  {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 滚动锚点 */}
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
            disabled={isTyping}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
            loading={isTyping}
            style={{ height: 'auto' }}
          >
            {isTyping ? '发送中' : '发送'}
          </Button>
        </Space.Compact>
      </div>
    </div>
  )
}

export default ChatArea
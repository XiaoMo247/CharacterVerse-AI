import { useState, useRef, useEffect, useCallback } from 'react'
import { 
  Avatar, 
  Button, 
  Input, 
  Space, 
  Typography, 
  Empty ,
  Card,
  Spin,
} from 'antd'
import { 
  UserOutlined, 
  RobotOutlined, 
  SendOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import VoiceBubble from '../VoiceBubble'
import { getroleHistory } from '../../server/chatService'

const { Text } = Typography

const ChatArea = ({
  selectedCharacter,
  messages = [],
  isTyping = false,
  streamingMessage = '',
  className = '',
  messagesEndRef,
} = {}) => {
  const [historyMessages, setHistoryMessages] = useState([])
  const [visibleMessages, setVisibleMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasMoreHistory, setHasMoreHistory] = useState(true)
  const containerRef = useRef(null)
  const [itemHeight] = useState(80) // 估算每条消息的高度
  const [visibleCount] = useState(20) // 可见消息数量

  // 转换历史消息格式
  const transformHistoryMessage = useCallback((historyItem) => {
    return {
      id: historyItem.ID,
      role: historyItem.IsUser ? 'user' : 'ai',
      message: historyItem.Message,
      type: historyItem.MessageType || 'text',
      timestamp: new Date(historyItem.CreatedAt).toLocaleTimeString(),
      role_id: historyItem.RoleID,
      voice_url: historyItem.VoiceURL,
      asr_text: historyItem.ASRText,
      response_type: historyItem.ResponseType,
      created_at: historyItem.CreatedAt
    }
  }, [])

  // 加载历史消息
  const loadHistoryMessages = useCallback(async () => {
    if (!selectedCharacter?.ID || loading) return

    setLoading(true)
    try {
      const response = await getroleHistory(selectedCharacter.ID)
      if (response?.data?.text_histories && response.data.text_histories.length > 0) {
        const transformedMessages = response.data.text_histories.map(transformHistoryMessage)
        setHistoryMessages(transformedMessages)
        
        // 初始显示最新的消息（数组末尾）
        const startIndex = Math.max(0, transformedMessages.length - visibleCount)
        const visibleSlice = transformedMessages.slice(startIndex)
        setVisibleMessages(visibleSlice)
        
        // 滚动到最底部显示最新消息
        setTimeout(() => {
          if (messagesEndRef?.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
          }
        }, 100)
      }
    } catch (error) {
      console.error('加载历史消息失败:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedCharacter?.ID, transformHistoryMessage, visibleCount])

  // 处理滚动事件，向上滚动时加载更多历史消息
  const handleScroll = useCallback((e) => {
    const { scrollTop } = e.target
    
    // 当滚动到顶部附近时，加载更多历史消息
    if (scrollTop < 100 && hasMoreHistory && !loading) {
      const currentStartIndex = historyMessages.length - visibleMessages.length
      const newStartIndex = Math.max(0, currentStartIndex - visibleCount)
      
      if (newStartIndex < currentStartIndex) {
        const newVisibleMessages = historyMessages.slice(newStartIndex, currentStartIndex + visibleMessages.length)
        setVisibleMessages(newVisibleMessages)
        
        // 如果已经显示了所有历史消息，设置hasMoreHistory为false
        if (newStartIndex === 0) {
          setHasMoreHistory(false)
        }
      }
    }
  }, [historyMessages, visibleMessages, hasMoreHistory, loading, visibleCount])

  // 当选择的角色改变时，重新加载历史消息
  useEffect(() => {
    if (selectedCharacter?.ID) {
      setHistoryMessages([])
      setVisibleMessages([])
      setHasMoreHistory(true)
      loadHistoryMessages()
    }
  }, [selectedCharacter?.ID])

  // 当可见消息更新时，滚动到底部
  useEffect(() => {
    if (visibleMessages.length > 0) {
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight
        }
      }, 100)
    }
  }, [visibleMessages])

  // 合并历史消息和当前会话消息
  const allMessages = [...visibleMessages, ...messages]
  
  return (
    <>
      {/* 消息列表 */}
      <div 
        className="messages-container"
        ref={containerRef}
        onScroll={handleScroll}
        style={{ 
          maxHeight: '500px', 
          overflowY: 'auto',
          padding: '1rem'
        }}
      >
        {/* 加载更多历史消息的提示 */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <Spin size="small" />
            <Text type="secondary" style={{ marginLeft: '0.5rem' }}>
              加载历史消息...
            </Text>
          </div>
        )}

        {/* 渲染消息 */}
        {allMessages.map((message, index) => (
          <div
            key={message.id || index}
            style={{
              display: 'flex',
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: '1rem'
            }}
          >
            <div
              style={{
                maxWidth: '70%',
                display: 'flex',
                flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-start',
                gap: '0.5rem'
              }}
            >
              <div className={`message-avatar ${message.role}`}>
                <Avatar 
                  size={32}
                  icon={message.role === 'user' ? <UserOutlined /> : ''}
                  style={{ fontSize: '0.875rem' }}
                  src={message.role === 'ai'?selectedCharacter.avatar_url?selectedCharacter.avatar_url:null:null}
                >
                  {selectedCharacter.avatar_url?.startsWith('http') ? '' : '🤖'}
                </Avatar>
              </div>

              {message.type === 'text' && (
                <div>
                  <div className={`message-bubble ${message.role}`}>
                    {message?.message}
                  </div>
                  <div className={`message-timestamp ${message.role}`}>
                    {message.timestamp}
                  </div>
                </div>
              )}                
              
              {/* 语音气泡 */}
              {message.type === 'voice' && (
                <VoiceBubble
                  audioUrl={message?.voice_url || message?.message}
                  duration={message?.duration}
                  isOwn={message.role === 'ai' ? true : false}
                  maxWidth={250}
                  minWidth={100}
                />
              )}
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
                  {selectedCharacter?.avatar}
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
    </>
  )
}

export default ChatArea
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
  DeleteOutlined,
  AudioOutlined,
  PhoneOutlined
} from '@ant-design/icons'
import PageContainer from '../../components/PageContainer'
import StreamingChat from '../../utils/webSocket'
import './Chat.css'
import  ChatArea  from './components/ChatArea'
// import AdvancedMicrophoneRecorder from '../../utils/advanced-microphone'
import AudioWorkletVoiceRecorder from './components/Audio/AudioWorkletVoiceRecorder'
import { processAndSendAudio } from './server/chatService'
import { VoiceCallProvider, useVoiceCall} from './components/VoiceCall/VoiceCallManager'
import useChatStore from './store/useChatStore'

const { TextArea } = Input
const { Text, Title } = Typography

const Chat = () => {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState('')
  const messagesEndRef = useRef(null)
  const streamingChatRef = useRef(null)
  const [loading, setLoading] = useState([])
  const [isRecording, setIsRecording] = useState(false)
  const [Recordings, setRecordings] = useState([])

  // 使用 ChatStore
  const { 
    selectedCharacter, 
    characters, 
    selectCharacter, 
    processPendingCharacter 
  } = useChatStore()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingMessage])

  // 处理从其他页面传入的角色
  useEffect(() => {
    const processedCharacter = processPendingCharacter()
    if (processedCharacter) {
      // 清空之前的消息，开始新的对话
      setMessages([])
    }
  }, [processPendingCharacter])

  // 初始化WebSocket连接
  useEffect(() => {
    const initWebSocket = () => {
      streamingChatRef.current = new StreamingChat({
        wsUrl: 'ws://localhost:8080/api/ws/chat',
        onConnected: () => {
          // message.success('WebSocket连接成功')
        },
        // onDisconnected: () => {
        //   setIsTyping(false)
        //   setStreamingMessage('')
        // },
        // onStreamStart: () => {
        //   setIsTyping(true)
        //   setStreamingMessage('')
        // },
        // onStreamChunk: (chunk, fullMessage) => {
        //   setStreamingMessage(fullMessage)
        // },
        onStreamEnd: (finalMessage, messageData) => {
          setIsTyping(false)
          setStreamingMessage('')
          // 添加AI回复到消息列表
          const aiMessage = {
            role:'ai',
            message: messageData.message,
            timestamp: new Date().toLocaleTimeString(),
            role_id: messageData.role_id,
            type: messageData.type
          }
          setLoading((pre) => {
            const newLoading = [...pre]
            newLoading.pop()
            return newLoading
          })
          setMessages(prev => [...prev, aiMessage])
        },
        onError: (error) => {
          setIsTyping(false)
          setStreamingMessage('')
          // message.error(`连接错误: ${error.message}`)
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
    selectCharacter(character)
    setMessages([])
  }

   const sendMessageToAI = async (message) => {
      const formData = new FormData();
      formData.append('file', message.blob, 'recording.wav');
      const data = await processAndSendAudio(formData)
      const audioUrl = `https://ai.mcell.top${data.url}`;
      const newMessage = {
        ...message,
        message: audioUrl
      }
      setMessages(prev => [...prev, newMessage])
      const success = await streamingChatRef.current.sendMessage(newMessage)

      if (success) {
        setInputValue('')
        setLoading([...loading, 1])
        // 注意：不在这里设置isTyping，而是等待stream_start事件
      } else {
        message.error('发送消息失败')
      }
  }
  const handleSendMessage = () => {
    if (!inputValue.trim() || !selectedCharacter) return

    // 检查WebSocket连接状态
    if ( !streamingChatRef.current) {
      message.error('WebSocket未连接，请稍后重试')
      return
    }

    const userMessage = {
      role: 'user',
      message: inputValue,
      role_id: selectedCharacter.id,
      timestamp: new Date().toLocaleTimeString(),
      type: 'text',
      response_type: 2
    }

    // 添加用户消息到列表
    setMessages(prev => [...prev, userMessage])
    
    // 发送消息到WebSocket服务器
    const success = streamingChatRef.current.sendMessage(userMessage)
    
    if (success) {
      setInputValue('')
      setLoading([...loading, 1])
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

  // const onlineCharacters = characters.filter(char => char.online)
  // const totalMessages = messages.length

    // 处理录音完成
  const handleRecordingComplete = (audioBlob, duration) => {
    if(audioBlob){
      const recording = {
        role_id: selectedCharacter.id,
        blob: audioBlob,
        duration: duration,
        timestamp: new Date(),
        message: URL.createObjectURL(audioBlob),
        type: 'voice',
        role: 'user',
        format: 'wav',
        response_type: 2
      }          
      // 发送消息到WebSocket服务器
      sendMessageToAI(recording)
    }
  }

  const Vocie = () =>{
    const { startCall} = useVoiceCall()
    
    return (
          <Button
            type="primary"
            icon={ <PhoneOutlined />}
            onClick={() => startCall(selectedCharacter)}
            >
          </Button>
    )
  }

  return (
    
    <PageContainer
      title="智能聊天"
      description="与您的AI角色进行对话交流"
    >
      <div className="chat-page">
        <Row gutter={[24, 24]} style={{ height: 'calc(100vh - 12rem)' }}>
          {/* 左侧角色列表 */}
          <Col xs={24} lg={6}>
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
                      className={`character-list-item ${selectedCharacter?.id === character.id ? 'selected' : ''}`}
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
                      </div>
                    </Space>
                    <Space>
                        <Text type="secondary" style={{ fontSize: '0.75rem' }}>
                          {loading.length > 0? '对方正在输入...' : ''}
                        </Text>
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
                  <ChatArea 
                    messages={messages}
                    messagesEndRef={messagesEndRef}
                    isTyping={isTyping}
                    streamingMessage={streamingMessage}
                    selectedCharacter={selectedCharacter}
                    inputValue={inputValue}
                    setInputValue={setInputValue}
                    handleKeyPress={handleKeyPress}
                    handleSendMessage={handleSendMessage}
                  /> 
                  <AudioWorkletVoiceRecorder
                    onRecordingComplete={handleRecordingComplete}
                    maxDuration={30}
                    minDuration={1}
                    visible={isRecording}
                    onClose={()=>{setIsRecording(false)}}
                    start={isRecording}
                  />
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
                      <Button
                        type="primary"
                        icon={ <AudioOutlined />}
                        onClick={() => setIsRecording(true)}
                        >
                      </Button>
                      <VoiceCallProvider>
                              <Vocie></Vocie>
                      </VoiceCallProvider>
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
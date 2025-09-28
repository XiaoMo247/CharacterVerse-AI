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
import LazyAvatar from '../../components/LazyAvatar'
import { preloadAvatar } from '../../utils/avatarCache'
import StreamingChat from '../../utils/webSocket'
import './Chat.css'
import  ChatArea  from './components/ChatArea'
// import AdvancedMicrophoneRecorder from '../../utils/advanced-microphone'
import AudioWorkletVoiceRecorder from './components/Audio/AudioWorkletVoiceRecorder'
import { processAndSendAudio ,getHistory } from './server/chatService'
import { VoiceCallProvider, useVoiceCall} from './components/VoiceCall/VoiceCallManager'
import useChatStore from './store/useChatStore'

const { TextArea } = Input
const { Text, Title } = Typography
const wsURL = import.meta.env.VITE_WEBSOCKET_URL
const VIOCEURL = import.meta.env.VITE_UPVOICE_URL

const Chat = () => {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState('')
  const messagesEndRef = useRef(null)
  const streamingChatRef = useRef(null)
  const [loading, setLoading] = useState([])
  const [isRecording, setIsRecording] = useState(false)
  const [starCalls, setStarCalls] = useState(false)
  const [callTime, setCallTime] = useState(0)

  // 使用 ChatStore
  const { 
    selectedCharacter, 
    characters, 
    selectCharacter, 
    processPendingCharacter,
    setCharacters
  } = useChatStore()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const initgetHistory = async() => {
    try {
      const res = await getHistory()
      if (res && Array.isArray(res)) {
        // 从历史消息中提取角色信息
        const roleMap = new Map()
        res.forEach(message => {
          if (message.role && !roleMap.has(message.role.ID)) {
            if(message.role.name){
                roleMap.set(message.role.ID, {
                  ID: message.role.ID,
                  name: message.role.name || `角色${message.role.ID}`,
                  avatar_url: message.role.avatar_url || '',
                  personality: message.role.personality || message.role.description || '',
                  CreatedAt: message.role.CreatedAt,
                  UpdatedAt: message.role.UpdatedAt,
                  tags: [
                    message.role.gender && (message.role.gender === 'male' ? '男性' : message.role.gender === 'female' ? '女性' : message.role.gender),
                    message.role.age && `${message.role.age}岁`,
                  ].filter(Boolean),
                })
            }
          }
        })
        // 设置角色列表
        const characters = Array.from(roleMap.values())
        await setCharacters(characters)
      }
    } catch (error) {
      // 获取历史记录失败
    }
  }

  // 初始化获取历史记录和角色列表
  useEffect(() => {
    const init = async () => {
      await initgetHistory()
      // 在历史记录加载完成后处理待处理的角色
        setTimeout(()=>{
            const processedCharacter = processPendingCharacter()

            if (processedCharacter) {
              // 清空之前的消息，开始新的对话
              setMessages([])
            }
        },100)

    }
    init()
  }, [])

  // 监听角色列表变化，预加载所有头像
  useEffect(() => {
    // 预加载所有角色的头像
    characters.forEach(character => {
      if (character.avatar_url && character.avatar_url.startsWith('http')) {
        preloadAvatar(character.avatar_url).catch(() => {})
      }
    })
  }, [characters])

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingMessage])


  // 监听选择的角色切换，初始化WebSocket连接
  useEffect(() => {
    if (!selectedCharacter) return

    const initWebSocket = () => {
      // 如果已有连接，先断开
      if (streamingChatRef.current) {
        streamingChatRef.current.disconnect()
      }

      streamingChatRef.current = new StreamingChat({
        wsUrl: `${wsURL}/ws/chat`,
        onConnected: () => {
          // WebSocket连接成功
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
  }, [selectedCharacter])

  const handleCharacterSelect = (character) => {
    selectCharacter(character)
    setMessages([])
    
    // 预加载新选择角色的头像
    if (character.avatar_url && character.avatar_url.startsWith('http')) {
      preloadAvatar(character.avatar_url).catch(() => {})
    }
  }

   const sendMessageToAI = async (message) => {
      const formData = new FormData();
      formData.append('file', message.blob, 'recording.wav');
      const data = await processAndSendAudio(formData)
      const audioUrl = `${VIOCEURL}${data.url}`;
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
      role_id: selectedCharacter.ID,
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

    // 处理录音完成
  const handleRecordingComplete = (audioBlob, duration) => {
    if(audioBlob){
      const recording = {
        role_id: selectedCharacter.ID,
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

  useEffect(() => {
    if(callTime !== 0 ){
        const userMessage = {
        role: 'user',
        message: callTime,
        role_id: selectedCharacter.ID,
        timestamp: new Date().toLocaleTimeString(),
        type: 'voice_call',
      }
      // 添加用户消息到列表
      setMessages(prev => [...prev, userMessage])
      setCallTime(0)
    }
  },[callTime])

  const Vocie = () =>{
    const { startCall , callState} = useVoiceCall()
    useEffect(() => {
      if(starCalls){
         startCall(selectedCharacter)
      }
      setStarCalls(false)
    },[starCalls])

    useEffect(() => {
      if(callState. callType === "ending"){
        if(callState.duration){
          setCallTime(callState.duration)
        }
      }
    },[callState.callType])
    
    
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
                      className={`character-list-item ${selectedCharacter?.ID === character.ID ? 'selected' : ''}`}
                      onClick={() => handleCharacterSelect(character)}
                    >
                      <List.Item.Meta
                        avatar={
                          <div style={{ padding: '1rem'}}>
                            <LazyAvatar 
                              size={48} 
                              src={character.avatar_url}
                            />
                          </div>
                        }
                        title={
                          <Space>
                            <Text strong>{character.name}</Text>
                          </Space>
                        }
                        description={
                          <div>
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
                      <LazyAvatar 
                        size={40} 
                        src={selectedCharacter.avatar_url}
                      />
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
                    setStarCalls={setStarCalls}
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
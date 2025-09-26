import { useState, useRef, useEffect } from 'react'
import { 
  Avatar, 
  Button, 
  Input, 
  Space, 
  Typography, 
  Empty ,
  Card,
} from 'antd'
import { 
  UserOutlined, 
  RobotOutlined, 
  SendOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import VoiceBubble from '../VoiceBubble'

const ChatArea = ({
  selectedCharacter,
  messages = [],
  isTyping = false,
  streamingMessage = '',
  className = '',
  messagesEndRef,
} = props) => {

  return (
      <>
      {/* 消息列表 */}
      <div className="messages-container">
        {messages.map((message,index) => (
          <div
            key={index}
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
              { message?.message && (
                <div className={`message-avatar ${message.role}`}>
                  <Avatar 
                    size={32}
                    icon={message.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                    style={{ fontSize: '0.875rem' }}
                  >
                    {message.role === 'ai' ? selectedCharacter.avatar : null}
                  </Avatar>
                </div>
              )}

              {message.type === 'text' &&(
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
                  audioUrl={message?.message}
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
      </>
  )
}

export default ChatArea
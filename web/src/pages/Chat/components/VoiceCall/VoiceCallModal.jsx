import React, { useState } from 'react'
import { Modal, Button, Avatar, Typography } from 'antd'
import { PhoneOutlined, AudioOutlined, AudioMutedOutlined } from '@ant-design/icons'
import WaveformBars from '../wave/WaveformBars'
import './VoiceCallModal.css'

const { Text, Title } = Typography

const VoiceCallModal = ({
  visible,
  onClose,
  character,
  onHangup,
  duration = 0,
  callType = 'outgoing',
  // 新增音频数据参数
  isSpeaking = false,
  volume = 0,
  frequencyData = null,
  // 新增静音参数
  isMuted = false,
  onToggleMute = () => {},
}) => {

  // 格式化通话时长
const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // 获取通话状态文本
  const getStatusText = () => {
    switch (callType) {
      case 'outgoing':
        return '正在呼叫...'
      case 'connecting':
        return '正在连接...'
      case 'connected':
        return `通话中 ${formatDuration(duration)}`
      case 'ending':
        return '通话结束中...'
      default:
        return formatDuration(duration)
    }
  }

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      closable={false}
      centered
      width={400}
      className="voice-call-modal"
      styles={{
        mask: { backgroundColor: 'rgba(0, 0, 0, 0.8)' }
      }}
    >
      <div className="voice-call-container">
        {/* 背景装饰 */}
        <div className="call-background">
          <div className="gradient-overlay"></div>
          <div className="floating-particles">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`particle particle-${i + 1}`}></div>
            ))}
          </div>
        </div>

        {/* 通话内容 */}
        <div className="call-content">
          {/* 角色头像 */}
          <div className="character-avatar-container">
            <div className="avatar-ring pulsing">
              <Avatar 
                size={120} 
                className="character-avatar"
                style={{ fontSize: '3rem' }}
              >
                {character?.avatar || '🤖'}
              </Avatar>
            </div>
          </div>

          {/* 角色信息 */}
          <div className="character-info">
            <Title level={3} className="character-name">
              {character?.name || '未知角色'}
            </Title>
            <Text className="call-status">
              {getStatusText()}
            </Text>
          </div>

          {/* 语音波形显示 - 通话中显示 */}
          {callType === 'connected' && (
            <div className="voice-waveform-container">
              <WaveformBars
                isActive={isSpeaking}
                barCount={15}
                maxHeight={30}
                color="#1890ff"
                volume={volume}
                frequencyData={frequencyData}
                className="call-waveform"
                style={{ 
                  background: 'transparent',
                  padding: '10px 0'
                }}
              />
              <div className="speaking-indicator">
                {'通话中'}
              </div>
            </div>
          )}

          {/* 控制按钮 */}
          <div className="call-controls">
            {/* 静音按钮 - 仅在通话中显示 */}
            {callType === 'connected' && (
              <Button
                type={isMuted ? "default" : "primary"}
                shape="circle"
                size="large"
                icon={isMuted ? <AudioMutedOutlined /> : <AudioOutlined />}
                onClick={onToggleMute}
                className={`mute-btn ${isMuted ? 'muted' : ''}`}
                title={isMuted ? '取消静音' : '静音'}
              />
            )}
            
            {/* 挂断按钮 */}
            <Button
              type="primary"
              danger
              shape="circle"
              size="large"
              icon={<PhoneOutlined style={{ transform: 'rotate(135deg)' }} />}
              onClick={onHangup}
              className="hangup-btn"
              title="挂断"
            />
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default VoiceCallModal
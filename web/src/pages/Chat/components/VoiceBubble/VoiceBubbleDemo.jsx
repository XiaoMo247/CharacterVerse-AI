import React, { useState } from 'react'
import { Button, Space, Card, Typography, Divider } from 'antd'
import VoiceBubble from './VoiceBubble'
import AudioWorkletVoiceRecorder from '../Audio/AudioWorkletVoiceRecorder'

const { Title, Text } = Typography

/**
 * 语音冒泡组件演示页面
 * 展示如何使用 VoiceBubble 组件播放录音内容
 */
const VoiceBubbleDemo = () => {
  const [recordedAudios, setRecordedAudios] = useState([])
  const [showRecorder, setShowRecorder] = useState(false)

  // 处理录音完成
  const handleRecordingComplete = (audioBlob, duration) => {
    const newAudio = {
      id: Date.now(),
      audioBlob,
      duration,
      timestamp: new Date(),
      isOwn: true
    }
    setRecordedAudios(prev => [...prev, newAudio])
    console.log('录音完成:', { size: audioBlob.size, duration })
  }

  // 添加模拟的他人语音消息
  const addSampleMessage = () => {
    // 创建一个模拟的音频 Blob（实际项目中这会是真实的音频数据）
    const sampleAudio = {
      id: Date.now(),
      audioUrl: null, // 在实际项目中，这里会是服务器返回的音频URL
      duration: Math.floor(Math.random() * 30) + 5, // 5-35秒随机时长
      timestamp: new Date(),
      isOwn: false,
      // 模拟数据，实际使用时不需要
      isSample: true
    }
    setRecordedAudios(prev => [...prev, sampleAudio])
  }

  // 清空所有消息
  const clearMessages = () => {
    setRecordedAudios([])
  }

  // 播放事件处理
  const handlePlayStart = (audioId) => {
    console.log('开始播放音频:', audioId)
  }

  const handlePlayEnd = (audioId) => {
    console.log('播放结束:', audioId)
  }

  const handlePlayError = (audioId, error) => {
    console.error('播放错误:', audioId, error)
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>语音冒泡组件演示</Title>
      <Text type="secondary">
        类似 QQ/微信 的语音消息气泡，支持播放录音内容
      </Text>

      <Divider />

      {/* 控制按钮 */}
      <Space style={{ marginBottom: '20px' }}>
        <Button 
          type="primary" 
          onClick={() => setShowRecorder(true)}
        >
          开始录音
        </Button>
        <Button onClick={addSampleMessage}>
          添加示例消息
        </Button>
        <Button onClick={clearMessages} disabled={recordedAudios.length === 0}>
          清空消息
        </Button>
      </Space>

      {/* 语音消息列表 */}
      <Card title="语音消息列表" style={{ marginBottom: '20px' }}>
        {recordedAudios.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            暂无语音消息，点击"开始录音"创建第一条语音消息
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recordedAudios.map((audio) => (
              <div
                key={audio.id}
                style={{
                  display: 'flex',
                  justifyContent: audio.isOwn ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-end',
                  gap: '8px'
                }}
              >
                {/* 时间戳 */}
                <Text 
                  type="secondary" 
                  style={{ 
                    fontSize: '12px',
                    order: audio.isOwn ? 2 : 0,
                    marginBottom: '4px'
                  }}
                >
                  {audio.timestamp.toLocaleTimeString()}
                </Text>

                {/* 语音气泡 */}
                <VoiceBubble
                  audioBlob={audio.isSample ? null : audio.audioBlob}
                  audioUrl={audio.audioUrl}
                  duration={audio.duration}
                  isOwn={audio.isOwn}
                  onPlayStart={() => handlePlayStart(audio.id)}
                  onPlayEnd={() => handlePlayEnd(audio.id)}
                  onPlayError={(error) => handlePlayError(audio.id, error)}
                  maxWidth={250}
                  minWidth={100}
                />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 使用说明 */}
      <Card title="使用说明">
        <div style={{ lineHeight: '1.8' }}>
          <Text strong>功能特性：</Text>
          <ul>
            <li>🎵 支持播放录音内容（Blob 或 URL）</li>
            <li>🎨 类似 QQ/微信 的气泡样式</li>
            <li>📊 实时波形动画效果</li>
            <li>⏱️ 显示播放进度和时长</li>
            <li>🎯 区分自己和他人的消息样式</li>
            <li>🌙 支持暗色主题适配</li>
            <li>📱 响应式设计，移动端友好</li>
          </ul>

          <Text strong>使用方法：</Text>
          <pre style={{ 
            background: '#f5f5f5', 
            padding: '12px', 
            borderRadius: '4px',
            marginTop: '8px',
            fontSize: '13px'
          }}>
{`import VoiceBubble from './components/VoiceBubble'

<VoiceBubble
  audioBlob={audioBlob}        // 音频 Blob 数据
  duration={duration}          // 录音时长
  isOwn={true}                // 是否为自己发送
  onPlayStart={() => {}}      // 播放开始回调
  onPlayEnd={() => {}}        // 播放结束回调
  onPlayError={() => {}}      // 播放错误回调
/>`}
          </pre>
        </div>
      </Card>

      {/* 录音组件 */}
      <AudioWorkletVoiceRecorder
        visible={showRecorder}
        start={showRecorder}
        onClose={() => setShowRecorder(false)}
        onRecordingComplete={handleRecordingComplete}
        onRecordingCancel={() => setShowRecorder(false)}
        maxDuration={60}
        minDuration={1}
      />
    </div>
  )
}

export default VoiceBubbleDemo
import React, { useState } from 'react'
import {  AudioWorkletWaveform, AudioWorkletVoiceRecorder } from '../Chat/components/Audio'
import './VoiceDemo.css'
import {
    Button
} from 'antd'

/**
 * 语音录音演示页面 - 展示 AudioWorklet 和传统录音效果对比
 */
const VoiceDemo = () => {
  const [recordings, setRecordings] = useState([])
  const [isRecording, setIsRecording] = useState(false)

  // 处理录音完成
  const handleRecordingComplete = (audioBlob, duration) => {
    const recording = {
      id: Date.now(),
      blob: audioBlob,
      duration: duration,
      timestamp: new Date(),
      url: URL.createObjectURL(audioBlob),
      type: audioBlob.type.includes('wav') ? 'AudioWorklet' : 'MediaRecorder'
    }
    
    setRecordings(prev => [...prev, recording])
    console.log('录音完成:', recording)
  }

  // 播放录音
  const playRecording = (recording) => {
    const audio = new Audio(recording.url)
    audio.play()
  }

  // 下载录音
  const downloadRecording = (recording) => {
    const a = document.createElement('a')
    a.href = recording.url
    a.download = `录音_${recording.type}_${recording.timestamp.toLocaleString()}.${recording.type === 'AudioWorklet' ? 'wav' : 'webm'}`
    a.click()
  }

  // 删除录音
  const deleteRecording = (id) => {
    setRecordings(prev => prev.filter(r => r.id !== id))
  }

  // 格式化时间
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="voice-demo">
        {/* AudioWorklet 完整录音组件演示 */}
        <section className="demo-section featured">
          <h2>🚀 AudioWorklet 录音组件</h2>
          <p>基于 AudioWorkletRecorder 的高性能录音，波形从中间向两边跳动</p>
          <Button onClick={() => setIsRecording(true)}>开始录音</Button>
          <div className="recorder-demo">
            <AudioWorkletVoiceRecorder
              onRecordingComplete={handleRecordingComplete}
              maxDuration={30}
              minDuration={1}
              visible={isRecording}
              onClose={()=>{setIsRecording(false)}}
              start={isRecording}
            />
          </div>
        </section>


        {/* 录音历史 */}
        <section className="demo-section">
          <h2>📝 录音历史</h2>
          <p>查看、播放、下载已录制的音频，对比不同录音技术的效果</p>
          
          <div className="recordings-list">
            {recordings.length === 0 ? (
              <div className="empty-state">
                <p>🎵 还没有录音，试试上面的录音功能吧！</p>
              </div>
            ) : (
              recordings.map(recording => (
                <div key={recording.id} className="recording-item">
                  <div className="recording-info">
                    <div className="recording-header">
                      <span className="recording-icon">
                        {recording.type === 'AudioWorklet' ? '🚀' : '🎵'}
                      </span>
                      <span className="recording-type">{recording.type}</span>
                      <span className="recording-time">
                        {recording.timestamp.toLocaleString()}
                      </span>
                    </div>
                    <div className="recording-details">
                      <span>时长: {formatTime(recording.duration)}</span>
                      <span>大小: {(recording.blob.size / 1024).toFixed(1)} KB</span>
                      <span>格式: {recording.type === 'AudioWorklet' ? 'WAV' : 'WebM'}</span>
                    </div>
                  </div>
                  
                  <div className="recording-actions">
                    <button 
                      className="play-btn"
                      onClick={() => playRecording(recording)}
                      title="播放"
                    >
                      ▶️
                    </button>
                    <button 
                      className="download-btn"
                      onClick={() => downloadRecording(recording)}
                      title="下载"
                    >
                      💾
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => deleteRecording(recording.id)}
                      title="删除"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {recordings.length > 0 && (
            <button 
              className="clear-all-btn"
              onClick={() => setRecordings([])}
            >
              🗑️ 清空所有录音
            </button>
          )}
        </section>

      </div>
  )
}

export default VoiceDemo
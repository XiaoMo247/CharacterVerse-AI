import React, { useState, useRef, useEffect, useCallback } from 'react'
import { PlayCircleOutlined, PauseCircleOutlined, SoundOutlined } from '@ant-design/icons'
import './VoiceBubble.css'

/**
 * 语音冒泡组件 - 类似QQ/微信的语音消息气泡
 * 支持播放录音内容，显示播放进度和时长
 */
const VoiceBubble = ({
  audioBlob = null,           // 音频 Blob 数据
  audioUrl = null,            // 音频 URL（二选一）
  duration = 0,               // 录音时长（秒）
  isOwn = false,              // 是否为自己发送的消息
  className = '',
  style = {},
  onPlayStart = () => {},     // 播放开始回调
  onPlayEnd = () => {},       // 播放结束回调
  onPlayError = () => {},     // 播放错误回调
  showWaveform = true,        // 是否显示波形动画
  maxWidth = 200,             // 最大宽度
  minWidth = 100              // 最小宽度
}) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(duration)
  const [audioSrc, setAudioSrc] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [waveform, setWaveform] = useState(new Array(8))

  const audioRef = useRef(null)
  const progressRef = useRef(null)

  // 初始化音频源
  useEffect(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob)
      setAudioSrc(url)
      return () => URL.revokeObjectURL(url)
    } else if (audioUrl) {
      setAudioSrc(audioUrl)
    }
  }, [audioBlob, audioUrl])

  // 音频事件处理
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      setAudioDuration(audio.duration)
      setIsLoading(false)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
      const arr = new Array((audio.currentTime/10) > 0 ? (audio.currentTime/10)*6 : 6)
      setWaveform(arr)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
      onPlayEnd()
    }

    const handleError = (e) => {
      setError('音频播放失败')
      setIsPlaying(false)
      setIsLoading(false)
      onPlayError(e)
    }

    const handleLoadStart = () => {
      setIsLoading(true)
      setError(null)
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)
    audio.addEventListener('loadstart', handleLoadStart)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('loadstart', handleLoadStart)
    }
  }, [audioSrc, onPlayEnd, onPlayError])

  // 播放/暂停控制
  const togglePlay = useCallback(async () => {
    if (!audioRef.current || !audioSrc) return

    try {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        await audioRef.current.play()
        setIsPlaying(true)
        onPlayStart()
      }
    } catch (err) {
      setError('播放失败')
      setIsPlaying(false)
      onPlayError(err)
    }
  }, [isPlaying, audioSrc, onPlayStart, onPlayError])

  // 格式化时间显示
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0''"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return mins > 0 ? `${mins}'${secs.toString().padStart(2, '0')}"` : `${secs}''`
  }

  // 计算气泡宽度（根据时长）
  const getBubbleWidth = () => {
    if (!audioDuration) return minWidth
    // 根据时长计算宽度，最短1秒对应最小宽度，最长60秒对应最大宽度
    const ratio = Math.min(audioDuration / 60, 1)
    return minWidth + (maxWidth - minWidth) * ratio
  }

  // 计算播放进度
  const getProgress = () => {
    if (!audioDuration) return 0
    return (currentTime / audioDuration) * 100
  }

  return (
    <div 
      className={`voice-bubble ${isOwn ? 'own' : 'other'} ${className}`}
      style={{ 
        width: getBubbleWidth() || minWidth,
        ...style 
      }}
    >
      {/* 隐藏的音频元素 */}
      {audioSrc && (
        <audio
          ref={audioRef}
          src={audioSrc}
          preload="metadata"
        />
      )}

      {/* 语音气泡内容 */}
      {!isLoading  &&(
        <div className="voice-content"   onClick={togglePlay}>
        {/* 播放按钮 */}
        <div 
          className={`play-button ${isPlaying ? 'playing' : ''} ${isLoading ? 'loading' : ''}`}
          disabled={!audioSrc || isLoading}
        >
          {isLoading ? (
            <div className="loading-spinner" />
          ) : isPlaying ? (
            <PauseCircleOutlined />
          ) : (
            <PlayCircleOutlined />
          )}
        </div>
        {/* 波形动画区域 */}
        {showWaveform && (
          <div className="waveform-container1">
            <div className={`waveform1 ${isPlaying ? 'playing' : ''}`}>
              {[...waveform].map((_, index) => (
                <div 
                  key={index}
                  className="waveform-barss"
                  style={{
                    animationDelay: `${index * 0.1}s`
                  }}
                />
              ))}
            </div>
          </div>
        )}
        <div>
             {isPlaying ? formatTime(currentTime) : formatTime(audioDuration)}
        </div>
      </div>
      )}

    </div>
  )
}

export default VoiceBubble
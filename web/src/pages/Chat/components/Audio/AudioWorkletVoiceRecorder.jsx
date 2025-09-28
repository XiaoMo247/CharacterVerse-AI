import React, { useState, useRef, useCallback, useEffect } from 'react'
import AudioWorkletRecorder from '../../../../utils/audio-worklet'
import AudioWorkletWaveform from './AudioWorkletWaveform'
import './AudioWorkletVoiceRecorder.css'
import {
    CloseCircleOutlined,
    PauseCircleOutlined,
    PlayCircleOutlined,
    CheckCircleOutlined
} from '@ant-design/icons'
import { Button, Modal } from 'antd'

/**
 * 基于 AudioWorkletRecorder 的完整录音组件
 * 集成从中间向两边跳动的波形显示
 * 使用 Modal 包裹，关闭操作集成在 stopRecording 中
 */
const AudioWorkletVoiceRecorder = ({
  visible = false,
  onClose = () => {},
  onRecordingComplete = () => {},
  onRecordingStart = () => {},
  onRecordingStop = () => {},
  onRecordingCancel = () => {},
  maxDuration = 60,
  minDuration = 1,
  className = '',
  style = {},
  modalProps = {},
  start = false
}) => {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0)
  const [recordedBlob, setRecordedBlob] = useState(null)
  const [error, setError] = useState(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [frequencyData, setFrequencyData] = useState(null)
  const [hasStartedRecording, setHasStartedRecording] = useState(false)

  const recorderRef = useRef(null)
  const timerRef = useRef(null)
  const startTimeRef = useRef(0)
  const pausedDurationRef = useRef(0)

  // 重置录音状态
  const resetRecordingState = useCallback(() => {
    setIsRecording(false)
    setIsPaused(false)
    setDuration(0)
    setRecordedBlob(null)
    setVolume(0)
    setFrequencyData(null)
    setHasStartedRecording(false)
  }, [])

  // 初始化录音器
  const initializeRecorder = useCallback(async () => {
    try {
      if (recorderRef.current) {
        recorderRef.current.cleanup()
      }

      const recorder = new AudioWorkletRecorder({
        sampleRate: 44100,
        channels: 1,
        bufferSize: 2048,
        enableAnalysis: true,
        onVolumeChange: (vol) => {
          setVolume(vol)
        },
        onFrequencyData: (data) => {
          // 确保传递正确的频域数据格式
          if (data && data.frequency) {
            setFrequencyData(data.frequency)
          } else if (Array.isArray(data)) {
            setFrequencyData(data)
          }
        },
        onError: (err) => {
          setError(err.message || err.toString())
        },
        onStateChange: (state, info) => {
          // 状态变化处理
        }
      })

      const success = await recorder.initialize()
      if (success) {
        recorderRef.current = recorder
        setIsInitialized(true)
        setError(null)
      } else {
        throw new Error('AudioWorkletRecorder 初始化失败')
      }
    } catch (err) {
      setError(err.message || err.toString())
      setIsInitialized(false)
    }
  }, [])

  // 开始计时
  const startTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    
    timerRef.current = setInterval(() => {
      const now = Date.now()
      const elapsed = (now - startTimeRef.current) / 1000
      
      setDuration(elapsed)
      
      // 检查是否达到最大时长
      if (elapsed >= maxDuration) {
        // 这里不能直接调用 stopRecording，会造成循环依赖
        // 通过 state 来触发停止
        stopRecording()
      }
    }, 100)
  }, [maxDuration])

  // 停止计时
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // 开始录音
  const startRecording = useCallback(async () => {
    try {
      // 检查录音器是否已初始化，如果没有则先初始化
      if (!recorderRef.current) {
        await initializeRecorder()
        
        // 再次检查初始化是否成功（直接检查 recorderRef，不依赖状态）
        if (!recorderRef.current) {
          throw new Error('录音器初始化失败，请检查麦克风权限')
        }
      }
      await recorderRef.current.startRecording()
      
      setIsRecording(true)
      setIsPaused(false)
      setDuration(0)
      setRecordedBlob(null)
      setError(null)
      setHasStartedRecording(true)
      
      startTimeRef.current = Date.now()
      pausedDurationRef.current = 0
      
      // 开始计时
      startTimer()
      
      onRecordingStart()
    } catch (err) {
      setError(err.message || err.toString())
    }
  }, [isInitialized, initializeRecorder, onRecordingStart, startTimer])

  // 组件显示时自动初始化录音器
  useEffect(() => {
    if (visible && !isInitialized && !recorderRef.current) {
      initializeRecorder()
    }
  }, [visible, isInitialized, initializeRecorder])

  // 自动开始录音 - 只在组件首次显示且需要开始录音时触发
  useEffect(() => {
    if (start && visible && isInitialized && !isRecording && !hasStartedRecording) {
        startRecording()
    }
  }, [start, visible, isInitialized, isRecording, hasStartedRecording, startRecording])

  // 暂停录音
  const pauseRecording = useCallback(() => {
    if (recorderRef.current && isRecording && !isPaused) {
      recorderRef.current.pauseRecording()
      setIsPaused(true)
      
      // 停止计时器，保持当前时长
      stopTimer()
    }
  }, [isRecording, isPaused, stopTimer])

  // 恢复录音
  const resumeRecording = useCallback(() => {
    if (recorderRef.current && isRecording && isPaused) {
      recorderRef.current.resumeRecording()
      setIsPaused(false)
      
      // 重新设置开始时间，保持已录制的时长
      startTimeRef.current = Date.now() - (duration * 1000)
      
      startTimer()
    }
  }, [isRecording, isPaused, duration, startTimer])

  // 停止录音并关闭 Modal
  const stopRecording = useCallback(async () => {
    if (!recorderRef.current || !isRecording) {
      return
    }

    try {
      // 场景处理：
      // 1. 直接录音 → 完成 ✅
      // 2. 录音 → 暂停 → 完成 ✅
      
      // 先停止计时器
      stopTimer()
      
      // 如果当前是暂停状态，先恢复录音再停止
      if (isPaused) {
        await recorderRef.current.resumeRecording()
        // 给录音器一点时间恢复状态
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      // 停止录音器并获取录音数据
      const audioBlob = await recorderRef.current.stopRecording()
      
      // 验证录音数据
      if (!audioBlob || !(audioBlob instanceof Blob) || audioBlob.size === 0) {
        throw new Error('录音数据无效或为空')
      }
      
      // 更新状态
      setRecordedBlob(audioBlob)
      resetRecordingState()
      
      // 调用回调
      onRecordingStop()
      onRecordingComplete(audioBlob, duration)
      
      // 关闭 Modal
      onClose()
    } catch (err) {
      setError(err.message || err.toString())
      
      // 即使出错也要清理状态
      resetRecordingState()
    }
  }, [isRecording, isPaused, duration, onRecordingStop, onRecordingComplete, onClose, stopTimer, resetRecordingState])

  // 取消录音并关闭 Modal
  const cancelRecording = useCallback(async() => {
    // 停止计时器
    stopTimer()
    
    // 场景处理：
    // 1. 开始录音 → 直接取消录音 ✅
    // 2. 录音 → 暂停 → 取消 ✅  
    // 3. 直接取消（未开始录音） ✅
    
    if (recorderRef.current && isRecording) {
      try {
        // 停止音频分析
        if (recorderRef.current.stopAnalysis) {
          recorderRef.current.stopAnalysis()
        }
        
        // 发送停止消息到 WorkletNode，但不等待返回数据
        if (recorderRef.current.workletNode) {
          recorderRef.current.workletNode.port.postMessage({ type: 'stop' })
        }
        
        // 重置录音器状态但保持初始化状态
        recorderRef.current.isRecording = false
        recorderRef.current.isPaused = false
        recorderRef.current.recordedChunks = []
      } catch (err) {
        // 取消录音时的错误处理
      }
    }
    
    // 清理组件状态
    resetRecordingState()
    
    // 调用取消回调
    onRecordingCancel()
    
    // 关闭 Modal
    onClose()
  }, [isRecording, onRecordingCancel, onClose, stopTimer, resetRecordingState])

  // 格式化时间
  const formatTime = (seconds) => {
    const secs = Math.floor(seconds % 60)
    return `${secs.toString().padStart(2)}s`
  }

  // Modal 关闭处理
  const handleModalClose = useCallback(() => {
    // 场景处理：
    // 1. 直接取消（未开始录音就关闭） ✅
    // 2. 录音过程中关闭 → 调用取消录音 ✅
    
    if (isRecording) {
      // 正在录音时关闭，调用取消录音
      cancelRecording()
    } else {
      // 未录音时关闭，直接关闭Modal
      onClose()
    }
  }, [isRecording, cancelRecording, onClose])


  return (
    <Modal
      open={visible}
      onCancel={handleModalClose}
      footer={null}
      title={null}
      width={500}
      centered
      maskClosable={false}
      closable={false}
      {...modalProps}
    >
        {/* 错误提示 */}
        {error && (
          <div className="error-message">
            <span>{error}</span>
            <Button onClick={() => setError(null)}>×</Button>
          </div>
        )}

        {/* 录音界面 */}
        <div className="recorder-container">
          {/* 波形显示区域 */}
          <div className="waveform-section">
            <AudioWorkletWaveform
              isRecording={isRecording && !isPaused}
              barCount={25}
              maxHeight={40}
              color="#1890ff"
              className={`${isRecording ? 'recording' : ''} ${isPaused ? 'paused' : ''}`}
              // 传递音频数据给波形组件
              volume={volume}
              frequencyData={frequencyData}
              volumeTime={formatTime(duration)}
            />
          </div>

          {/* 控制按钮 */}
          <div className="control-buttons">
            {!isRecording && !recordedBlob && (
              <Button 
                type="primary"
                size="large"
                onClick={() => {
                  startRecording()
                }}
                disabled={!isInitialized}
                title={isInitialized ? "开始录音" : "正在初始化..."}
                loading={!isInitialized}
              >
                {isInitialized ? '开始录音' : '初始化中...'}
              </Button>
            )}

            {isRecording && (
              <>
                <Button 
                  size="large"
                  onClick={isPaused ? resumeRecording : pauseRecording}
                  title={isPaused ? "继续录音" : "暂停录音"}
                  icon={isPaused ? <PlayCircleOutlined/> : <PauseCircleOutlined/>}
                >
                  {isPaused ? '继续' : '暂停'}
                </Button>
                
                <Button 
                  type="primary"
                  size="large"
                  onClick={stopRecording}
                  disabled={duration < minDuration}
                  title={duration < minDuration ? `至少录音${minDuration}秒` : "完成录音"}
                  icon={<CheckCircleOutlined />}
                >
                  完成
                </Button>
                
                <Button 
                  danger
                  size="large"
                  onClick={cancelRecording}
                  title="取消录音"
                  icon={<CloseCircleOutlined />}
                >
                  取消
                </Button>
              </>
            )}
          </div>
        </div>

    </Modal>
  )
}

export default AudioWorkletVoiceRecorder
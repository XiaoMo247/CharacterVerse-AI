import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { message } from 'antd'
import VoiceCallModal from './VoiceCallModal'
import AudioWorkletRecorder from '../../../../utils/audio-worklet'
import StreamingChat from '../../../../utils/webSocket'
import { MicVAD, utils } from '@ricky0123/vad-web'
import { processAndSendAudio } from '../../server/chatService'
import  useChatStore  from '../../store/useChatStore'

// 创建通话上下文
const VoiceCallContext = createContext()
const wsURL = import.meta.env.VITE_WEBSOCKET_URL

const VIOCEURL = import.meta.env.UPVOICE_URL

// 通话状态枚举
export const CALL_STATES = {
  IDLE: 'idle',
  OUTGOING: 'outgoing',
  INCOMING: 'incoming',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ENDING: 'ending'
}

// 通话管理器Provider
export const VoiceCallProvider = ({ children }) => {
  const [callState, setCallState] = useState({
    visible: false,
    character: null,
    callType: CALL_STATES.IDLE,
    duration: 0,
    isRecording: false,
    isMuted: false,
    wsConnected: false,
    wsError: null
  })

  // 新增音频数据状态
  const [audioData, setAudioData] = useState({
    isSpeaking: false,
    volume: 0,
    frequencyData: null,
    lastUpdate: 0
  })

  // 新增播放队列状态
  const [playbackState, setPlaybackState] = useState({
    isPlaying: false,
    audioQueue: [],
    currentAudio: null
  })

  const durationTimerRef = useRef()
  const audioRecorderRef = useRef()
  const streamingChatRef = useRef()
  const silenceTimerRef = useRef()
  const audioContextRef = useRef()
  const playbackQueueRef = useRef([])
  const currentAudioRef = useRef(null)
  const lastSpeakingTimeRef = useRef(Date.now())
  const recordingChunksRef = useRef([])
  const lastVolumeRef = useRef(0)
  const vadRef = useRef(null)
  const speechStartTimeRef = useRef(null) // 语音开始时间
  const isSpeakingRef = useRef(false) // 当前语音状态的ref，用于回调中的实时状态跟踪
  
  // 音频暂停相关的 refs
  const audioPauseTimerRef = useRef(null) // 音频暂停延迟定时器
  const SPEECH_PAUSE_DELAY = 1500 // 连续说话1500ms后才暂停AI音频
  
  // 音频调度相关的 refs
  const audioSchedulerRef = useRef(null) // 音频调度定时器
  const currentAudioStartTimeRef = useRef(null) // 当前音频开始时间
  const currentAudioDurationRef = useRef(0) // 当前音频持续时间
  const nextAudioScheduledTimeRef = useRef(null) // 下一个音频预定播放时间
  const audioBufferCacheRef = useRef(new Map()) // 音频缓存
  const isPlayingRef = useRef(false) // 播放状态的ref，避免状态更新延迟
  
  // 音频缓存相关的 refs
  const audioCacheBufferRef = useRef([]) // 音频数据缓存区
  const cacheFlushTimerRef = useRef(null) // 缓存刷新定时器
  const lastCacheTimeRef = useRef(Date.now()) // 上次缓存时间
  
  // 防抖相关的 refs
  const speechStartDebounceRef = useRef(null) // 语音开始防抖定时器
  const speechEndDebounceRef = useRef(null) // 语音结束防抖定时器
  // const volumeHistoryRef = useRef([]) // 音量历史记录，用于更稳定的检测
  const consecutiveHighVolumeRef = useRef(0) // 连续高音量计数
  const consecutiveLowVolumeRef = useRef(0) // 连续低音量计数
  const chatStore = useChatStore()
  const { selectedCharacter } = chatStore

  // 合并多个音频数据块（base64格式）
  const mergeAudioDataChunks = (audioDataChunks) => {
    if (audioDataChunks.length === 0) return ''
    if (audioDataChunks.length === 1) return audioDataChunks[0]
    
    try {
      // 将所有base64音频数据解码为二进制数据
      const binaryChunks = audioDataChunks.map(base64Data => {
        const byteCharacters = atob(base64Data)
        const byteArray = new Uint8Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteArray[i] = byteCharacters.charCodeAt(i)
        }
        return byteArray
      })
      
      // 计算合并后的总长度
      const totalLength = binaryChunks.reduce((sum, chunk) => sum + chunk.length, 0)
      
      // 创建合并后的数组
      const mergedArray = new Uint8Array(totalLength)
      let offset = 0
      
      // 合并所有音频数据
      binaryChunks.forEach(chunk => {
        mergedArray.set(chunk, offset)
        offset += chunk.length
      })
      
      // 将合并后的二进制数据转换回base64
      let binaryString = ''
      for (let i = 0; i < mergedArray.length; i++) {
        binaryString += String.fromCharCode(mergedArray[i])
      }
      
      const mergedBase64 = btoa(binaryString)
      return mergedBase64
      
    } catch (error) {
      // 如果合并失败，返回第一个音频数据
      return audioDataChunks[0]
    }
  }

  // 合并多个 WAV 数据块
  const mergeWAVChunks = (wavChunks) => {
    if (wavChunks.length === 0) return new ArrayBuffer(0)
    if (wavChunks.length === 1) return wavChunks[0]
    
    // 提取所有音频数据（跳过44字节的WAV头）
    const audioDataArrays = []
    let totalAudioLength = 0
    
    wavChunks.forEach(chunk => {
      const audioData = chunk.slice(44) // 跳过WAV头
      audioDataArrays.push(new Uint8Array(audioData))
      totalAudioLength += audioData.byteLength
    })
    
    // 创建新的WAV文件
    const totalLength = 44 + totalAudioLength
    const mergedBuffer = new ArrayBuffer(totalLength)
    const view = new DataView(mergedBuffer)
    
    // 写入WAV头（使用第一个块的参数）
    const firstChunk = new DataView(wavChunks[0])
    const sampleRate = firstChunk.getUint32(24, true)
    const channels = firstChunk.getUint16(22, true)
    
    // WAV文件头
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }
    
    writeString(0, 'RIFF')
    view.setUint32(4, 36 + totalAudioLength, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, channels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * channels * 2, true)
    view.setUint16(32, channels * 2, true)
    view.setUint16(34, 16, true)
    writeString(36, 'data')
    view.setUint32(40, totalAudioLength, true)
    
    // 合并音频数据
    const mergedAudioData = new Uint8Array(mergedBuffer, 44)
    let offset = 0
    
    audioDataArrays.forEach(audioData => {
      mergedAudioData.set(audioData, offset)
      offset += audioData.length
    })
    
    return mergedBuffer
  }

  // 初始化AudioWorklet录音器
  useEffect(() => {
    const initAudioRecorder = async () => {
      try {
        audioRecorderRef.current = new AudioWorkletRecorder({
          sampleRate: 44100,
          channels: 1,
          bufferSize: 4096,
          enableAnalysis: true,
          onError: (error) => {
          },
          onVolumeChange: (vol) => {
            // 更新音量数据
            lastVolumeRef.current = vol
            
            setAudioData(pre => ({
              ...pre,
              volume: vol
            }))

            // 语音检测配置
            const VOLUME_THRESHOLD = 0.02 // 音量阈值
            const MAX_SILENCE_TIME = 1000 // 最大静音时间（毫秒），超过此时间强制结束
            
            const wasSpeaking = isSpeakingRef.current
            const isLoudEnough = vol > VOLUME_THRESHOLD
            
            // 更新连续计数
            if (isLoudEnough) {
              consecutiveHighVolumeRef.current++
              consecutiveLowVolumeRef.current = 0
            } else {
              consecutiveHighVolumeRef.current = 0
              consecutiveLowVolumeRef.current++
            }
            
            // 语音开始检测 - 立即响应，无防抖
            if (!wasSpeaking && isLoudEnough && consecutiveHighVolumeRef.current >= 1) { // 只需要1次检测
              isSpeakingRef.current = true
              lastSpeakingTimeRef.current = Date.now()
              speechStartTimeRef.current = Date.now()

                setAudioData(pre => ({
                  ...pre,
                  isSpeaking: true
                }))
              
              // 清除语音结束的防抖定时器（如果存在）
              if (speechEndDebounceRef.current) {
                clearTimeout(speechEndDebounceRef.current)
                speechEndDebounceRef.current = null
              }
              
              // 用户开始说话时，设置延迟暂停机制，避免误触发
              if (playbackState.isPlaying || isPlayingRef.current) {
                
                // 清除之前的暂停定时器（如果存在）
                if (audioPauseTimerRef.current) {
                  clearTimeout(audioPauseTimerRef.current)
                  audioPauseTimerRef.current = null
                }
                
                // 设置延迟暂停定时器
                audioPauseTimerRef.current = setTimeout(() => {
                  // 再次检查用户是否还在说话
                  if (isSpeakingRef.current) {
                    stopPlayback()
                    
                    // 清空播放队列
                    playbackQueueRef.current = []
                    
                    // 清空音频缓存队列
                    audioCacheBufferRef.current = []
                    
                    // 清除缓存刷新定时器
                    if (cacheFlushTimerRef.current) {
                      clearTimeout(cacheFlushTimerRef.current)
                      cacheFlushTimerRef.current = null
                    }
                    
                    // 更新状态
                    setPlaybackState(prev => ({
                      ...prev,
                      audioQueue: [],
                      isPlaying: false,
                      currentAudio: null
                    }))

                  } else {
                  }
                  
                  // 清除定时器引用
                  audioPauseTimerRef.current = null
                }, SPEECH_PAUSE_DELAY)
              }
            
              
              // resetSilenceTimer()
            }
            
            // 额外的安全机制：检查最大静音时间
            if (wasSpeaking && !isLoudEnough) {
              const currentTime = Date.now()
              const silenceDuration = currentTime - lastSpeakingTimeRef.current
              
              if (silenceDuration > MAX_SILENCE_TIME) {
                // 检查是否为噪音打断：如果说话时间太短，可能是噪音
                const speechDuration = currentTime - speechStartTimeRef.current
                const MIN_SPEECH_DURATION = 500 // 最小有效语音时长500ms
                
                if (speechDuration < MIN_SPEECH_DURATION) {
                  
                  // 重置状态但不发送录音
                  isSpeakingRef.current = false
                  setAudioData(pre => ({
                    ...pre,
                    isSpeaking: false
                  }))
                  
                  // 清空录音缓存（噪音数据）
                  recordingChunksRef.current = []
                } else {
                  isSpeakingRef.current = false
                  
                  // 清除防抖定时器
                  if (speechEndDebounceRef.current) {
                    clearTimeout(speechEndDebounceRef.current)
                    speechEndDebounceRef.current = null
                  }
                  
                  setAudioData(pre => ({
                    ...pre,
                    isSpeaking: false
                  }))
                  
                  // 发送录音到服务器（带质量检查）
                  sendRecordingToServer()
                }
                
                // 重置计数器
                consecutiveHighVolumeRef.current = 0
                consecutiveLowVolumeRef.current = 0
              }
            }
            
            // 更新最后说话时间
            if (isLoudEnough && wasSpeaking) {
              lastSpeakingTimeRef.current = Date.now()
            }
          },
          // 新增音频数据回调
          onFrequencyData: (data) => {
            // 确保传递正确的频域数据格式
            if (data && data.frequency) {
              setAudioData(pre => ({
                ...pre,
                frequencyData: data.frequency
              }))
            } else if (Array.isArray(data)) {
              setAudioData(pre => ({
                ...pre,
                frequencyData: data
              }))
            }
          },
          // 录音数据回调
          onDataAvailable: (audioData) => {
            // 将录音数据添加到缓存中
            recordingChunksRef.current.push(audioData)
            
            // 更新录音状态
            setAudioData(pre => ({
              ...pre,
              lastUpdate: Date.now()
            }))
            
            // 可选：实时显示录音数据大小（用于调试）
            if (Math.random() < 0.001) { // 0.1%的概率显示，避免过多日志
            }
          }
        })

        // 初始化录音器
        const initialized = await audioRecorderRef.current.initialize()
        if (initialized) {
        } else {
        }
      } catch (error) {
      }
    }

    initAudioRecorder()

    // 初始化WebSocket连接
    const initWebSocket = () => {
      try {
        streamingChatRef.current = new StreamingChat({
          wsUrl: `${wsURL}/ws/voice_chat`,
          onConnected: () => {
            setCallState(prev => {
              const newState = {
                ...prev,
                wsConnected: true,
                wsError: null,
                callType: prev.callType === CALL_STATES.CONNECTING ? CALL_STATES.CONNECTED : prev.callType
              }
              
              // 如果正在连接状态，则进入通话中状态
              if (prev.callType === CALL_STATES.CONNECTING) {
                message.destroy() // 清除loading消息
                message.success('通话已连接')
              }
              
              return newState
            })
          },
          onDisconnected: () => {
            setCallState(prev => ({
              ...prev,
              wsConnected: false
            }))
          },
          onError: (error) => {
            setCallState(prev => ({
              ...prev,
              wsConnected: false,
              wsError: error.message
            }))
            message.error('WebSocket连接错误: ' + error.message)
          },
          onStreamEnd: (message, data) => {
            // 处理语音通话相关的消息
            if (data.type === 'audio') {
              // 先添加到缓存区，而不是直接添加到播放队列
              addToAudioCache(data.data)
            }
          }
        })
      } catch (error) {
        setCallState(prev => ({
          ...prev,
          wsError: error.message
        }))
      }
    }

    initWebSocket()

    return () => {
      if (audioRecorderRef.current) {
        audioRecorderRef.current.cleanup()
      }
      if (streamingChatRef.current) {
        streamingChatRef.current.disconnect()
      }
      if (vadRef.current) {
        vadRef.current.destroy()
      }
      
      // 清理防抖定时器
      if (speechStartDebounceRef.current) {
        clearTimeout(speechStartDebounceRef.current)
        speechStartDebounceRef.current = null
      }
      if (speechEndDebounceRef.current) {
        clearTimeout(speechEndDebounceRef.current)
        speechEndDebounceRef.current = null
      }
      
      // 清理音频暂停定时器
      if (audioPauseTimerRef.current) {
        clearTimeout(audioPauseTimerRef.current)
        audioPauseTimerRef.current = null
      }
      
      // 清理音频调度定时器
      if (audioSchedulerRef.current) {
        clearTimeout(audioSchedulerRef.current)
        audioSchedulerRef.current = null
      }
      
      // 停止当前播放
      if (currentAudioRef.current) {
        try {
          currentAudioRef.current.stop()
        } catch (error) {
        }
        currentAudioRef.current = null
      }
    }
  }, [])

  // 通话时长计时器
  useEffect(() => {
    if (callState.callType === CALL_STATES.CONNECTED) {
      durationTimerRef.current = setInterval(() => {
        setCallState(prev => ({
          ...prev,
          duration: prev.duration + 1
        }))
      }, 1000)
    } else {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current)
        durationTimerRef.current = null
      }
    }

    return () => {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current)
      }
    }
  }, [callState.callType])

  // 初始化音频上下文
  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    return audioContextRef.current
  }

  // 重置静音计时器
  // const resetSilenceTimer = () => {
  //   if (silenceTimerRef.current) {
  //     clearTimeout(silenceTimerRef.current)
  //   }
    
  //   // 如果正在录音且未静音，设置3秒静音检测
  //   if (callState.isRecording && !callState.isMuted) {
  //     silenceTimerRef.current = setTimeout(() => {
  //       sendRecordingToServer()
  //     }, 3000) // 3秒静音后自动发送
  //   }
  // }

  // 录音质量检查函数
  const validateRecordingQuality = () => {
    // 检查录音数据是否存在
    if (recordingChunksRef.current.length === 0) {
      return false
    }
    
    // 检查录音时长
    const speechDuration = Date.now() - speechStartTimeRef.current
    const MIN_RECORDING_DURATION = 1400 // 最小录音时长300ms
    
    if (speechDuration < MIN_RECORDING_DURATION) {
      return false
    }
    
    // 检查录音数据大小
    const totalSize = recordingChunksRef.current.reduce((sum, chunk) => sum + chunk.byteLength, 0)
    const MIN_RECORDING_SIZE = 1024 // 最小录音大小1KB
    
    if (totalSize < MIN_RECORDING_SIZE) {
      return false
    }
    
    return true
  }

  // 发送录音到服务器
  const sendRecordingToServer = async () => {
    
    // 先进行录音质量检查
    if (!validateRecordingQuality()) {
      // 清空不合格的录音数据
      recordingChunksRef.current = []
      return
    }

    try {
      // 处理 ArrayBuffer 格式的 WAV 数据块
      let audioBlob
      
      if (recordingChunksRef.current.length === 1) {
        // 如果只有一个数据块，直接使用
        audioBlob = new Blob([recordingChunksRef.current[0]], { type: 'audio/wav' })
      } else {
        // 合并多个 WAV 数据块的音频数据部分
        const mergedWav = mergeWAVChunks(recordingChunksRef.current)
        audioBlob = new Blob([mergedWav], { type: 'audio/wav' })
        
      }
      
      // 上传到服务器
      const formData = new FormData()
      formData.append('file', audioBlob, 'recording.wav')
  
      const data = await processAndSendAudio(formData)
      
      if (data.url) {
        const audioUrl = `${VIOCEURL}${data.url}`;
        // 通过WebSocket发送
        const message = {
          role_id: selectedCharacter?.ID || 1,
          voice_url: audioUrl,
          format: 'wav',
          timestamp: Date.now()
        }
        
        if (streamingChatRef.current) {
          streamingChatRef.current.sendMessage(message)
        }
        
        // 清空录音缓存
        recordingChunksRef.current = []
      }
    } catch (error) {
      message.error('发送录音失败: ' + error.message)
    }
  }

  // 音频缓存处理 - 先缓存，达到一定长度后再加入队列
  const addToAudioCache = (audioData) => {
    // 添加到缓存区
    audioCacheBufferRef.current.push(audioData)
    lastCacheTimeRef.current = Date.now()
    
    
    // 检查是否需要刷新缓存到队列
    checkAndFlushCache()
  }
  
  // 检查并刷新缓存到播放队列 - 优化缓存逻辑
  const checkAndFlushCache = () => {
    const cacheLength = audioCacheBufferRef.current.length
    const timeSinceLastCache = Date.now() - lastCacheTimeRef.current
    
    // 优化缓存刷新条件：
    // 1. 缓存达到3个音频片段（降低阈值，提高响应速度）
    // 2. 或者距离上次缓存超过800ms（降低时间阈值，减少延迟）
    // 3. 或者存在下一个播放时间、缓存队列>0、播放队列为空（优化播放调度）
    const shouldFlush = 
      cacheLength >= 1 || 
      (cacheLength > 0 && timeSinceLastCache > 800) ||
      (nextAudioScheduledTimeRef.current && cacheLength > 0 && playbackQueueRef.current.length === 0)
    
    if (shouldFlush) {
      
      // 将缓存的音频数据批量添加到播放队列
      const cachedAudioData = audioCacheBufferRef.current.splice(0) // 清空缓存并获取所有数据
      
      if (cachedAudioData.length > 1) {
        // 合并多个音频片段为一个大音频文件
        const mergedAudioData = mergeAudioDataChunks(cachedAudioData)
        // 将合并后的音频作为单个文件添加到播放队列
        addToPlaybackQueue(mergedAudioData)
        
      }
      
      // 清除刷新定时器
      if (cacheFlushTimerRef.current) {
        clearTimeout(cacheFlushTimerRef.current)
        cacheFlushTimerRef.current = null
      }
    } else if (cacheLength > 0 && !cacheFlushTimerRef.current) {
      // 设置定时器，确保缓存不会等待太久
      cacheFlushTimerRef.current = setTimeout(() => {
        checkAndFlushCache()
      }, 500)
    }
  }

  // 添加到播放队列 - 优化性能，减少状态更新
  const addToPlaybackQueue = (audioData) => {
    playbackQueueRef.current.push(audioData)
    
    // 减少状态更新频率，只在必要时更新UI
    if (playbackQueueRef.current.length % 3 === 1) {
      setPlaybackState(prev => ({
        ...prev,
        audioQueue: [...playbackQueueRef.current]
      }))
    }
    
    
    // 使用ref状态检查，避免React状态更新延迟
    if (!isPlayingRef.current && !currentAudioRef.current) {
      
      // 极速启动策略，减少延迟
      if (playbackQueueRef.current.length >= 1) {
        // 立即启动，不等待
        startPlayback()
      }
    } else {
    }
  }

  // 开始播放 - 优化状态管理，减少延迟
  const startPlayback = async () => {
    if (playbackQueueRef.current.length === 0) return
    
    // 使用ref检查状态，避免React状态更新延迟
    if (isPlayingRef.current) {
      return
    }
    
    
    // 立即更新ref状态
    isPlayingRef.current = true
    setPlaybackState(prev => ({ ...prev, isPlaying: true }))
    
    try {
      const audioContext = initAudioContext()
      await playNextInQueue(audioContext)
    } catch (error) {
      isPlayingRef.current = false
      setPlaybackState(prev => ({ ...prev, isPlaying: false }))
    }
  }

  // 基于时间的精确音频调度播放
  const playNextInQueue = async (audioContext) => {
    // 检查是否还有音频要播放
    if (playbackQueueRef.current.length === 0) {
      
      // 立即更新ref状态
      isPlayingRef.current = false
      currentAudioRef.current = null
      currentAudioStartTimeRef.current = null
      currentAudioDurationRef.current = 0
      nextAudioScheduledTimeRef.current = null
      
      // 批量更新状态，减少渲染次数
      setPlaybackState(prev => ({ 
        ...prev, 
        isPlaying: false, 
        currentAudio: null,
        audioQueue: []
      }))
      
      // 清除调度定时器
      if (audioSchedulerRef.current) {
        clearTimeout(audioSchedulerRef.current)
        audioSchedulerRef.current = null
      }
      return
    }

    // 如果当前还有音频在播放，先停止它
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.stop()
      } catch (error) {
      }
      currentAudioRef.current = null
    }

    const audioData = playbackQueueRef.current.shift()
    
    // 减少状态更新，只在必要时更新UI
    if (playbackQueueRef.current.length % 2 === 0) {
      setPlaybackState(prev => ({
        ...prev,
        audioQueue: [...playbackQueueRef.current],
        currentAudio: audioData
      }))
    }


    try {
      // 检查缓存中是否已有解码的音频
      let audioBuffer = audioBufferCacheRef.current.get(audioData)
      
      if (!audioBuffer) {
        // 异步解码base64音频数据
        const byteCharacters = atob(audioData)
        const byteArray = new Uint8Array(byteCharacters.length)
        
        // 优化的字节转换
        for (let i = 0; i < byteCharacters.length; i++) {
          byteArray[i] = byteCharacters.charCodeAt(i)
        }
        
        // 异步解码音频
        audioBuffer = await audioContext.decodeAudioData(byteArray.buffer.slice())
        
        // 缓存解码结果
        audioBufferCacheRef.current.set(audioData, audioBuffer)
      } else {
      }
      
      // 创建音频源
      const source = audioContext.createBufferSource()
      source.buffer = audioBuffer
      
      // 调整播放速度 - 稍微快一点，不那么慢
      source.playbackRate.value = 0.9 // 90% 的正常速度，保持自然但不太慢
      
      source.connect(audioContext.destination)
      
      // 记录当前音频的时间信息
      const currentTime = Date.now()
      const actualAudioDuration = (audioBuffer.duration / source.playbackRate.value) * 1000 // 考虑播放速度的实际播放时长
      
      currentAudioStartTimeRef.current = currentTime
      currentAudioDurationRef.current = actualAudioDuration
      
      // 计算下一个音频的预定播放时间
      let delayTime = 300 // 基础延迟300ms
      
      // 根据音频长度动态调整延迟
      if (actualAudioDuration < 1000) {
        // 短音频：300-600ms 延迟
        delayTime = 300 + Math.random() * 300
      } else if (actualAudioDuration < 3000) {
        // 中等音频：400-800ms 延迟
        delayTime = 400 + Math.random() * 400
      } else {
        // 长音频：500-1000ms 延迟
        delayTime = 500 + Math.random() * 500
      }
      
      nextAudioScheduledTimeRef.current = currentTime + actualAudioDuration + delayTime
      
      
      // 设置精确的调度定时器
      const totalWaitTime = actualAudioDuration + delayTime
      audioSchedulerRef.current = setTimeout(() => {
        checkAndPlayNext(audioContext)
      }, totalWaitTime)
      
      // 播放结束回调 - 仅用于清理状态
      source.onended = () => {
        currentAudioRef.current = null
        
        // 不需要在这里处理下一个音频的播放
        // 因为调度器会在预定时间自动触发
      }
      
      // 设置当前播放的音频源
      currentAudioRef.current = source
      
      // 开始播放
      source.start()
      
    } catch (error) {
      currentAudioRef.current = null
      // 跳过当前音频，播放下一个
      setTimeout(() => {
        playNextInQueue(audioContext)
      }, 100)
    }
  }

  // 检查并播放下一个音频 - 简化版本，直接播放
  const checkAndPlayNext = (audioContext) => {
    // 清除调度定时器
    if (audioSchedulerRef.current) {
      clearTimeout(audioSchedulerRef.current)
      audioSchedulerRef.current = null
    }
    
    playNextInQueue(audioContext)
  }

  // 停止播放 - 优化清理逻辑
  const stopPlayback = () => {
    
    // 立即更新ref状态
    isPlayingRef.current = false
    
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.stop()
      } catch (error) {
      }
      currentAudioRef.current = null
    }
    
    // 清理调度定时器
    if (audioSchedulerRef.current) {
      clearTimeout(audioSchedulerRef.current)
      audioSchedulerRef.current = null
    }
    
    // 清理时间记录
    currentAudioStartTimeRef.current = null
    currentAudioDurationRef.current = 0
    nextAudioScheduledTimeRef.current = null
    
    // 清空播放队列
    playbackQueueRef.current = []
    
    // 清理音频缓存（可选，防止内存泄漏）
    audioBufferCacheRef.current.clear()
    
    // 批量更新状态
    setPlaybackState({
      isPlaying: false,
      audioQueue: [],
      currentAudio: null
    })
  }

  // 检查录音器状态
  const requestMicrophonePermission = async () => {
    if (!audioRecorderRef.current) {
      message.error('录音器未初始化')
      return false
    }

    if (!audioRecorderRef.current.isInitialized) {
      message.error('录音器未就绪')
      return false
    }

    return true
  }

  // 切换静音状态
  const toggleMute = async () => {
    setCallState(prev => {
      const newMutedState = !prev.isMuted
      
      // 静音逻辑：暂停/恢复录音
      if (audioRecorderRef.current) {
        if (newMutedState) {
          // 静音：暂停录音和VAD
          audioRecorderRef.current.stopRecording().then(() => {
            setCallState(prevState => ({ ...prevState, isRecording: false }))
            setAudioData(pre => ({
              ...pre,
              isSpeaking: false,
              volume: 0
            }))
          }).catch(error => {
          })
        } else {
          // 取消静音：恢复录音和VAD
          audioRecorderRef.current.startRecording().then(async () => {
            setCallState(prevState => ({ ...prevState, isRecording: true }))

          }).catch(error => {
          })
        }
      }
      
      return {
        ...prev,
        isMuted: newMutedState
      }
    })
  }

  // 发起通话
  const startCall = async (character) => {
    if (!character) {
      return
    }
    // 检查录音器状态
    const hasPermission = await requestMicrophonePermission()
    if (!hasPermission) return

   await setCallState(prev => ({
      ...prev,
      visible: true,
      character,
      callType: CALL_STATES.OUTGOING,
      duration: 0,
      isRecording: false,
      isMuted: false
    }))
    // 开始录音和VAD
    try {
      if (audioRecorderRef.current && audioRecorderRef.current.isInitialized) {
        // 清空录音缓存
        recordingChunksRef.current = []
        lastSpeakingTimeRef.current = Date.now()
        
        await audioRecorderRef.current.startRecording()
        setCallState(prev => ({ ...prev, isRecording: true }))
        
      }
    } catch (error) {
    }

    // 连接WebSocket
    try {
      await  setCallState(prev => ({
        ...prev,
        callType: CALL_STATES.CONNECTING
      }))
      
      if (streamingChatRef.current) {
        streamingChatRef.current.connect()
        message.loading('正在连接通话...', 0)
      } else {
        throw new Error('WebSocket未初始化')
      }
    } catch (error) {
      message.error('连接失败: ' + error.message)
      setCallState(prev => ({
        ...prev,
        callType: CALL_STATES.IDLE,
        visible: false
      }))
    }
  }

  // 挂断通话
  const hangupCall = async () => {
    // 停止录音
    if (audioRecorderRef.current && callState.isRecording) {
      try {
        await audioRecorderRef.current.stopRecording()
        setCallState(prev => ({ ...prev, isRecording: false }))
      } catch (error) {
      }
    }


    // 清理静音检测定时器
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }

    // 停止播放
    stopPlayback()

    // 断开WebSocket连接
    if (streamingChatRef.current) {
      streamingChatRef.current.disconnect()
    }

    // 清空录音缓存
    recordingChunksRef.current = []

    setCallState(prev => ({
      ...prev,
      callType: CALL_STATES.ENDING,
      wsConnected: false
    }))

    // 清除loading消息
    message.destroy()

    // 延迟关闭弹窗
    setTimeout(() => {
      setCallState(prev => ({
        ...prev,
        visible: false,
        callType: CALL_STATES.IDLE,
        duration: 0,
        isRecording: false,
        wsConnected: false,
        wsError: null
      }))
    }, 1000)

    message.info('通话已结束')
  }

  // 关闭通话窗口
  const closeCall = () => {
    if (callState.callType === CALL_STATES.CONNECTED) {
      hangupCall()
    } else {
      setCallState(prev => ({
        ...prev,
        visible: false,
        callType: CALL_STATES.IDLE
      }))
    }
  }

  const contextValue = {
    // 状态
    callState,
    audioData,
    playbackState,
    
    // 方法
    startCall,
    hangupCall,
    closeCall,
    toggleMute,
    
    // 工具方法
    sendRecordingToServer,
    addToPlaybackQueue,
    stopPlayback
  }

  return (
    <VoiceCallContext.Provider value={contextValue}>
      {children}
      <VoiceCallModal
        visible={callState.visible}
        onClose={closeCall}
        character={callState.character}
        onHangup={hangupCall}
        duration={callState.duration}
        callType={callState.callType}
        // 传递音频数据
        isSpeaking={audioData.isSpeaking}
        volume={audioData.volume}
        frequencyData={audioData.frequencyData}
        // 传递静音状态和控制函数
        isMuted={callState.isMuted}
        onToggleMute={toggleMute}
      />
    </VoiceCallContext.Provider>
  )
}

// 自定义 Hook 用于使用语音通话上下文
export const useVoiceCall = () => {
  const context = useContext(VoiceCallContext)
  if (!context) {
    throw new Error('useVoiceCall must be used within a VoiceCallProvider')
  }
  return context
}

// 导出上下文供高级用法
export { VoiceCallContext }

// 默认导出 Provider
export default VoiceCallProvider

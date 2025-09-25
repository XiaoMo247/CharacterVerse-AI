# 🎤 AudioWorklet 音频录音工具使用指南

## 📋 概述

本工具包提供了基于 AudioWorklet 的高性能音频录音解决方案，支持实时音频处理、音频效果、频谱分析等专业功能。

## 🎯 核心特性

### ⚡ 高性能
- **独立线程处理**: AudioWorklet 在独立线程中处理音频，不阻塞主线程
- **低延迟**: 音频处理延迟低至 10ms，远优于传统方案的 100ms+
- **实时处理**: 支持实时音频效果和分析

### 🎛️ 专业音频功能
- **音频增益控制**: 实时调整音频音量
- **噪声门限**: 自动过滤低于阈值的背景噪音
- **防削波处理**: 防止音频信号失真
- **频谱分析**: 实时获取音频频域和时域数据

### 🔧 易用性
- **三层 API**: 从简单到专业的渐进式 API 设计
- **自动资源管理**: 智能的资源分配和清理
- **错误处理**: 完善的错误处理和恢复机制

## 📦 工具包结构

```
web/src/utils/
├── audio-worklet.js           # 核心 AudioWorklet 录音器
├── audio-recorder.js          # 简化的录音工具
├── audio-worklet-examples.js  # 使用示例
└── README-AudioWorklet.md     # 本文档
```

## 🚀 快速开始

### 1. 最简单的录音

```javascript
import { QuickRecorder } from './utils/audio-recorder.js'

// 一行代码开始录音
const controller = await QuickRecorder.quickRecord(30) // 最长30秒

// 5秒后停止录音
setTimeout(async () => {
  const audioBlob = await controller.stop()
  console.log('录音完成!', audioBlob)
  
  // 播放录音
  const audio = new Audio(URL.createObjectURL(audioBlob))
  audio.play()
  
  controller.cleanup()
}, 5000)
```

### 2. 基础录音功能

```javascript
import { SimpleAudioRecorder } from './utils/audio-recorder.js'

const recorder = new SimpleAudioRecorder({
  maxDuration: 60,              // 最长60秒
  onVolumeChange: (volume) => {
    console.log(`音量: ${Math.round(volume * 100)}%`)
  },
  onStateChange: (state, data) => {
    console.log(`状态: ${state}`, data)
  }
})

// 初始化
await recorder.init()

// 开始录音
await recorder.startRecording()

// 暂停录音
recorder.pauseRecording()

// 恢复录音
recorder.resumeRecording()

// 停止录音
const audioBlob = await recorder.stopRecording()

// 清理资源
recorder.cleanup()
```

### 3. 专业录音功能

```javascript
import AudioWorkletRecorder from './utils/audio-worklet.js'

const recorder = new AudioWorkletRecorder({
  sampleRate: 44100,
  channels: 1,
  enableEffects: true,
  enableAnalysis: true,
  onVolumeChange: (volume) => {
    // 实时音量监控
    updateVolumeIndicator(volume)
  },
  onFrequencyData: (data) => {
    // 实时频谱分析
    updateFrequencyVisualization(data)
  }
})

// 初始化
await recorder.initialize()

// 设置音频效果
recorder.setGain(1.5)                    // 增益 1.5x
recorder.setNoiseGate(true, 0.02, 0.1)   // 噪声门限

// 开始录音
await recorder.startRecording()

// 停止录音
const audioBlob = await recorder.stopRecording()

// 清理资源
recorder.cleanup()
```

## 📚 详细 API 文档

### AudioWorkletRecorder (核心类)

#### 构造函数选项

```javascript
const options = {
  sampleRate: 44100,        // 采样率
  channels: 1,              // 声道数
  bufferSize: 4096,         // 缓冲区大小
  enableEffects: true,      // 启用音频效果
  enableAnalysis: true,     // 启用频谱分析
  onVolumeChange: null,     // 音量变化回调
  onFrequencyData: null,    // 频谱数据回调
  onError: null,            // 错误回调
  onStateChange: null       // 状态变化回调
}
```

#### 主要方法

| 方法 | 说明 | 返回值 |
|-----|------|--------|
| `initialize()` | 初始化录音器 | `Promise<boolean>` |
| `startRecording()` | 开始录音 | `Promise<void>` |
| `pauseRecording()` | 暂停录音 | `void` |
| `resumeRecording()` | 恢复录音 | `void` |
| `stopRecording()` | 停止录音 | `Promise<Blob>` |
| `setGain(gain)` | 设置音频增益 | `void` |
| `setNoiseGate(enabled, threshold, ratio)` | 设置噪声门限 | `void` |
| `switchAudioDevice(deviceId)` | 切换音频设备 | `Promise<boolean>` |
| `cleanup()` | 清理资源 | `void` |

#### 静态方法

| 方法 | 说明 | 返回值 |
|-----|------|--------|
| `getAudioDevices()` | 获取音频设备列表 | `Promise<MediaDeviceInfo[]>` |

### SimpleAudioRecorder (简化类)

#### 构造函数选项

```javascript
const options = {
  sampleRate: 44100,        // 采样率
  channels: 1,              // 声道数
  maxDuration: 300,         // 最大录音时长(秒)
  enableGain: true,         // 启用增益
  defaultGain: 1.2,         // 默认增益值
  enableNoiseGate: true,    // 启用噪声门限
  noiseThreshold: 0.01,     // 噪声阈值
  onVolumeChange: null,     // 音量变化回调
  onStateChange: null,      // 状态变化回调
  onError: null             // 错误回调
}
```

#### 主要方法

| 方法 | 说明 | 返回值 |
|-----|------|--------|
| `init()` | 初始化录音器 | `Promise<boolean>` |
| `startRecording()` | 开始录音 | `Promise<boolean>` |
| `pauseRecording()` | 暂停录音 | `boolean` |
| `resumeRecording()` | 恢复录音 | `boolean` |
| `stopRecording()` | 停止录音 | `Promise<Blob>` |
| `cancelRecording()` | 取消录音 | `boolean` |
| `setGain(gain)` | 设置增益 | `void` |
| `setNoiseGate(enabled, threshold)` | 设置噪声门限 | `void` |
| `getAudioDevices()` | 获取音频设备 | `Promise<MediaDeviceInfo[]>` |
| `switchDevice(deviceId)` | 切换设备 | `Promise<boolean>` |
| `cleanup()` | 清理资源 | `void` |

#### 属性

| 属性 | 说明 | 类型 |
|-----|------|------|
| `isRecording` | 是否正在录音 | `boolean` |
| `isPaused` | 是否已暂停 | `boolean` |
| `isReady` | 是否就绪 | `boolean` |
| `state` | 当前状态 | `string` |
| `volume` | 当前音量 | `number` |
| `duration` | 录音时长(秒) | `number` |
| `formattedDuration` | 格式化时长 | `string` |
| `remainingDuration` | 剩余时长 | `number` |

### QuickRecorder (快速录音)

#### 静态方法

```javascript
// 快速录音
const controller = await QuickRecorder.quickRecord(maxDuration)

// 控制器方法
controller.stop()           // 停止录音
controller.cancel()         // 取消录音
controller.pause()          // 暂停录音
controller.resume()         // 恢复录音
controller.cleanup()        // 清理资源

// 控制器属性
controller.duration         // 录音时长
controller.volume          // 当前音量
controller.state           // 录音状态
```

## 🎨 使用场景

### 1. 聊天应用语音消息

```javascript
import { SimpleAudioRecorder } from './utils/audio-recorder.js'

class VoiceChatRecorder {
  constructor() {
    this.recorder = new SimpleAudioRecorder({
      maxDuration: 60,
      onVolumeChange: this.updateVolumeUI.bind(this),
      onStateChange: this.updateRecordingUI.bind(this)
    })
  }
  
  async startVoiceMessage() {
    await this.recorder.init()
    await this.recorder.startRecording()
  }
  
  async sendVoiceMessage() {
    const audioBlob = await this.recorder.stopRecording()
    
    // 发送语音消息
    await this.sendToChat(audioBlob)
    
    this.recorder.cleanup()
  }
  
  updateVolumeUI(volume) {
    // 更新音量指示器
    document.querySelector('.volume-bar').style.width = `${volume * 100}%`
  }
  
  updateRecordingUI(state, data) {
    // 更新录音状态UI
    document.querySelector('.recording-status').textContent = state
    document.querySelector('.recording-duration').textContent = data.formattedDuration
  }
}
```

### 2. 音乐制作应用

```javascript
import AudioWorkletRecorder from './utils/audio-worklet.js'

class MusicRecorder {
  constructor() {
    this.recorder = new AudioWorkletRecorder({
      sampleRate: 48000,        // 高质量采样率
      channels: 2,              // 立体声
      enableEffects: true,
      enableAnalysis: true,
      onFrequencyData: this.updateSpectrum.bind(this)
    })
  }
  
  async setupRecording() {
    await this.recorder.initialize()
    
    // 设置专业音频效果
    this.recorder.setGain(1.0)                    // 无增益
    this.recorder.setNoiseGate(true, 0.005, 0.05) // 严格噪声控制
  }
  
  updateSpectrum(data) {
    // 更新频谱可视化
    this.drawFrequencySpectrum(data.frequency)
    this.drawWaveform(data.waveform)
  }
}
```

### 3. 语音识别应用

```javascript
import { SimpleAudioRecorder } from './utils/audio-recorder.js'

class SpeechRecognizer {
  constructor() {
    this.recorder = new SimpleAudioRecorder({
      maxDuration: 30,
      enableNoiseGate: true,
      noiseThreshold: 0.02,     // 较高的噪声阈值
      onVolumeChange: this.detectSpeech.bind(this)
    })
  }
  
  detectSpeech(volume) {
    // 基于音量检测语音活动
    if (volume > 0.1) {
      this.onSpeechStart()
    } else if (volume < 0.05) {
      this.onSpeechEnd()
    }
  }
  
  async startListening() {
    await this.recorder.init()
    await this.recorder.startRecording()
  }
  
  async processRecording() {
    const audioBlob = await this.recorder.stopRecording()
    
    // 发送到语音识别服务
    const transcript = await this.speechToText(audioBlob)
    return transcript
  }
}
```

## 🔧 高级配置

### 音频效果配置

```javascript
// 增益控制
recorder.setGain(1.5)  // 1.5倍增益

// 噪声门限
recorder.setNoiseGate(
  true,    // 启用
  0.02,    // 阈值 (0-1)
  0.1      // 衰减比例 (0-1)
)
```

### 设备管理

```javascript
// 获取音频设备
const devices = await AudioWorkletRecorder.getAudioDevices()
console.log('可用设备:', devices)

// 切换设备
const success = await recorder.switchAudioDevice(deviceId)
```

### 实时分析

```javascript
const recorder = new AudioWorkletRecorder({
  enableAnalysis: true,
  onFrequencyData: (data) => {
    // data.frequency: Uint8Array - 频域数据
    // data.waveform: Uint8Array - 时域数据
    
    // 分析低频、中频、高频
    const lowFreq = data.frequency.slice(0, 10)
    const midFreq = data.frequency.slice(10, 50)
    const highFreq = data.frequency.slice(50, 100)
  }
})
```

## 🐛 错误处理

### 常见错误和解决方案

```javascript
const recorder = new SimpleAudioRecorder({
  onError: (error) => {
    switch (error.name) {
      case 'NotAllowedError':
        console.error('麦克风权限被拒绝')
        // 引导用户授权
        break
        
      case 'NotFoundError':
        console.error('未找到音频设备')
        // 提示用户检查设备
        break
        
      case 'NotSupportedError':
        console.error('浏览器不支持 AudioWorklet')
        // 降级到传统方案
        break
        
      default:
        console.error('录音错误:', error)
    }
  }
})
```

### 浏览器兼容性检查

```javascript
function checkAudioWorkletSupport() {
  if (!window.AudioContext && !window.webkitAudioContext) {
    throw new Error('浏览器不支持 Web Audio API')
  }
  
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()
  
  if (!audioContext.audioWorklet) {
    throw new Error('浏览器不支持 AudioWorklet')
  }
  
  return true
}
```

## 📊 性能优化

### 1. 缓冲区大小优化

```javascript
// 低延迟场景 (实时通信)
const recorder = new AudioWorkletRecorder({
  bufferSize: 1024  // 更小的缓冲区
})

// 高质量场景 (音乐录制)
const recorder = new AudioWorkletRecorder({
  bufferSize: 8192  // 更大的缓冲区
})
```

### 2. 采样率选择

```javascript
// 语音录制
const voiceRecorder = new AudioWorkletRecorder({
  sampleRate: 16000  // 16kHz 足够语音质量
})

// 音乐录制
const musicRecorder = new AudioWorkletRecorder({
  sampleRate: 48000  // 48kHz 专业音质
})
```

### 3. 内存管理

```javascript
// 及时清理资源
recorder.cleanup()

// 避免内存泄漏
window.addEventListener('beforeunload', () => {
  recorder.cleanup()
})
```

## 🌐 浏览器兼容性

| 浏览器 | 版本要求 | AudioWorklet 支持 |
|--------|----------|------------------|
| Chrome | 66+ | ✅ |
| Firefox | 76+ | ✅ |
| Safari | 14.1+ | ✅ |
| Edge | 79+ | ✅ |

### 降级方案

```javascript
async function createRecorder() {
  try {
    // 尝试使用 AudioWorklet
    const recorder = new AudioWorkletRecorder()
    await recorder.initialize()
    return recorder
  } catch (error) {
    // 降级到传统 MediaRecorder
    console.warn('AudioWorklet 不支持，使用传统方案')
    return new MediaRecorderFallback()
  }
}
```

## 🎯 最佳实践

### 1. 资源管理

```javascript
class RecorderManager {
  constructor() {
    this.recorder = null
  }
  
  async init() {
    this.recorder = new SimpleAudioRecorder()
    await this.recorder.init()
  }
  
  async cleanup() {
    if (this.recorder) {
      this.recorder.cleanup()
      this.recorder = null
    }
  }
}

// 使用
const manager = new RecorderManager()
await manager.init()

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
  manager.cleanup()
})
```

### 2. 错误恢复

```javascript
class RobustRecorder {
  constructor() {
    this.recorder = null
    this.retryCount = 0
    this.maxRetries = 3
  }
  
  async startRecording() {
    try {
      await this.recorder.startRecording()
      this.retryCount = 0  // 重置重试计数
    } catch (error) {
      if (this.retryCount < this.maxRetries) {
        this.retryCount++
        console.log(`录音失败，重试 ${this.retryCount}/${this.maxRetries}`)
        
        // 重新初始化
        await this.recorder.cleanup()
        await this.recorder.init()
        
        // 递归重试
        return this.startRecording()
      } else {
        throw new Error('录音启动失败，已达到最大重试次数')
      }
    }
  }
}
```

### 3. 用户体验优化

```javascript
class UserFriendlyRecorder {
  constructor() {
    this.recorder = new SimpleAudioRecorder({
      onVolumeChange: this.updateVolumeUI.bind(this),
      onStateChange: this.updateStatusUI.bind(this),
      onError: this.handleUserError.bind(this)
    })
  }
  
  updateVolumeUI(volume) {
    // 平滑的音量动画
    const volumeBar = document.querySelector('.volume-bar')
    volumeBar.style.transform = `scaleX(${volume})`
    volumeBar.style.transition = 'transform 0.1s ease'
  }
  
  updateStatusUI(state, data) {
    // 友好的状态提示
    const statusText = {
      'ready': '准备录音',
      'recording': `录音中 ${data.formattedDuration}`,
      'paused': '录音已暂停',
      'stopped': '录音完成'
    }
    
    document.querySelector('.status').textContent = statusText[state]
  }
  
  handleUserError(error) {
    // 用户友好的错误提示
    const userMessage = {
      'NotAllowedError': '请允许使用麦克风权限',
      'NotFoundError': '未检测到麦克风设备',
      'NotSupportedError': '您的浏览器不支持录音功能'
    }
    
    const message = userMessage[error.name] || '录音出现问题，请重试'
    this.showUserMessage(message)
  }
}
```

## 🎉 总结

AudioWorklet 音频录音工具为您提供了：

- ⚡ **高性能**: 独立线程处理，低延迟
- 🎛️ **专业功能**: 音频效果、频谱分析
- 🔧 **易于使用**: 三层 API，渐进式复杂度
- 🛡️ **稳定可靠**: 完善的错误处理和资源管理
- 🌐 **广泛兼容**: 支持现代浏览器

无论是简单的语音消息录制，还是专业的音频制作，这个工具包都能满足您的需求！

开始使用吧：

```javascript
import { QuickRecorder } from './utils/audio-recorder.js'

// 一行代码开始录音！
const controller = await QuickRecorder.quickRecord(30)
```

🎤 让您的 Web 应用拥有专业级的音频录音能力！
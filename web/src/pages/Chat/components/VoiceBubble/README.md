# VoiceBubble 语音冒泡组件

类似 QQ/微信 的语音消息气泡组件，支持播放录音内容，具有精美的 UI 设计和流畅的交互体验。

## 功能特性

- 🎵 **音频播放**：支持 Blob 和 URL 两种音频源
- 🎨 **精美样式**：类似 QQ/微信 的气泡设计
- 📊 **波形动画**：播放时显示动态波形效果
- ⏱️ **进度显示**：实时显示播放进度和时长
- 🎯 **消息区分**：自动区分自己和他人的消息样式
- 🌙 **主题适配**：支持亮色/暗色主题切换
- 📱 **响应式**：移动端友好的响应式设计
- ⚡ **高性能**：优化的音频处理和动画性能

## 基础用法

```jsx
import VoiceBubble from './components/VoiceBubble'

// 使用录音 Blob
<VoiceBubble
  audioBlob={audioBlob}
  duration={15}
  isOwn={true}
  onPlayStart={() => console.log('开始播放')}
  onPlayEnd={() => console.log('播放结束')}
/>

// 使用音频 URL
<VoiceBubble
  audioUrl="https://example.com/audio.mp3"
  duration={20}
  isOwn={false}
/>
```

## 完整示例

```jsx
import React, { useState } from 'react'
import VoiceBubble from './components/VoiceBubble'
import AudioWorkletVoiceRecorder from './components/Audio/AudioWorkletVoiceRecorder'

const ChatMessage = () => {
  const [audioBlob, setAudioBlob] = useState(null)
  const [duration, setDuration] = useState(0)
  const [showRecorder, setShowRecorder] = useState(false)

  const handleRecordingComplete = (blob, dur) => {
    setAudioBlob(blob)
    setDuration(dur)
  }

  return (
    <div>
      {/* 录音按钮 */}
      <button onClick={() => setShowRecorder(true)}>
        开始录音
      </button>

      {/* 语音消息 */}
      {audioBlob && (
        <VoiceBubble
          audioBlob={audioBlob}
          duration={duration}
          isOwn={true}
          onPlayStart={() => console.log('播放开始')}
          onPlayEnd={() => console.log('播放结束')}
          onPlayError={(err) => console.error('播放错误:', err)}
        />
      )}

      {/* 录音组件 */}
      <AudioWorkletVoiceRecorder
        visible={showRecorder}
        start={showRecorder}
        onClose={() => setShowRecorder(false)}
        onRecordingComplete={handleRecordingComplete}
      />
    </div>
  )
}
```

## API 参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `audioBlob` | `Blob` | `null` | 音频 Blob 数据 |
| `audioUrl` | `string` | `null` | 音频 URL 地址 |
| `duration` | `number` | `0` | 录音时长（秒） |
| `isOwn` | `boolean` | `false` | 是否为自己发送的消息 |
| `className` | `string` | `''` | 自定义 CSS 类名 |
| `style` | `object` | `{}` | 自定义样式 |
| `onPlayStart` | `function` | `() => {}` | 播放开始回调 |
| `onPlayEnd` | `function` | `() => {}` | 播放结束回调 |
| `onPlayError` | `function` | `() => {}` | 播放错误回调 |
| `showWaveform` | `boolean` | `true` | 是否显示波形动画 |
| `maxWidth` | `number` | `200` | 最大宽度（px） |
| `minWidth` | `number` | `80` | 最小宽度（px） |

## 样式定制

### 自定义颜色

```css
/* 自己发送的消息 */
.voice-bubble.own {
  background: linear-gradient(135deg, #your-color 0%, #your-color-light 100%);
}

/* 他人发送的消息 */
.voice-bubble.other {
  background: linear-gradient(135deg, #your-color 0%, #your-color-light 100%);
}
```

### 自定义尺寸

```css
.voice-bubble {
  padding: 16px 20px; /* 调整内边距 */
  border-radius: 20px; /* 调整圆角 */
}
```

### 暗色主题

组件已内置暗色主题支持，当页面根元素有 `data-theme="dark"` 属性时自动切换：

```html
<html data-theme="dark">
  <!-- 组件会自动应用暗色主题样式 -->
</html>
```

## 事件处理

```jsx
<VoiceBubble
  audioBlob={audioBlob}
  duration={duration}
  onPlayStart={() => {
    // 播放开始时的处理
    console.log('音频开始播放')
    // 可以在这里暂停其他正在播放的音频
  }}
  onPlayEnd={() => {
    // 播放结束时的处理
    console.log('音频播放完成')
    // 可以在这里更新播放状态
  }}
  onPlayError={(error) => {
    // 播放错误时的处理
    console.error('音频播放失败:', error)
    // 可以在这里显示错误提示
  }}
/>
```

## 与录音组件集成

```jsx
import VoiceBubble from './components/VoiceBubble'
import AudioWorkletVoiceRecorder from './components/Audio/AudioWorkletVoiceRecorder'

const VoiceChat = () => {
  const [messages, setMessages] = useState([])
  const [showRecorder, setShowRecorder] = useState(false)

  const handleRecordingComplete = (audioBlob, duration) => {
    const newMessage = {
      id: Date.now(),
      type: 'voice',
      audioBlob,
      duration,
      isOwn: true,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])
  }

  return (
    <div className="voice-chat">
      {/* 消息列表 */}
      <div className="messages">
        {messages.map(message => (
          <VoiceBubble
            key={message.id}
            audioBlob={message.audioBlob}
            duration={message.duration}
            isOwn={message.isOwn}
          />
        ))}
      </div>

      {/* 录音按钮 */}
      <button onClick={() => setShowRecorder(true)}>
        发送语音
      </button>

      {/* 录音组件 */}
      <AudioWorkletVoiceRecorder
        visible={showRecorder}
        start={showRecorder}
        onClose={() => setShowRecorder(false)}
        onRecordingComplete={handleRecordingComplete}
      />
    </div>
  )
}
```

## 注意事项

1. **音频格式**：组件支持浏览器原生支持的所有音频格式
2. **性能优化**：大量语音消息时建议使用虚拟滚动
3. **移动端**：在移动端使用时，确保用户手势触发播放（浏览器限制）
4. **内存管理**：使用 Blob 时会自动管理 URL 的创建和释放
5. **错误处理**：建议监听 `onPlayError` 事件处理播放失败的情况

## 演示页面

运行项目后访问演示页面查看完整功能：

```jsx
import VoiceBubbleDemo from './components/VoiceBubble/VoiceBubbleDemo'

// 在路由中使用
<Route path="/voice-demo" component={VoiceBubbleDemo} />
```

## 浏览器兼容性

- Chrome 66+
- Firefox 60+
- Safari 11.1+
- Edge 79+

支持所有现代浏览器，包括移动端浏览器。
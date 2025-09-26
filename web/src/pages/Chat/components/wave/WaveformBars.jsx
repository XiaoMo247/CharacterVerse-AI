import React, { useState, useEffect, useRef, useCallback } from 'react'
import './WaveformBars.css'

/**
 * 波形条形图组件
 * 复用 AudioWorkletWaveform 的条形图渲染逻辑
 * 专注于波形条的显示，从中间向两边跳动
 */
const WaveformBars = ({ 
  isActive = false,
  barCount = 20,
  maxHeight = 40,
  color = '#1890ff',
  className = '',
  style = {},
  // 外部传入的音频数据
  volume = 0,
  frequencyData = null,
  // 回调函数（可选）
  onVolumeChange = null
}) => {
  const [waveformData, setWaveformData] = useState(new Array(barCount).fill(0))
  const [currentVolume, setCurrentVolume] = useState(0)
  
  const animationRef = useRef(null)

  // 从外部频域数据更新波形 - 确保从中间向两边分布
  const updateWaveformFromFrequency = useCallback((frequencyArray) => {
    if (!frequencyArray || frequencyArray.length === 0) return

    const newWaveformData = new Array(barCount).fill(0)
    const centerIndex = Math.floor(barCount / 2)
    
    // 使用频域数据的低频部分（更有表现力）
    const usefulFreqData = frequencyArray.slice(0, Math.min(frequencyArray.length, 64))
    
    // 计算整体音量强度
    const totalEnergy = usefulFreqData.reduce((sum, val) => sum + val, 0) / usefulFreqData.length
    const normalizedEnergy = Math.min(totalEnergy / 128, 1) // 归一化到0-1
    
    // 生成从中间向两边的波形数据
    for (let i = 0; i < barCount; i++) {
      const distanceFromCenter = Math.abs(i - centerIndex)
      const maxDistance = Math.floor(barCount / 2)
      
      // 基础振幅：中间最强，向两边衰减
      let baseAmplitude = normalizedEnergy * (1 - (distanceFromCenter / maxDistance) * 0.6)
      
      // 根据频域数据添加细节变化
      if (usefulFreqData.length > 0) {
        // 使用不同频段的数据为不同位置的条形图提供变化
        const freqIndex = Math.floor((distanceFromCenter / maxDistance) * (usefulFreqData.length - 1))
        const freqValue = usefulFreqData[freqIndex] || 0
        const freqFactor = (freqValue / 255) * 0.5 + 0.5 // 0.5-1.0的范围
        
        baseAmplitude *= freqFactor
      }
      
      // 中心条形图增强效果
      if (distanceFromCenter <= 1) {
        baseAmplitude *= 1.3
      }
      
      // 添加轻微的随机变化，但保持主要由音频数据驱动
      const randomFactor = 0.9 + Math.random() * 0.2
      baseAmplitude *= randomFactor
      
      // 确保最小值
      newWaveformData[i] = Math.max(baseAmplitude, 0.02)
    }
    
    setWaveformData(newWaveformData)
  }, [barCount])

  // 监听外部传入的频域数据
  useEffect(() => {
    if (frequencyData && Array.isArray(frequencyData)) {
      updateWaveformFromFrequency(frequencyData)
    }
  }, [frequencyData, updateWaveformFromFrequency])

  // 监听外部传入的音量数据
  useEffect(() => {
    if (typeof volume === 'number') {
      setCurrentVolume(volume)
      if (onVolumeChange) onVolumeChange(volume)
    }
  }, [volume, onVolumeChange])

  // 生成模拟波形数据（当没有真实音频时）
  const generateSimulatedWaveform = useCallback(() => {
    if (!isActive) {
      setWaveformData(new Array(barCount).fill(0))
      return
    }

    const simulatedData = new Array(barCount).fill(0).map((_, index) => {
      // 从中间向两边的衰减效果
      const centerIndex = Math.floor(barCount / 2)
      const distanceFromCenter = Math.abs(index - centerIndex)
      const maxDistance = Math.floor(barCount / 2)
      
      // 基础振幅（中间最高，向两边递减）
      const baseAmplitude = 1 - (distanceFromCenter / maxDistance) * 0.5
      
      // 添加随机波动
      const randomFactor = 0.4 + Math.random() * 0.6
      
      // 时间相关的波动，从中间向两边传播
      const time = Date.now() * 0.008
      const wavePhase = time - distanceFromCenter * 0.3
      const timeFactor = Math.sin(wavePhase) * 0.4 + 0.6
      
      // 中间条形图更活跃
      const centerBoost = distanceFromCenter <= 1 ? 1.3 : 1.0
      
      return Math.max(baseAmplitude * randomFactor * timeFactor * centerBoost, 0.05)
    })
    
    setWaveformData(simulatedData)
  }, [isActive, barCount])

  // 开始模拟模式
  const startSimulatedMode = useCallback(() => {
    const simulate = () => {
      generateSimulatedWaveform()
      if (isActive) {
        animationRef.current = requestAnimationFrame(simulate)
      }
    }
    simulate()
  }, [generateSimulatedWaveform, isActive])

  // 停止模拟模式
  const stopSimulatedMode = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    setWaveformData(new Array(barCount).fill(0))
    setCurrentVolume(0)
  }, [barCount])

  // 处理激活状态变化
  useEffect(() => {
    if (isActive) {
      // 如果没有外部数据，使用模拟模式
      if (!frequencyData) {
        startSimulatedMode()
      }
    } else {
      stopSimulatedMode()
    }
  }, [isActive, frequencyData, startSimulatedMode, stopSimulatedMode])

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  // 渲染波形条 - 从中间向两边排列，每个条形图上下跳动
  const renderWaveformBars = () => {
    const centerIndex = Math.floor(barCount / 2)
    
    return waveformData.map((amplitude, index) => {
      // 计算从中间向两边的位置
      const distanceFromCenter = Math.abs(index - centerIndex)
      
      // 计算条形图的高度（上下跳动）
      const barHeight = Math.max(amplitude * maxHeight, 2)
      
      // 动画延迟（中间先动，向两边传播）- 使用秒为单位
      const animationDelay = distanceFromCenter * 0.05 // 50ms = 0.05s
      
      // 中心条形图标识
      const isCenter = distanceFromCenter <= 1
      
      return (
        <div
          key={index}
          className={`waveform-bar ${isActive ? 'active' : ''} ${isCenter ? 'center-bar' : ''}`}
          style={{
            height: `${barHeight}px`,
            animationDelay: `${animationDelay}s`,
            // '--bar-color': color,
            '--bar-index': index,
            '--center-index': centerIndex,
            '--distance-from-center': distanceFromCenter,
            '--amplitude': amplitude,
            '--animation-delay': `${animationDelay}s`
          }}
          data-distance={distanceFromCenter}
          data-is-center={isCenter}
        />
      )
    })
  }

  return (
    <div 
      className={`waveform-bars ${className} ${isActive ? 'active' : ''}`}
      style={{
        // '--waveform-color': color,
        '--max-height': `${maxHeight}px`,
        '--bar-count': barCount,
        ...style
      }}
    >
      {/* 波形容器 */}
      <div className="waveform-container">
        {renderWaveformBars()}
      </div>
    
    </div>
  )
}

export default WaveformBars
import React, { useState, useEffect, useCallback } from 'react'
import { Avatar } from 'antd'
import { 
  imageDataCache, 
  cacheImageAsBase64, 
  addCacheListener, 
  getCacheStatus 
} from '../../utils/avatarCache'

const LazyAvatar = ({ 
  src, 
  size = 40, 
  children = '🤖', 
  style = {}, 
  ...props 
}) => {
  const [cachedImageData, setCachedImageData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  // 处理缓存更新的回调
  const handleCacheUpdate = useCallback((data, err) => {
    if (err) {
      setError(true)
      setLoading(false)
    } else if (data) {
      setCachedImageData(data)
      setLoading(false)
      setError(false)
    }
  }, [])

  useEffect(() => {
    if (!src || !src.startsWith('http')) {
      setCachedImageData(null)
      setLoading(false)
      setError(false)
      return
    }

    // 获取当前缓存状态
    const { cached, loading: isLoading } = getCacheStatus(src)
    
    if (cached) {
      // 如果已缓存，直接使用缓存数据
      setCachedImageData(imageDataCache.get(src))
      setLoading(false)
      setError(false)
      return
    }

    if (isLoading) {
      // 如果正在加载，设置加载状态并添加监听器
      setLoading(true)
      setError(false)
      
      // 添加监听器等待加载完成
      const removeListener = addCacheListener(src, handleCacheUpdate)
      
      return () => {
        removeListener()
      }
    }

    // 开始新的加载请求
    setLoading(true)
    setError(false)
    
    // 添加监听器
    const removeListener = addCacheListener(src, handleCacheUpdate)
    
    // 发起缓存请求
    cacheImageAsBase64(src).catch((err) => {
      console.error('图片加载失败:', err)
      // 错误处理已在 handleCacheUpdate 中处理
    })

    return () => {
      removeListener()
    }
  }, [src, handleCacheUpdate])


  // 如果没有 src 或加载失败，显示默认头像
  if (!src || !src.startsWith('http') || error) {
    return (
      <Avatar 
        size={size} 
        style={{ fontSize: size > 40 ? '1.5rem' : '1rem', ...style }} 
        {...props}
      >
        {children}
      </Avatar>
    )
  }

  // 如果正在加载，显示占位符
  if (loading) {
    return (
      <Avatar 
        size={size} 
        style={{ 
          fontSize: size > 40 ? '1.5rem' : '1rem', 
          backgroundColor: '#f5f5f5',
          color: '#999',
          ...style 
        }} 
        {...props}
      >
        {children}
      </Avatar>
    )
  }

  // 显示缓存的图片数据
  return (
    <Avatar 
      size={size} 
      src={cachedImageData}
      style={style}
      {...props}
    >
      {children}
    </Avatar>
  )
}

export default LazyAvatar
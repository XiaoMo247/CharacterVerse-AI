// 图片数据缓存
export const imageDataCache = new Map()

// 正在进行的请求缓存 - 防止重复请求
const pendingRequests = new Map()

// 监听器管理 - 用于通知所有等待的组件
const listeners = new Map()

// 添加监听器
export const addCacheListener = (url, callback) => {
  if (!listeners.has(url)) {
    listeners.set(url, new Set())
  }
  listeners.get(url).add(callback)
  
  // 返回取消监听的函数
  return () => {
    const urlListeners = listeners.get(url)
    if (urlListeners) {
      urlListeners.delete(callback)
      if (urlListeners.size === 0) {
        listeners.delete(url)
      }
    }
  }
}

// 通知所有监听器
const notifyListeners = (url, data, error = null) => {
  const urlListeners = listeners.get(url)
  if (urlListeners) {
    urlListeners.forEach(callback => {
      try {
        callback(data, error)
      } catch (err) {
        console.error('监听器回调错误:', err)
      }
    })
  }
}

// 将图片转换为 base64 并缓存（带请求去重）
export const cacheImageAsBase64 = async (url) => {
  if (!url || !url.startsWith('http')) {
    return null
  }

  // 如果已经缓存，直接返回
  if (imageDataCache.has(url)) {
    return imageDataCache.get(url)
  }

  // 如果正在请求中，返回现有的 Promise
  if (pendingRequests.has(url)) {
    return pendingRequests.get(url)
  }

  // 创建新的请求 Promise
  const requestPromise = (async () => {
    try {
      // 使用 fetch 获取图片数据
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const blob = await response.blob()
      
      // 转换为 base64
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })

      // 缓存结果
      imageDataCache.set(url, base64Data)
      
      // 通知所有等待的监听器
      notifyListeners(url, base64Data)
      
      return base64Data
    } catch (error) {
      console.error('缓存图片失败:', error)
      
      // 通知监听器发生错误
      notifyListeners(url, null, error)
      
      throw error
    } finally {
      // 清理正在进行的请求
      pendingRequests.delete(url)
    }
  })()

  // 缓存请求 Promise
  pendingRequests.set(url, requestPromise)
  
  return requestPromise
}

// 预加载头像并缓存为 base64
export const preloadAvatar = async (url) => {
  if (!url || !url.startsWith('http')) {
    return Promise.resolve()
  }

  try {
    await cacheImageAsBase64(url)
  } catch (error) {
    console.error('预加载头像失败:', error)
    throw error
  }
}

// 检查是否正在加载
export const isLoading = (url) => {
  return pendingRequests.has(url)
}

// 获取缓存状态
export const getCacheStatus = (url) => {
  if (!url || !url.startsWith('http')) {
    return { cached: false, loading: false }
  }
  
  return {
    cached: imageDataCache.has(url),
    loading: pendingRequests.has(url)
  }
}
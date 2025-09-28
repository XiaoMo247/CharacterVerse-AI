import { create } from 'zustand'

// 默认主题配置
const defaultTheme = {
  mode: 'light',
  colors: {
    primary: '#1890ff',
    success: '#52c41a',
    warning: '#faad14',
    error: '#ff4d4f',
    info: '#1890ff'
  }
}

// 主题状态管理
const useThemeStore = create((set, get) => ({
  // 当前主题模式
  theme: 'light',
  
  // 自定义颜色配置
  customColors: {
    primary: '#1890ff',
    success: '#52c41a',
    warning: '#faad14',
    error: '#ff4d4f',
    info: '#1890ff'
  },
  
  // 预设主题颜色
  presetColors: [
    { name: '默认蓝', primary: '#1890ff' },
    { name: '科技紫', primary: '#722ed1' },
    { name: '活力橙', primary: '#fa8c16' },
    { name: '自然绿', primary: '#52c41a' },
    { name: '热情红', primary: '#f5222d' },
    { name: '优雅粉', primary: '#eb2f96' },
    { name: '深海蓝', primary: '#13c2c2' },
    { name: '金色', primary: '#faad14' }
  ],

  // 切换主题模式（亮色/暗色）
  toggleTheme: () => {
    const newTheme = get().theme === 'light' ? 'dark' : 'light'
    set({ theme: newTheme })
    
    // 更新DOM属性
    document.documentElement.setAttribute('data-theme', newTheme)
    
    // 更新CSS变量
    get().updateCSSVariables()
  },

  // 设置主题模式
  setTheme: (theme) => {
    set({ theme })
    document.documentElement.setAttribute('data-theme', theme)
    get().updateCSSVariables()
  },

  // 设置自定义颜色
  setCustomColor: (colorType, color) => {
    const newColors = {
      ...get().customColors,
      [colorType]: color
    }
    set({ customColors: newColors })
    get().updateCSSVariables()
  },

  // 批量设置自定义颜色
  setCustomColors: (colors) => {
    set({ customColors: { ...get().customColors, ...colors } })
    get().updateCSSVariables()
  },

  // 应用预设主题
  applyPresetTheme: (primaryColor) => {
    const newColors = {
      ...get().customColors,
      primary: primaryColor,
      info: primaryColor
    }
    set({ customColors: newColors })
    get().updateCSSVariables()
  },

  // 重置为默认主题
  resetToDefault: () => {
    set({
      theme: defaultTheme.mode,
      customColors: { ...defaultTheme.colors }
    })
    document.documentElement.setAttribute('data-theme', defaultTheme.mode)
    get().updateCSSVariables()
  },

  // 更新CSS变量
  updateCSSVariables: () => {
    const { customColors } = get()
    const root = document.documentElement

    // 更新主色调相关变量
    root.style.setProperty('--primary-color', customColors.primary)
    root.style.setProperty('--primary-hover', get().lightenColor(customColors.primary, 20))
    root.style.setProperty('--primary-active', get().darkenColor(customColors.primary, 20))
    root.style.setProperty('--primary-light', get().lightenColor(customColors.primary, 90))

    // 更新成功色相关变量
    root.style.setProperty('--success-color', customColors.success)
    root.style.setProperty('--success-hover', get().lightenColor(customColors.success, 20))
    root.style.setProperty('--success-active', get().darkenColor(customColors.success, 20))
    root.style.setProperty('--success-light', get().lightenColor(customColors.success, 90))

    // 更新警告色相关变量
    root.style.setProperty('--warning-color', customColors.warning)
    root.style.setProperty('--warning-hover', get().lightenColor(customColors.warning, 20))
    root.style.setProperty('--warning-active', get().darkenColor(customColors.warning, 20))
    root.style.setProperty('--warning-light', get().lightenColor(customColors.warning, 90))

    // 更新错误色相关变量
    root.style.setProperty('--error-color', customColors.error)
    root.style.setProperty('--error-hover', get().lightenColor(customColors.error, 20))
    root.style.setProperty('--error-active', get().darkenColor(customColors.error, 20))
    root.style.setProperty('--error-light', get().lightenColor(customColors.error, 90))

    // 更新信息色相关变量
    root.style.setProperty('--info-color', customColors.info)
    root.style.setProperty('--info-hover', get().lightenColor(customColors.info, 20))
    root.style.setProperty('--info-active', get().darkenColor(customColors.info, 20))
    root.style.setProperty('--info-light', get().lightenColor(customColors.info, 90))
    get().saveThemeToLocal()
  },

  // 颜色工具函数 - 变亮
  lightenColor: (color, percent) => {
    const num = parseInt(color.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = (num >> 16) + amt
    const G = (num >> 8 & 0x00FF) + amt
    const B = (num & 0x0000FF) + amt
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1)
  },

  // 颜色工具函数 - 变暗
  darkenColor: (color, percent) => {
    const num = parseInt(color.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = (num >> 16) - amt
    const G = (num >> 8 & 0x00FF) - amt
    const B = (num & 0x0000FF) - amt
    return '#' + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
      (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
      (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1)
  },

  // 保存主题到本地存储
  saveThemeToLocal: () => {
    const { theme, customColors } = get()
    const themeData = {
      theme,
      customColors,
      timestamp: Date.now()
    }
    localStorage.setItem('app-theme-settings', JSON.stringify(themeData))
  },

  // 从本地存储加载主题
  loadThemeFromLocal: () => {
    try {
      const saved = localStorage.getItem('app-theme-settings')
      if (saved) {
        const themeData = JSON.parse(saved)
        set({
          theme: themeData.theme || 'light',
          customColors: themeData.customColors || defaultTheme.colors
        })
        document.documentElement.setAttribute('data-theme', themeData.theme || 'light')
        get().updateCSSVariables()
        return true
      }
    } catch (error) {
      console.error('加载主题设置失败:', error)
    }
    return false
  },

  // 导出主题配置
  exportTheme: () => {
    const { theme, customColors } = get()
    return {
      theme,
      customColors,
      exportTime: new Date().toISOString()
    }
  },

  // 导入主题配置
  importTheme: (themeConfig) => {
    try {
      if (themeConfig.theme && themeConfig.customColors) {
        set({
          theme: themeConfig.theme,
          customColors: themeConfig.customColors
        })
        document.documentElement.setAttribute('data-theme', themeConfig.theme)
        get().updateCSSVariables()
        return true
      }
    } catch (error) {
      console.error('导入主题配置失败:', error)
    }
    return false
  },

  // 初始化主题
  initTheme: () => {
    // 尝试从本地存储加载
    if (!get().loadThemeFromLocal()) {
      // 如果没有保存的设置，检查系统偏好
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const initialTheme = prefersDark ? 'dark' : 'light'
      get().setTheme(initialTheme)
    }
    
    // 监听系统主题变化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      // 只有在用户没有手动设置主题时才自动跟随系统
      const hasCustomSetting = localStorage.getItem('app-theme-settings')
      if (!hasCustomSetting) {
        get().setTheme(e.matches ? 'dark' : 'light')
      }
    })
  }
}))

export default useThemeStore
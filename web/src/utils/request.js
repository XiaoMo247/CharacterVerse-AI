import axios from 'axios'

// 创建 axios 实例
const request = axios.create({
  baseURL:  'http://localhost:8080/api',
  timeout: 10000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 在发送请求之前做些什么
    
    // 添加 token
    const stored = localStorage?.getItem('auth')
    if(stored){
        const { token } = JSON.parse(stored)
        if (token) {
        config.headers.Authorization = `Bearer ${token}`
        }
    }
    
    // 添加请求时间戳，防止缓存
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      }
    }
    
    console.log('请求发送:', config)
    return config
  },
  error => {
    // 对请求错误做些什么
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    // 对响应数据做点什么
    const { data, status } = response
    
    // 根据后端约定的状态码处理
    if (status === 200) {
      // 成功响应
      if (data.code === 200 || data.success) {
        return data
      } else {
        // 业务错误
        const errorMsg = data.message || data.msg || '请求失败'
        console.error('业务错误:', errorMsg)
        
        // 可以在这里添加全局错误提示
        // Message.error(errorMsg)
        
        return Promise.reject(new Error(errorMsg))
      }
    }
    
    return response
  },
  error => {
    // 对响应错误做点什么
    console.error('响应错误:', error)
    
    let errorMessage = '网络错误'
    
    if (error.response) {
      // 服务器响应了错误状态码
      const { status, data } = error.response
      
      switch (status) {
        case 400:
          errorMessage = data.message || '请求参数错误'
          break
        case 401:
          errorMessage = '未授权，请重新登录'
          // 清除本地存储的用户信息
          localStorage.removeItem('token')
          sessionStorage.removeItem('token')
          // 可以在这里跳转到登录页
        //   router.push('/login')
          break
        case 403:
          errorMessage = '拒绝访问'
          break
        case 404:
          errorMessage = '请求的资源不存在'
          break
        case 500:
          errorMessage = '服务器内部错误'
          break
        case 502:
          errorMessage = '网关错误'
          break
        case 503:
          errorMessage = '服务不可用'
          break
        case 504:
          errorMessage = '网关超时'
          break
        default:
          errorMessage = data.message || `连接错误${status}`
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      errorMessage = '网络连接超时'
    } else {
      // 其他错误
      errorMessage = error.message || '请求失败'
    }
    
    // 可以在这里添加全局错误提示
    // Message.error(errorMessage)
    
    return Promise.reject(new Error(errorMessage))
  }
)

// 取消请求的工具函数
export const createCancelToken = () => {
  return axios.CancelToken.source()
}

// 判断是否为取消请求的错误
export const isCancel = (error) => {
  return axios.isCancel(error)
}

// 导出 axios 实例和封装的方法
export default request 
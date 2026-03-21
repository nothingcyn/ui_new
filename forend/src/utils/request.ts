import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { message } from 'antd'

const rawBaseURL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) || ''
const baseURL = rawBaseURL.endsWith('/') ? rawBaseURL.slice(0, -1) : rawBaseURL

const request: AxiosInstance = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 从localStorage获取token，避免循环依赖
    const token = localStorage.getItem('access_token')

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // 添加设备指纹（如果存在）
    const fingerprint = localStorage.getItem('fingerprint')
    if (fingerprint && config.headers) {
      config.headers['X-Fingerprint-ID'] = fingerprint
    }

    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // 从localStorage获取refresh token
        const refreshTokenValue = localStorage.getItem('refresh_token')

        if (refreshTokenValue) {
          // 直接调用API刷新token，避免循环依赖
          const response = await axios.post(
            `${baseURL}/api/v1/auth/refresh`,
            {}, // body可以是空
            {
              headers: {
                Authorization: `Bearer ${refreshTokenValue}`,
              },
            }
          )

          // 更新localStorage中的token
          localStorage.setItem('access_token', response.data.access_token)
          localStorage.setItem('refresh_token', response.data.refresh_token)

          // 重新发送原始请求
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`
          }

          return request(originalRequest)
        } else {
          // 没有refresh token，直接跳转到登录页
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
        }
      } catch (refreshError) {
        // 刷新token失败，清除token并跳转到登录页
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    // 处理其他错误
    let errorMessage = '请求失败'

    if (error.response) {
      // 服务器返回错误
      const data = error.response.data as any
      errorMessage = data?.message || data?.detail || errorMessage
    } else if (error.request) {
      // 请求已发送但没有收到响应
      errorMessage = '网络错误，请检查网络连接'
    } else {
      // 请求配置错误
      errorMessage = error.message || errorMessage
    }

    message.error(errorMessage)
    return Promise.reject(error)
  }
)

export default request

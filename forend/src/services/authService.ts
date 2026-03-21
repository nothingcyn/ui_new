import request from '@/utils/request'
import { AuthResponse, LoginRequest, RegisterRequest, SendSmsParams } from '@/types'
import { withErrorHandling } from '@/utils/errorHandler'

export const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
  return withErrorHandling(
    () => request.post('/api/v1/auth/login', credentials),
    '登录失败'
  )
}

export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  return withErrorHandling(
    () => request.post('/api/v1/auth/register', data),
    '注册失败'
  )
}

export const backendLogout = async (): Promise<void> => {
  return withErrorHandling(
    () => request.post('/api/v1/auth/logout'),
    '登出失败'
  )
}

export const refreshToken = async (refreshToken: string): Promise<AuthResponse> => {
  return withErrorHandling(
    () => request.post('/api/v1/auth/refresh', { refresh_token: refreshToken }),
    '刷新令牌失败'
  )
}

export const getCaptcha = async (): Promise<{ captcha_id: string; image: string }> => {
  return withErrorHandling(
    () => request.get('/api/v1/captcha'),
    '获取验证码失败'
  )
}

export const resetPassword = async (data: {
  phone: string
  sms_code: string
  new_password: string
  confirm_password: string
}): Promise<void> => {
  return withErrorHandling(
    () => request.post('/api/v1/auth/reset-password', data),
    '重置密码失败'
  )
}

// 定义发送短信的参数（与 types/index.ts 中的 SendSmsParams 保持一致）
export type { SendSmsParams } from '@/types'

export const sendSmsCode = (data: SendSmsParams) => {
  return request.post('/api/v1/sms/send', data)
}

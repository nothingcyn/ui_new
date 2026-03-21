import request from '@/utils/request'
import { User_info, User, ChangeMessageResponse } from '@/types'
import { withErrorHandling } from '@/utils/errorHandler'

export const getCurrentUser = async (): Promise<User_info> => {
  return withErrorHandling(
    () => request.get<any, User_info>('/api/v1/users/me'),
    '获取用户信息失败'
  )
}

export const updateProfile = async (data: { nickname: string }): Promise<User> => {
  return withErrorHandling(
    () => request.put('/api/v1/users/me', data),
    '更新用户资料失败'
  )
}

export const changePassword = async (data: {
  current_password: string
  new_password: string
}): Promise<ChangeMessageResponse> => {
  return withErrorHandling(
    () => request.post('/api/v1/users/change-password', data),
    '修改密码失败'
  )
}

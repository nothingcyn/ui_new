/**
 * 服务层通用错误处理包装器
 * 用于统一处理 API 调用的 try-catch 错误处理逻辑
 */

type AsyncFunction<T = any> = () => Promise<T>

/**
 * 包装异步函数，添加统一的错误处理和日志
 * @param fn 要执行的异步函数
 * @param errorMessage 错误提示信息
 * @returns 包装后的异步函数
 */
export const withErrorHandling = async <T>(
  fn: AsyncFunction<T>,
  errorMessage: string
): Promise<T> => {
  try {
    return await fn()
  } catch (error) {
    console.error(`${errorMessage}:`, error)
    throw error
  }
}

/**
 * 创建带预设错误消息的错误处理包装器
 * @param errorMessage 错误提示信息
 * @returns 包装函数
 */
export const createErrorHandler = (errorMessage: string) => {
  return <T>(fn: AsyncFunction<T>): Promise<T> => withErrorHandling(fn, errorMessage)
}

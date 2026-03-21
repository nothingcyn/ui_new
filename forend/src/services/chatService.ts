import request from '@/utils/request'
import { Conversation, Message, SendStreamMessageParams, SendMessageRequest } from '@/types'
import { withErrorHandling } from '@/utils/errorHandler'

export const getConversations = async (): Promise<Conversation[]> => {
  return withErrorHandling(
    () => request.get('/api/v1/conversations'),
    '获取对话列表失败'
  )
}

export const createConversation = async (user_talk: string): Promise<Conversation> => {
  return withErrorHandling(
    () => request.post('/api/v1/conversations', { user_talk }),
    '创建对话失败'
  )
}

export const deleteConversation = async (conversationId: number): Promise<void> => {
  return withErrorHandling(
    () => request.delete(`/api/v1/conversations/${conversationId}`),
    '删除对话失败'
  )
}

export const getMessages = async (conversationId: string): Promise<Message[]> => {
  return withErrorHandling(
    () => request.get(`/api/v1/conversations/${conversationId}/messages`),
    '获取消息失败'
  )
}

export const sendMessage = async (payload: SendMessageRequest): Promise<Message[]> => {
  return withErrorHandling(
    () => request.post(`/api/v1/conversations/${payload.conversation_id}/messages`, payload),
    '发送消息失败'
  )
}

export const sendStreamMessage = async (
  params: SendStreamMessageParams
): Promise<any> => {
  try {
    let lastText = "" // 用于做 diff
    let hasExtractedSessionId = false // ⭐ 新增：标记是否已经提取过 Header 里的 ID
    
    // 构建请求数据，确保字段名与后端 SendMessageRequest 模型一致
    const requestData = {
      content: params.content,
      conversationId: params.conversationId,
      current_session_id: params.current_session_id || "",
      current_model_name: params.current_model_name || ""
    }
    
    console.log('发送流式消息请求数据:', requestData)
    
    return await request.post(
      `/api/v1/conversations/${params.conversationId}/messages`,
      requestData,
      {
        responseType: 'text',
         timeout: 0,
        onDownloadProgress: (progressEvent: any) => {
          const xhr = progressEvent.event.target
          if (!xhr) return
          // =========================================================
          // ⭐ 核心逻辑：在流刚刚开始时，立刻从 XHR 对象中抽取响应头
          // =========================================================
          if (!hasExtractedSessionId && params.onSessionId) {
            // XMLHttpRequest 提供了 getResponseHeader 方法读取特定的头
            // (加一个小写兜底，以防部分浏览器自动转小写)
            const backendSessionId = xhr.getResponseHeader('X-Session-Id') || xhr.getResponseHeader('x-session-id');
            
            if (backendSessionId) {
              console.log('🚀 底层成功拦截到后端传来的 Session ID:', backendSessionId);
              params.onSessionId(backendSessionId); // 传给外层 React 组件
              hasExtractedSessionId = true; // 标记已提取，后面的流数据不用再读了
            }
          }
          // =========================================================
          if (!xhr.response) return
          const currentText = xhr.response
          
          // 全量更新
          params.onMessage(currentText)
          
          // 增量更新（更丝滑）
          const newChunk = currentText.slice(lastText.length)
          if (newChunk && params.onChunk) {
            params.onChunk(newChunk)
          }
          lastText = currentText
        }
      }
    ).then((res) => {
      params.onFinish && params.onFinish()
      return res
    })
  } catch (error) {
    console.error('发送流式消息失败:', error)
    params.onError && params.onError(error)
    throw error
  }
}
export const getModels = async (): Promise<any[]> => {
  return withErrorHandling(
    () => request.get('/api/v1/models'),
    '获取模型列表失败'
  )
}

import request from '@/utils/request'
import { Conversation, Message, SendStreamMessageParams } from '@/types'
import { withErrorHandling } from '@/utils/errorHandler'
import axios, { AxiosRequestConfig } from 'axios';
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

// 替换你的 sendStreamMessage 函数
export const streamRequest = async (
  url: string,
  data: any,
  onChunk: (chunk: string) => void,
  onComplete?: () => void,
  onError?: (error: any) => void,
  signal?: AbortSignal
) => {
  try {
    // 直接从 localStorage 获取 token（与 request.ts 拦截器保持一致）
    const token = localStorage.getItem('access_token');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(data),
      signal: signal
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('无法获取响应流');
    }

    let accumulatedText = "";
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        onComplete?.();
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      accumulatedText += chunk;
      onChunk(accumulatedText);
    }

    return accumulatedText;
    
  } catch (error: any) {
    // 处理中止异常
    if (error.name === 'AbortError') {
      console.log('流式请求已被用户中止');
      return;
    }
    console.error('流式请求失败:', error);
    onError?.(error);
    throw error;
  }
};

// 修改你的 sendStreamMessage 函数
export const sendStreamMessage = async (
  params: SendStreamMessageParams
): Promise<any> => {
  let hasExtractedSessionId = false;
  let fullContent = "";

  const requestData = {
    content: params.content,
    conversationId: params.conversationId,
    current_session_id: params.current_session_id || "",
    current_model_name: params.current_model_name || ""
  };

  console.log('发送流式消息请求数据:', requestData);

  // 先发送一个 HEAD 请求获取 Session ID（如果需要）
  // 或者在流式响应中获取
    
  return streamRequest(
    `/api/v1/conversations/${params.conversationId}/messages`,
    requestData,
    (accumulatedText) => {
      fullContent = accumulatedText;
      
      // 更新消息
      if (params.onMessage) {
        params.onMessage(accumulatedText);
      }
      
      // 计算增量块
      if (params.onChunk && accumulatedText !== fullContent) {
        // 这里需要维护上一次的内容，可以添加闭包变量
      }
    },
    () => {
      console.log('流式响应完成');
      params.onFinish?.();
    },
    (error) => {
      console.error('流式请求错误:', error);
      params.onError?.(error);
    },
    params.signal
  );
};
export const getModels = async (): Promise<any[]> => {
  return withErrorHandling(
    () => request.get('/api/v1/models'),
    '获取模型列表失败'
  )
}

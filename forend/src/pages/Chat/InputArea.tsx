import React from 'react'
import { Input, Button, message } from 'antd'
import { SendOutlined } from '@ant-design/icons'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { sendMessage } from '@/store/slices/chatSlice'

const { TextArea } = Input
const InputArea: React.FC = () => {
  const dispatch = useAppDispatch()
  const [input, setInput] = React.useState('')
  const { currentConversation, loading } = useAppSelector((state) => state.chat)

  const handleSend = async () => {
    if (!input.trim()) {
      message.warning('请输入消息内容')
      return
    }

    if (!currentConversation) {
      message.warning('请先选择或创建一个对话')
      return
    }

    try {
      await dispatch(sendMessage({
        conversation_id: currentConversation.session_id,
        content: input,
        current_model_name: currentConversation.messages[0]?.current_model_name || '',
        current_session_id: currentConversation.messages[0]?.current_session_id || '',
         onMessage: (accumulatedText: string) => {
          // 直接覆盖当前气泡的文本
          updateAiTextInState(sessionId, aiMessageId, accumulatedText);
        },
        onError: (error: unknown) => {
          console.error(error); 
          updateAiTextInState(sessionId, aiMessageId, "\n\n[网络请求出错]");
        }
      })).unwrap()
      setInput('')
    } catch (error: any) {
      message.error(error.message || '发送消息失败')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <TextArea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="输入消息，按Enter发送，Shift+Enter换行"
        autoSize={{ minRows: 1, maxRows: 6 }}
        disabled={loading}
      />
      <Button
        type="primary"
        icon={<SendOutlined />}
        onClick={handleSend}
        loading={loading}
        disabled={!input.trim()}
      >
        发送
      </Button>
    </div>
  )
}

export default InputArea

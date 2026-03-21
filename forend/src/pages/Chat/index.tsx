import React, { useEffect } from 'react'
import { Layout, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '@/store/hooks'
import { fetchConversations } from '@/store/slices/chatSlice'
import ConversationList from './ConversationList'
import MessageList from './MessageList'
import InputArea from './InputArea'

const { Sider, Content } = Layout

const Chat: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  // 组件挂载时获取对话列表
  useEffect(() => {
    dispatch(fetchConversations())
  }, [dispatch])

  const handleLogout = () => {
    message.success('已退出登录')
    navigate('/login')
  }

  return (
    <Layout style={{ height: 'calc(100vh - 64px)' }}>
      <Sider width={280} style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}>
        <ConversationList />
      </Sider>
      <Layout>
        <Content style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>化工新材料大模型</h3>
            <button onClick={handleLogout}>退出登录</button>
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            <MessageList />
          </div>
          <div style={{ padding: '16px', borderTop: '1px solid #f0f0f0' }}>
            <InputArea />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

export default Chat

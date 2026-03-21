import React from 'react'
import { List, Empty, Avatar, Spin } from 'antd'
import { UserOutlined, RobotOutlined } from '@ant-design/icons'
import ReactMarkdown from 'react-markdown'
import { useAppSelector } from '@/store/hooks'

const MessageList: React.FC = () => {
  const { messages, currentConversation, loading } = useAppSelector((state) => state.chat)

  if (!currentConversation) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Empty description="请选择或创建一个对话" />
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  return (
    <div style={{ padding: '24px' }}>
      {messages.length === 0 ? (
        <Empty description="开始新的对话吧" />
      ) : (
        <List
          dataSource={messages}
          renderItem={(message) => (
            <List.Item style={{ border: 'none', padding: '12px 0' }}>
              <List.Item.Meta
                avatar={
                  <Avatar
                    icon={message.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                    style={{
                      backgroundColor: message.role === 'user' ? '#1890ff' : '#52c41a',
                    }}
                  />
                }
                title={message.role === 'user' ? '你' : 'AI助手'}
                description={
                  <div style={{ marginTop: 8 }}>
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
    </div>
  )
}

export default MessageList

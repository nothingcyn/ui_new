import React from 'react'
import { List, Button, Empty } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { createConversation, deleteConversation, setCurrentConversation, fetchMessages } from '@/store/slices/chatSlice'

const ConversationList: React.FC = () => {
  const dispatch = useAppDispatch()
  const { conversations, currentConversation } = useAppSelector((state) => state.chat)
  
  const handleCreateConversation = () => {
    dispatch(createConversation("11")) // 默认使用第一个模型
  }

  const handleDeleteConversation = (id: number) => {
    dispatch(deleteConversation(id))
  }

  const handleSelectConversation = (conversation: any) => {
    dispatch(setCurrentConversation(conversation))
    // 选择对话时获取该对话的消息列表
    dispatch(fetchMessages(conversation.id))
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
        <Button type="primary" icon={<PlusOutlined />} block onClick={handleCreateConversation}>
          新建对话
        </Button>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {conversations.length === 0 ? (
          <Empty description="暂无对话" style={{ marginTop: 40 }} />
        ) : (
          <List
            dataSource={conversations}
            renderItem={(conversation) => (
              <List.Item
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  background: currentConversation?.id === conversation.id ? '#e6f7ff' : 'transparent',
                }}
                onClick={() => handleSelectConversation(conversation)}
                actions={[
                  <Button
                    type="text"
                    icon={<DeleteOutlined />}
                    danger
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteConversation(conversation.id)
                    }}
                  />,
                ]}
              >
                <List.Item.Meta
                  title={conversation.title}
                  description={new Date(conversation.updated_at).toLocaleString()}
                />
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  )
}

export default ConversationList

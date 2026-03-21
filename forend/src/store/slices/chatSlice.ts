import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { Conversation, Message,SendMessageRequest } from '../../types'
import * as chatService from '../../services/chatService'

interface ChatState {
  conversations: Conversation[]
  currentConversation: Conversation | null
  messages: Message[]
  loading: boolean
  error: string | null
}

const initialState: ChatState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  loading: false,
  error: null,
}


export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async () => {
    const response = await chatService.getConversations()
    return response
  }
)

export const createConversation = createAsyncThunk(
  'chat/createConversation',
  async (modelId: string) => {
    const response = await chatService.createConversation(modelId)
    return response
  }
)

export const deleteConversation = createAsyncThunk(
  'chat/deleteConversation',
  async (conversationId: number) => {
    await chatService.deleteConversation(conversationId)
    return conversationId
  }
)

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (conversationId: string) => {
    const response = await chatService.getMessages(conversationId)
    return { conversationId, messages: response }
  }
)

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ( data: SendMessageRequest) => {
    const response = await chatService.sendMessage(data)
    return response
  }
)

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setCurrentConversation: (state, action: PayloadAction<Conversation | null>) => {
      state.currentConversation = action.payload
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload)
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Conversations
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchConversations.fulfilled, (state, action: PayloadAction<Conversation[]>) => {
        state.loading = false
        state.conversations = action.payload
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || '获取对话列表失败'
      })
      // Create Conversation
      .addCase(createConversation.fulfilled, (state, action: PayloadAction<Conversation>) => {
        state.conversations.unshift(action.payload)
        state.currentConversation = action.payload
      })
      // Delete Conversation
      .addCase(deleteConversation.fulfilled, (state, action: PayloadAction<number>) => {
        state.conversations = state.conversations.filter(c => c.id !== action.payload)
        if (state.currentConversation?.id === action.payload) {
          state.currentConversation = null
          state.messages = []
        }
      })
      // Fetch Messages
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.messages = action.payload.messages
      })
      // Send Message
      .addCase(sendMessage.pending, (state) => {
        state.loading = true
      })
      .addCase(sendMessage.fulfilled, (state, action: PayloadAction<Message[]>) => {
        state.loading = false
        state.messages = action.payload
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || '发送消息失败'
      })
  },
})

export const { setCurrentConversation, addMessage, clearError } = chatSlice.actions
export default chatSlice.reducer

import { useState, useEffect, useRef } from 'react'
import { Message } from '@/types'

/**
 * 聊天会话管理 Hook
 */
export const useChatSession = (sessions: any[], activeSessionId: string | null) => {
  const activeSession = sessions.find(s => s.session_id === activeSessionId)
  const messages = activeSession?.messages || []
  
  return { activeSession, messages }
}

/**
 * 自动滚动到底部 Hook
 */
export const useAutoScroll = (messages: Message[]) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  return messagesEndRef
}

/**
 * 用户菜单状态管理 Hook
 */
export const useUserMenu = () => {
  const [showUserMenu, setShowUserMenu] = useState(false)
  
  const handleMouseEnter = () => setShowUserMenu(true)
  const handleMouseLeave = () => setShowUserMenu(false)
  
  return {
    showUserMenu,
    handleMouseEnter,
    handleMouseLeave
  }
}

/**
 * 输入框管理 Hook
 */
export const useInputArea = (onSend: () => void) => {
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }
  
  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement
    target.style.height = '36px'
    target.style.height = Math.min(target.scrollHeight, 128) + 'px'
  }
  
  const clearInput = () => setInputValue('')
  
  return {
    inputValue,
    setInputValue,
    inputRef,
    handleKeyDown,
    handleInput,
    clearInput
  }
}

/**
 * 复制到剪贴板工具函数
 */
export const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
  const tempElement = document.createElement('div')
  tempElement.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50'
  tempElement.textContent = '已复制到剪贴板'
  document.body.appendChild(tempElement)
  setTimeout(() => tempElement.remove(), 2000)
}

import React, { useState, useEffect, useRef } from 'react';
// 注意：如果你的路径或实际导入有偏差，请自行调整
import { getModels, getConversations, createConversation, deleteConversation, sendStreamMessage } from '@/services/chatService';
import { getCurrentUser } from '@/services/userService';
import { backendLogout } from '@/services/authService';
import type { Model, SubModel } from '@/types/model';
import {ChatSession,Message} from '@/types/index';
import { useNavigate } from 'react-router-dom';
// ================= 1. 定义所需的数据类型 =================




export default function Chat() {
  // ---------------- 全局加载状态 ----------------
  const [isAppLoading, setIsAppLoading] = useState<boolean>(true);
  
  // 所有的历史聊天列表 (添加 <ChatSession[]> 泛型)
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const navigate = useNavigate();
  // 当前正在查看的聊天 ID (添加 <string | null> 泛型)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  // 界面状态 (布尔值会自动推导，无需写泛型)
  const [showSidebar, setShowSidebar] = useState(true);
  const [showInitialPrompt, setShowInitialPrompt] = useState(true);
  const [isNewChatMode, setIsNewChatMode] = useState(true);
  
  // ---------------- 体系选择相关状态 ----------------
  const [systemOptions, setSystemOptions] = useState<Model[]>([]); 
  const [showSystemModal, setShowSystemModal] = useState(false); 
  const [selectedSystem, setSelectedSystem] = useState<Model | null>(null);
  const [selectedSubModel, setSelectedSubModel] = useState<SubModel | null>(null);
  
  // ---------------- 输入与交互状态 ----------------
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [nickname, setNickname] = useState('');
  const [userInfo, setUserInfo] = useState({ phone: '' });
  const [showUserMenu, setShowUserMenu] = useState(false);

  // ---------------- DOM Refs (添加对应 HTML 元素的泛型) ----------------
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ================= 核心修改：开局读取数据库 =================
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsAppLoading(true);
        
        // 并发请求
        const [modelsRes, sessionsRes, userRes] = await Promise.all([
          getModels(),
          getConversations(),
          getCurrentUser()
        ]);
      const fetchedModels: Model[] = (modelsRes as any)?.data || modelsRes || []; 
      const fetchedSessions: ChatSession[] = (sessionsRes as any) || [];

      // 用户信息同理
        const finalNickname = userRes?.nickname || (userRes as any)?.data?.nickname || '默认用户';
        setNickname(finalNickname);
        const userPhone = userRes?.phone || (userRes as any)?.data?.phone || '';
        setUserInfo({ phone: userPhone }); 
        
        // 1. 设置模型数据并赋初值
        if (fetchedModels && fetchedModels.length > 0) {
          setSystemOptions(fetchedModels);
          setSelectedSystem(fetchedModels[0]);
          // TS 安全获取 sub_models
          setSelectedSubModel(fetchedModels[0].sub_models?.[0] || null);
        }
        
        // 2. 设置历史会话并判断开局界面
        if (fetchedSessions && fetchedSessions.length > 0) {
          setSessions(fetchedSessions);
          setActiveSessionId(fetchedSessions[0].session_id);
          setIsNewChatMode(false);
          setShowInitialPrompt(false);
        } else {
          setSessions([]);
          setIsNewChatMode(true);
          setShowInitialPrompt(true);
        }
      } catch (error) {
        console.error("初始化数据加载失败:", error);
        alert("网络异常，无法加载聊天数据，请刷新重试");
      } finally {
        setIsAppLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // 获取当前选中的会话数据
  const activeSession = sessions.find(s => s.session_id === activeSessionId);
  const messages = activeSession?.messages || [];

  // 每次消息变化自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 【功能 1】：新建聊天
  const handleNewChat = () => {
    if (isStreaming) {
      alert("请等待当前 AI 回复完毕后再开启新对话");
      return;
    }
    setIsNewChatMode(true);
    setShowInitialPrompt(true);
  };



  // 【功能 4】：删除历史对话 (参数加上 string 类型)
  const handleDeleteSession = async (sessionId: string) => {
    if (isStreaming) {
      alert("请等待当前 AI 回复完毕后再删除对话");
      return;
    }
    if (window.confirm('确定要删除这个对话吗？')) {
      try {
        // 找到对应的会话对象
        const sessionToDelete = sessions.find(s => s.session_id === sessionId);
        if (sessionToDelete) {
          // 调用后端删除接口
          await deleteConversation(Number(sessionToDelete.session_id || sessionId));
        }
        
        setSessions(prev => {
          const updatedSessions = prev.filter(session => session.session_id !== sessionId);
          if (sessionId === activeSessionId && updatedSessions.length > 0) {
            setActiveSessionId(updatedSessions[0].session_id);
          } else if (updatedSessions.length === 0) {
            handleNewChat(); // 删完了自动进入新聊天模式
          }
          return updatedSessions;
        });
      } catch (error) {
        console.error("删除对话失败:", error);
        alert("删除对话失败，请重试");
      }
    }
  };

  // 【功能 2】：切换聊天 (参数加上 string 类型)
  const handleSwitchSession = (id: string) => {
    if (isStreaming) {
      alert("请等待当前 AI 回复完毕后再切换对话");
      return;
    }
    setActiveSessionId(id);
    setIsNewChatMode(false);
    setShowInitialPrompt(false);
  };

  // 【功能 3】：处理发送消息
  const handleSend = async () => {
    if (!inputValue.trim() || isStreaming) return;
    
    // TS 保护：确保模型已经加载
    const currentSystem = selectedSystem || systemOptions[0];
    if (!currentSystem || !selectedSubModel) return; 
    const userText = inputValue.trim();
    const title_result = userText.length > 5 ? userText.slice(0, 5) : userText;
    setInputValue(''); // 立即清空输入框
    setIsStreaming(true);
    setShowInitialPrompt(false);
    // ================================================================
    // ⭐ 新增核心逻辑：智能计算大模型的 Session ID (前后文记忆凭证)
    // ================================================================
    let llmSessionId: string | null = null;
    if (!isNewChatMode && messages.length > 0) {
      // 1. 浅拷贝并倒序查找，找到最后一条 AI 发送的消息
      const lastAiMessage = [...messages].reverse().find(msg => msg.role === 'assistant');
      
      if (lastAiMessage) {
        // 2. 获取上一次回答用的模型名字（兼容前端生成的 systemName 和后端返回的 current_model_name）
        const lastModelName = lastAiMessage.systemName || lastAiMessage.current_model_name;
        // 3. 判断：用户有没有切模型？
        if (lastModelName === selectedSubModel.name) {
          // 没切模型！把最后一条消息的记忆 ID 拿出来继续用（如果后端传了的话）
          llmSessionId = lastAiMessage.current_session_id || null;
        } else {
          // 切模型了！强行置空，开启新记忆
          llmSessionId = null;
        }
      }
    }
    // ================================================================
    const tempUserMsgId = `user_msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const tempAiMsgId = `ai_msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    
    const newUserMessage: Message = { 
      id: tempUserMsgId, 
      role: 'user', 
      content: userText,
      created_at: new Date().toISOString()
    };
    
    const emptyAiMessage: Message = { 
      id: tempAiMsgId, 
      role: 'assistant', 
      content: '', // 初始为空，稍后由流式接口填充
      systemName: selectedSubModel.name, // 留给前端 UI 渲染用的
      current_model_name: selectedSubModel.name, // ⭐ 新增：和后端保持一致
      current_session_id: null, // ⭐ 新增：占位，等流式接口返回真实的后再更新
      created_at: new Date().toISOString()
    };
    
    let targetSessionId = activeSessionId;
    try {
      // ----------------------------------------------------------------
      // 第一步：如果是新对话，先调用后端接口创建真实的 Conversation
      // ----------------------------------------------------------------
      if (isNewChatMode || !targetSessionId) {
         const newConv = await createConversation(title_result);
         targetSessionId = newConv.session_id; 
         
        const newSession: ChatSession = {
          session_id: newConv.session_id, 
          title: newConv.title || userText, 
          messages: [newUserMessage, emptyAiMessage]
        };
        
        setSessions(prev => [newSession, ...prev].slice(0, 10));
        setActiveSessionId(targetSessionId);
        setIsNewChatMode(false);
      } else {
        // 如果是老对话，直接更新前端 UI 气泡
        setSessions(prevSessions => prevSessions.map(session => {
          if (session.session_id === targetSessionId) {
            return { 
              ...session, 
              messages: [...session.messages, newUserMessage, emptyAiMessage] 
            };
          }
          return session;
        }));
      }
      // ================================================================
      // 第二步：拿着真实的 Session ID 去请求流式回复
      // ================================================================
      if (targetSessionId) {
        // ⭐ 修改：把计算好的大模型记忆 ID 和模型名字，传给下层函数
        await fetchRealStreamingResponse(
          targetSessionId, 
          userText, 
          tempAiMsgId, 
          llmSessionId,           // 👈 传进去！
          selectedSubModel.name   // 👈 传进去！
        );
      }
    } catch (error) {
      console.error("发送消息流程出错:", error);
      alert("创建对话或发送失败，请重试");
      setIsStreaming(false); 
    }
  };

  // 【新增方法】：调用真实后端流式接口
  const updateAiTextInState = (
      sessionId: string,
      aiMessageId: string,
      text: string
    ) => {
      setSessions(prev =>
        prev.map(session =>
          session.session_id === sessionId
            ? {
                ...session,
                messages: session.messages.map(msg =>
                  msg.id === aiMessageId
                    ? { ...msg, content: text } // 👈 覆盖
                    : msg
                )
              }
            : session
        )
      );
    };

    const fetchRealStreamingResponse = async (
    sessionId: string, 
    text: string, 
    aiMessageId: string,
    llmSessionId: string | null,   // 👈 新增参数
    modelName: string              // 👈 新增参数
  ) => {
    try {
      await sendStreamMessage({
        conversationId: sessionId,
        content: text,
        current_session_id: llmSessionId,
        current_model_name: modelName,
        onSessionId: (newId: string) => {
          console.log("太棒了！组件接收到了底层的 Session ID:", newId);
          // 更新 React 状态，把刚刚创建的那个 current_session_id: null 的气泡填上真正的 ID
          setSessions(prevSessions => prevSessions.map(session => {
            if (session.session_id === sessionId) {
              return {
                ...session,
                messages: session.messages.map(msg => 
                  msg.id === aiMessageId  
                    ? { ...msg, current_session_id: newId } // 👈 完美替换进去！
                    : msg
                )
              };
            }
            return session;
          }));
        },
        onMessage: (accumulatedText: string) => {
          // 直接覆盖当前气泡的文本
          updateAiTextInState(sessionId, aiMessageId, accumulatedText);
        },
        onError: (error: unknown) => {
          console.error(error); 
          updateAiTextInState(sessionId, aiMessageId, "\n\n[网络请求出错]");
        }
      });
    } catch (error) {
      console.error("对话流中断", error);
    } finally {
      setIsStreaming(false);
    }
  };

  // 键盘事件 (添加 React.KeyboardEvent 泛型)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 处理登出
  const handleLogout = async () => {
    try {
      await backendLogout();
      window.location.href = '/';
    } catch (error) {
      console.error('登出失败:', error);
      alert('登出失败，请重试');
    }finally {
    // 2. 【核心修复】清除本地存储的所有相关 Token
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('userInfo'); // 如果你有存用户信息的话
    
    // 3. 如果你使用了 Redux/Zustand，需要手动重置内存中的状态
    // dispatch(logoutAction()); // 如果你有 Redux action 也要调用
    
    // 4. 跳转
    window.location.href = '/'; 
  }
  };



  // ... 在菜单按钮中绑定
  
  if (isAppLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white text-gray-500">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <svg className="animate-spin h-10 w-10 text-black" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-lg font-medium animate-pulse">正在初始化数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white text-gray-800 font-sans overflow-hidden">
      
      {/* ================= 左侧：历史记录 ================= */}
      {showSidebar && (
        <div className="w-64 bg-gray-50 flex flex-col border-r border-gray-200 hidden md:flex">
          <div className="p-4">
            <button 
              className="w-full flex items-center justify-center space-x-2 bg-white border border-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-100 transition shadow-sm font-medium"
              onClick={handleNewChat}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>新对话</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 space-y-1">
            <div className="flex items-center justify-between px-2 mt-2 mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">最近对话</p>
              <span className="text-[10px] text-gray-500">{sessions.length}/10</span>
            </div>
            
            {sessions.map((session) => (
              <div 
                key={session.session_id} 
                className={`w-full text-left px-3 py-3 text-sm rounded-lg transition flex items-center justify-between ${
                  activeSessionId === session.session_id 
                    ? 'bg-gray-100 text-gray-900 font-medium' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center flex-1 overflow-hidden">
                  <button 
                    onClick={() => handleSwitchSession(session.session_id)}
                    className="flex items-center flex-1 p-2 -mx-2 overflow-hidden"
                  >
                    <svg className="w-4 h-4 mr-2 flex-shrink-0 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <span className="truncate">{session.title}</span>
                  </button>
                </div>
                <button 
                  onClick={() => handleDeleteSession(session.session_id)}
                  className="ml-2 p-1.5 text-gray-400 hover:text-red-500 transition rounded-full hover:bg-red-50"
                  title="删除对话"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
  
      {/* ================= 右侧：聊天主区域 ================= */}
      <div className={`flex-1 flex flex-col bg-white relative ${!showSidebar && 'md:ml-0'}`}>
        
        {/* 顶部栏 */}
        <div className="h-16 border-b border-gray-100 flex justify-between items-center px-6 shadow-sm z-10 bg-white">
          <h1 className="text-lg font-bold text-gray-800">
            {isNewChatMode ? '新聊天' : (activeSession?.title || '会话加载中')}
          </h1>
          
          <div className="relative">
            {/* 用户信息触发区域 */}
            <div 
              className="flex items-center space-x-3 cursor-pointer group p-1.5 hover:bg-gray-50 rounded-full transition-all" 
              onMouseEnter={() => setShowUserMenu(true)}
              onMouseLeave={() => setShowUserMenu(false)}
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md transition-transform group-hover:scale-105">
                <span className="text-sm font-bold">{nickname?.charAt(0).toUpperCase() || 'U'}</span>
              </div>
              <div className="hidden md:flex flex-col items-start leading-tight">
                <span className="text-sm font-semibold text-gray-700">欢迎, {nickname}</span>
                <span className="text-[10px] text-gray-400">在线</span>
              </div>
              {/* 向下小箭头 */}
              <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            
            {/* 悬浮菜单窗口 */}
            {showUserMenu && (
              <div className="absolute right-0 top-full pt-2 w-56 z-20"
                onMouseEnter={() => setShowUserMenu(true)}
                onMouseLeave={() => setShowUserMenu(false)}
              >
                  <div className="bg-white rounded-[20px] shadow-lg border border-gray-200 p-2">
                  {/* 顶部用户信息卡片 */}
                  <div className="bg-gray-50/50 p-4 border-b border-gray-100">
                    <p className="text-xs text-gray-400 font-medium mb-1">当前用户：{nickname}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">账号：{userInfo.phone}</p>
                  </div>
                  <div className="p-1.5">
                    {/* 修改密码按钮 */}
                    <button 
                      onClick={() => {
                          setShowUserMenu(false); // 先关闭下拉菜单
                          navigate('/changepassword'); // 跳转到刚才新建的修改密码页面
                        }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors group"
                    >
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      <span>修改密码</span>
                    </button>
                    {/* 其他菜单项示例 (可选) */}
                    <button className="w-full flex items-center space-x-2.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>设置中心</span>
                    </button>
                  </div>
                  {/* 底部退出区域 */}
                  <div className="p-1.5 border-t border-gray-100 bg-gray-50/30">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors group"
                    >
                      <svg className="w-4 h-4 text-red-400 group-hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span className="font-medium">退出登录</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={`flex-1 overflow-y-auto flex flex-col ${showInitialPrompt ? 'justify-center' : ''}`}>
          {showInitialPrompt ? (
            // 添加了 pb-48 把文字整体稍微往上抬一点点，避免被输入框挡住
            <div className="flex flex-col items-center justify-center px-6 pb-10 flex-none">
              <h2 className="text-3xl font-bold text-gray-800 mb-4 text-center">你好！我是你的AI助手，有什么我可以帮助你的吗？</h2>
              <p className="text-xl text-gray-600 mb-4 text-center max-w-2xl">我可以为你提供关于化工新材料、化学工程、高分子科学等领域的专业知识和解决方案。</p>
              <p className="text-lg text-gray-500 mb-0 text-center">准备好了随时开始</p>
            </div>
          ) : ( 
            // 聊天记录区域增加 pb-32，防止最后一条消息被输入框挡住
            <div className="max-w-6xl mx-auto space-y-6 pb-32">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-start py-2`}>
                  
                  {msg.role === 'assistant' && (
                    <div className="flex flex-col items-center mr-2 flex-shrink-0 mt-1 w-12">
                      <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center shadow-sm">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1 w-16 text-center truncate px-1" title={msg.systemName || msg.current_model_name}>
                        {msg.systemName || msg.current_model_name}
                      </span>
                    </div>
                  )}

                  <div className={`relative px-4 py-3 pr-10 rounded-2xl max-w-[70%] text-[15px] leading-relaxed shadow-sm transition-all hover:shadow-md ${
                      msg.role === 'user' ? 'bg-black text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                    }`}
                  >
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                    {msg.role === 'assistant' && isStreaming && msg.id === messages[messages.length - 1].id && (
                      <span className="inline-block w-1.5 h-4 ml-1 bg-black animate-pulse align-middle"></span>
                    )}
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(msg.content);
                        const tempElement = document.createElement('div');
                        tempElement.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
                        tempElement.textContent = '已复制到剪贴板';
                        document.body.appendChild(tempElement);
                        setTimeout(() => tempElement.remove(), 2000);
                      }}
                      className={`absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full opacity-0 hover:opacity-100 transition-all duration-300 ${
                        msg.role === 'user' ? 'text-white hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-200'
                      }`}
                      title="复制内容"
                    >
                      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>

                  {msg.role === 'user' && (
                    <div className="flex flex-col items-center ml-2 flex-shrink-0 mt-1 w-12">
                      <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center shadow-sm">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* 输入框区域 */}
         <div className={`w-full bg-white py-4 px-6 ${isNewChatMode ? 'mb-8' : 'mb-0'}`}>
          <div className="max-w-6xl mx-auto w-full">
            <div className="bg-gray-50 border border-gray-200 rounded-full shadow-sm p-2 transition-all focus-within:border-black focus-within:ring-1 focus-within:ring-black">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowSystemModal(true)}
                  className="p-1.5 rounded-full transition text-gray-500 hover:bg-gray-200 hover:text-black"
                  title="切换AI体系"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>

                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="给 AI 发送消息 (Enter 发送)"
                  rows={1}
                  className="flex-1 max-h-32 min-h-[36px] resize-none bg-transparent outline-none py-1.5 px-2 text-gray-800 placeholder-gray-400 text-[14px] overflow-y-auto"
                  style={{ height: '36px' }}
                  onInput={(e: React.FormEvent<HTMLTextAreaElement>) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = '36px';
                    target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                  }}
                />

                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isStreaming}
                  className={`p-2 rounded-full flex items-center justify-center transition ${
                    inputValue.trim() && !isStreaming
                      ? 'bg-black text-white hover:bg-gray-800 shadow-md'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 20V4l19 8-19 8zm2-3l11.85-5L5 7v3.5l6 1.5-6 1.5V17z" />
                  </svg>
                </button>
              </div>
            </div>
            
            {!isNewChatMode && selectedSubModel && (
              <p className="text-center text-xs text-gray-400 mt-3">
                内容由 {selectedSubModel.name} 生成，请核对重要信息。
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ================= 体系选择弹窗 ================= */}
      {showSystemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-[900px] max-w-full overflow-hidden flex flex-col animate-fade-in-up max-h-[85vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-800">选择 AI 体系</h3>
              <button
                onClick={() => setShowSystemModal(false)}
                className="text-gray-400 hover:text-gray-700 text-2xl font-bold transition leading-none"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {systemOptions.map((sys) => (
                  <div
                    key={sys.id}
                    className={`relative text-left p-4 rounded-xl border-2 transition-all flex flex-col items-start ${
                      selectedSystem?.id === sys.id
                        ? 'border-black bg-gray-50 shadow-md' 
                        : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <div className="flex items-center space-x-2">
                        {/* 强制绕过 icon 的类型报错 (如果你的接口里没有 icon) */}
                        <span className="text-2xl">{(sys as any).icon || '🤖'}</span>
                        <span className="font-bold text-gray-800">{sys.name}</span>
                      </div>
                      {selectedSystem?.id === sys.id && (
                        <div className="w-4 h-4 rounded-full bg-black flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-500 leading-relaxed flex-1 mb-2">
                      {sys.description}
                    </div>
                    
                    <div className="w-full mt-auto">
                      <div className="text-xs font-semibold text-gray-400 mb-2">
                        包含模型：
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {sys.sub_models?.map((subModel) => {
                          const isSelected = selectedSubModel?.id === subModel.id;
                          return (
                            <button
                              key={subModel.id}
                              title={subModel.name} 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSystem(sys);
                                setSelectedSubModel(subModel);
                                setShowSystemModal(false);
                                inputRef.current?.focus();
                              }}
                              className={`
                                text-xs px-3 py-1.5 rounded-full transition-all duration-200 border
                                ${isSelected
                                  ? 'bg-black text-white border-black shadow-md'
                                  : 'bg-white text-gray-600 border-gray-200 hover:border-black hover:text-black'
                                }
                              `}
                            >
                              {subModel.name}
                            </button>
                          );
                        })}
                        {(!sys.sub_models || sys.sub_models.length === 0) && (
                          <span className="text-xs text-gray-400 italic">暂无可用模型</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
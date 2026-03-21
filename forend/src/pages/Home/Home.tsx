import React from 'react';
import { MessageSquare, Sparkles, Play, Send, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom'; 
const Navbar = () => {
  const navigate = useNavigate(); 
  const handleLoginClick = () => {
    navigate("/login");
  };
    const handleSignupClick = () => {
    console.log("用户点击了注册按钮");
    // 这里未来可以写：
    // 1. 打开一个注册弹窗
    // 2. 跳转到注册页 (比如用到 react-router-dom 的 useNavigate)
    // 3. 检查用户是否已经登录
    alert("准备调用注册接口！");
    navigate('/register');
  };
  return (
    <nav className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-100">
      <div className="flex items-center space-x-2">
        <div className="bg-brand-dark p-1.5 rounded-lg">
          <MessageSquare className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold text-brand-dark">化工新材料大模型</span>
      </div>
      
      <div className="hidden md:flex space-x-8 text-sm font-medium text-gray-600">
        <a href="#" className="text-brand-dark">首页</a>
        <a href="#" className="hover:text-brand-dark">功能</a>
        <a href="#" className="hover:text-brand-dark">定价</a>
        <a href="#" className="hover:text-brand-dark">关于</a>
      </div>
      
      <div className="flex items-center space-x-4 text-sm font-medium">
        <button onClick={handleLoginClick} className="px-4 py-2 text-black  rounded-full hover:bg-gray-800 hover:text-white transition">
          登录
        </button>
        <button onClick={handleSignupClick} className="px-4 py-2 text-black  rounded-full hover:bg-gray-800 hover:text-white transition">
          注册
        </button>

      </div>
    </nav>
  );
};

const HeroLeft = () => {
  const navigate = useNavigate(); 
  const handleChatClick = () => {
    navigate('/chat');
  };
  return (
    <div className="flex flex-col justify-center max-w-xl">
      <div className="inline-flex items-center space-x-2 bg-gray-100 px-3 py-1.5 rounded-full w-fit mb-8">
        <Sparkles className="w-4 h-4 text-gray-600" />
        <span className="text-sm text-gray-600 font-medium">新一代 AI 对话体验</span>
      </div>
      
      <h1 className="text-6xl font-extrabold text-brand-dark leading-tight mb-6">
        智能对话<br />无限可能
      </h1>
      
      <p className="text-lg text-brand-gray mb-10 leading-relaxed">
        我在材料领域有丰富的知识储备，为您提供专业的建议和解决方案。
      </p>
      
      <div className="flex items-center space-x-4 mb-16">
        <button className="flex items-center space-x-2 px-6 py-3 bg-brand-dark text-white rounded-full hover:bg-gray-800 transition font-medium">
          <span>开始对话</span>
          <ChevronRight className="w-4 h-4" />
        </button>
        <button onClick={handleChatClick} className="flex items-center space-x-2 px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-full hover:bg-gray-50 transition font-medium">
          <Play className="w-4 h-4" />
          <span>观看演示</span>
        </button>
      </div>
      
      <div className="flex items-center space-x-12">
        <div>
          <div className="text-2xl font-bold text-brand-dark">1000+</div>
          <div className="text-sm text-brand-gray mt-1">活跃用户</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-brand-dark">99.9%</div>
          <div className="text-sm text-brand-gray mt-1">服务可用性</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-brand-dark">17</div>
          <div className="text-sm text-brand-gray mt-1">支持体系</div>
        </div>
      </div>
    </div>
  );
};

const HeroRight = () => {
  return (
    <div className="relative w-full max-w-md lg:max-w-lg mx-auto lg:ml-auto mt-12 lg:mt-0">
      {/* 装饰背景图形 */}
      <div className="absolute -top-6 -right-6 w-32 h-32 bg-gray-100 rounded-3xl -z-10 rotate-12"></div>
      <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-gray-100 rounded-3xl -z-10 -rotate-12"></div>
      
      {/* 聊天窗口主体 */}
      <div className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden flex flex-col h-[500px]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="bg-brand-dark p-1.5 rounded-lg">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-brand-dark">AI 助手</div>
              <div className="flex items-center text-xs text-brand-gray">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5"></span>
                离线
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="bg-brand-dark text-white text-xs px-2 py-1 rounded-full">流式</span>
            <Sparkles className="w-5 h-5 text-gray-400" />
          </div>
        </div>

        {/* 聊天内容区 */}
        <div className="flex-1 p-4 bg-gray-50/50">
          <div className="flex space-x-3">
             <div className="bg-brand-dark p-1.5 rounded-lg h-8 w-8 flex-shrink-0 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div className="bg-gray-100 text-gray-800 text-sm px-4 py-3 rounded-2xl rounded-tl-none max-w-[85%]">
              你好！我是AI助手，有什么可以帮助你的吗？
            </div>
          </div>
        </div>

        {/* 输入框区 */}
        <div className="p-4 bg-white border-t border-gray-100">
          <div className="relative flex items-center">
            <input 
              type="text" 
              placeholder="服务离线中..." 
              disabled
              className="w-full bg-gray-50 border border-gray-200 text-sm rounded-full py-3 pl-4 pr-12 focus:outline-none text-gray-400 cursor-not-allowed"
            />
            <button disabled className="absolute right-2 p-2 bg-gray-400 text-white rounded-full cursor-not-allowed">
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="text-center text-xs text-gray-400 mt-3">
            流式响应已开启 · AI生成的内容仅供参考
          </div>
        </div>
      </div>
    </div>
  );
};

function Home() {
  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-8 py-12 lg:py-24 flex flex-col lg:flex-row items-center justify-between">
        <HeroLeft />
        <HeroRight />
      </main>
    </div>
  );
}

export default Home;
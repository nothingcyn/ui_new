import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { changePassword} from '@/services/userService';
import {useLogout} from '@/utils/logout';
export default function ChangePassword() {
  const navigate = useNavigate();
  const logout = useLogout();
  // 1. 从 Redux 中获取当前登录用户的手机号 (请根据你实际的 state 结构修改)
  // 假设你的 user 信息存在 state.auth.user 中
  const currentUserPhone = useAppSelector((state: any) => state.auth.user?.phone || state.auth.userInfo?.phone || '');

  // 表单状态
  const [newPassword, setNewPassword] = useState<string>('');
  const [oldPassword, setOldPassword] = useState<string>('');

  // 交互状态
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // 提交修改密码
  const handleSubmit = async () => {
    if (!currentUserPhone) {
      return alert('未获取到当前用户信息，请重新登录');
    }
    
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return alert('密码格式错误：必须包含字母、数字和特殊字符，且至少8位');
    }
    
    try {
    setIsLoading(true);
    // ✅ 修改点 1：直接调用，不要用 dispatch，也不要用 .unwrap()
    // 因为 changePassword 已经是一个返回 Promise 的函数了
    await changePassword({
            current_password: oldPassword,
            new_password: newPassword
        });
    logout(); 
  } catch (err: any) {
    // 如果你的 request 拦截器返回了后端的错误信息，通常在 err.response.data
    const errorMsg = err?.response?.data?.detail || err?.message || '修改密码失败，请重试！';
    alert(errorMsg);
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 relative">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100 z-10">
        
        {/* 返回按钮和标题 */}
        <div className="flex items-center mb-8 relative">
          <button 
            onClick={() => navigate(-1)} 
            className="absolute left-0 text-gray-400 hover:text-black transition"
            title="返回上一页"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-xl font-bold text-center text-black w-full">修改登录密码</h2>
        </div>
        
        <form className="space-y-5">
          {/* 当前手机号显示 (禁用输入，防止越权改绑) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">当前绑定手机号</label>
            <input
              type="text"
              value={currentUserPhone ? currentUserPhone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '获取中...'}
              disabled
              className="w-full px-4 py-2 bg-gray-100 border border-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
            />
          </div>
          {/* 新密码 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">旧密码</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="请输入旧密码"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black transition"
            />
            <p className="text-xs text-gray-400 mt-1">
              密码至少8位，包含字母、数字及特殊字符
            </p>
          </div>

          {/* 确认密码 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">新密码</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="请输入新密码"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black transition"
            />
          </div>

          {/* 提交按钮 */}
          <button
            type="button"
            disabled={isLoading}
            onClick={handleSubmit}
            className="w-full py-2.5 px-4 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition mt-8 font-medium"
          >
            {isLoading ? '处理中...' : '确认修改并重新登录'}
          </button>
        </form>
      </div>
    </div>
  );
}
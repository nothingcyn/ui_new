import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/store/hooks';
import { resetPassword } from '@/store/slices/authSlice';
import { backendLogout, sendSmsCode } from '@/services/authService';
import {useLogout} from '@/utils/logout';
export default function ForgotPassword() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const pageLogout = useLogout();

  // 表单状态 (允许用户输入手机号)
  const [phone, setPhone] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  
  const [countdown, setCountdown] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 阿里云验证码相关状态
  const captchaObjRef = useRef<any>(null);
  const [isCaptchaReady, setIsCaptchaReady] = useState<boolean>(false);

  // 使用 ref 解决阿里云回调函数中的“闭包陷阱”，确保发短信时拿到最新的手机号
  const phoneRef = useRef(phone);
  useEffect(() => {
    phoneRef.current = phone;
  }, [phone]);

  // 倒计时逻辑
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // 真实发送短信逻辑 (验证码验证成功后调用)
  const realSendCode = async (captchaData: any) => {
    const currentPhone = phoneRef.current; // 使用 ref 获取最新的手机号
    try {
      await sendSmsCode({
        phone: currentPhone,
        captcha_data: {
          lot_number: captchaData.lot_number,
          captcha_output: captchaData.captcha_output,
          pass_token: captchaData.pass_token,
          gen_time: captchaData.gen_time,
        },
      });

      alert('验证码发送成功，请注意查收');
      setCountdown(60);
      if (captchaObjRef.current) captchaObjRef.current.reset();
    } catch (error: any) {
      console.error('发送短信失败:', error);
      alert(error.response?.data?.detail || '发送失败，请稍后重试');
      if (captchaObjRef.current) captchaObjRef.current.reset();
    }
  };

  // 初始化阿里云验证码 (页面加载时执行)
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).initAlicom4) {
      (window as any).initAlicom4(
        {
          captchaId: import.meta.env.VITE_ALIYUN_CAPTCHA_APP_ID,
          product: 'bind', // 使用 bind 模式，调用 showCaptcha() 才会弹窗
        },
        function (captchaObj: any) {
          captchaObjRef.current = captchaObj;

          captchaObj
            .onNextReady(function () {
              setIsCaptchaReady(true);
            })
            .onSuccess(async function () {
              const result = captchaObj.getValidate();
              try {
                await realSendCode(result);
              } catch (err) {
                console.error('发送短信失败:', err);
              }
            })
            .onError(function (error: any) {
              console.error('图形验证码出错:', error);
            });
        }
      );
    } else {
      console.error('未检测到阿里云 ct4.js 脚本，请确认 index.html 中是否引入');
    }

    // 组件卸载时销毁实例
    return () => {
      if (captchaObjRef.current) {
        captchaObjRef.current.destroy();
        captchaObjRef.current = null;
        setIsCaptchaReady(false);
      }
    };
  }, []); // 依赖为空，只挂载一次

  // 点击“获取验证码”按钮
  const handleGetCodeClick = () => {
    const phoneRegex = /^\d{11}$/;
    if (!phone) {
      alert('请先输入手机号');
      return;
    }
    if (!phoneRegex.test(phone)) {
      alert('格式错误：请输入11位纯数字手机号码');
      return;
    }
    if (!isCaptchaReady || !captchaObjRef.current) {
      alert('安全防护组件正在加载中，请稍等片刻...');
      return;
    }
    // 唤起阿里云官方弹窗
    captchaObjRef.current.showCaptcha();
  };

  // 提交重置密码
  const handleSubmit = async () => {
    if (!/^\d{11}$/.test(phone)) return alert('请输入正确的11位手机号');
    if (!/^\d{6}$/.test(code)) return alert('请输入6位纯数字验证码');
    
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return alert('密码格式错误：必须包含字母、数字和特殊字符，且至少8位');
    }
    if (newPassword !== confirmPassword) {
      return alert('两次输入的密码不一致，请重新输入');
    }

    try {
      setIsLoading(true);
      
      // 调用修改密码的 action
      await dispatch(resetPassword({
        phone,
        sms_code: code,
        new_password: newPassword,
        confirm_password: confirmPassword,
      })).unwrap();

      alert('密码重置成功，请使用新密码登录！');
      pageLogout(); // 重置密码后直接登出，强制用户重新登录

    } catch (error: any) {
      alert(error.message || error.response?.data?.detail || '重置密码失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // 去除了 fixed，改为正常的页面布局：全屏、居中、灰色背景
    <div className="flex min-h-screen items-center justify-center bg-gray-50 relative">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative">
        
        {/* 左上角返回按钮 */}
        <button 
          onClick={() => navigate(-1)} 
          className="absolute left-6 top-8 text-gray-400 hover:text-black transition-colors"
          title="返回上一页"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">找回密码</h2>
        
        <form className="space-y-4">
          {/* 手机号输入框 (已取消禁用状态，用户可编辑) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">注册手机号</label>
            <input 
              type="text" 
              value={phone} 
              onChange={(e) => {
                const val = e.target.value;
                if (/^\d*$/.test(val) && val.length <= 11) setPhone(val);
              }}
              placeholder="请输入绑定的11位手机号"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black transition" 
            />
          </div>

          {/* 验证码 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">短信验证码</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^\d*$/.test(val) && val.length <= 6) setCode(val);
                }}
                placeholder="6位验证码"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black transition"
              />
              <button
                type="button"
                disabled={countdown > 0}
                onClick={handleGetCodeClick}
                className="whitespace-nowrap px-4 py-2 bg-gray-50 text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {countdown > 0 ? `${countdown}s后重新获取` : '获取验证码'}
              </button>
            </div>
          </div>

          {/* 新密码 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">新密码</label>
            <input 
              type="password" 
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)} 
              placeholder="包含字母、数字及特殊字符"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black transition" 
            />
          </div>

          {/* 确认新密码 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">确认新密码</label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
              placeholder="请再次输入新密码"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black transition" 
            />
          </div>

          <button 
            type="button"
            onClick={handleSubmit} 
            disabled={isLoading} 
            className="w-full py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors mt-8"
          >
            {isLoading ? '提交中...' : '确认重置'}
          </button>

          {/* 底部返回登录链接 */}
          <div className="flex justify-center text-sm text-gray-500 mt-4">
            记起密码了？ 
            <button 
              type="button" 
              className="hover:underline hover:text-black ml-1 font-medium" 
              onClick={() => navigate('/login')}
            >
              去登录
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
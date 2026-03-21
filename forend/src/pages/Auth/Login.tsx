import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch } from '@/store/hooks';
import { login } from '@/store/slices/authSlice';
import { sendSmsCode } from '@/services/authService';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  // 登录方式：'password' | 'code'
  const [loginMethod, setLoginMethod] = useState<'password' | 'code'>('password');

  // 表单状态
  const [account, setAccount] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(false);

  // 使用 ref 解决阿里云回调函数中的“闭包陷阱”，确保发短信时拿到最新的手机号
  const accountRef = useRef(account);
  useEffect(() => {
    accountRef.current = account;
  }, [account]);

  // 验证码相关状态
  const [countdown, setCountdown] = useState<number>(0);
  const [requestCounts, setRequestCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // ---------------- 拼图弹窗状态 ----------------
  const captchaObjRef = useRef<any>(null);
  const [isCaptchaReady, setIsCaptchaReady] = useState<boolean>(false);
  // 倒计时逻辑
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // 真正向后端发送验证码的逻辑
  const realSendCode = async (captchaData: any) => {
    const currentPhone = accountRef.current; // 使用 ref 获取最新手机号
  
    try {
      // 请求后端接口，带上手机号和阿里云返回的 4 个参数
      await sendSmsCode({
        phone: currentPhone,
        captcha_data: {
          lot_number: captchaData.lot_number,
          captcha_output: captchaData.captcha_output,
          pass_token: captchaData.pass_token,
          gen_time: captchaData.gen_time,
        },
      });
      // 记录发送次数
      setRequestCounts((prev) => ({
        ...prev,
        [currentPhone]: (prev[currentPhone] ?? 0) + 1,
      }));

      alert('验证码发送成功，请注意查收');
      setCountdown(60);
      captchaObjRef.current.reset(); // 成功后重置
    } catch (error: any) {
      console.error('发送短信失败:', error);
      alert(error.response?.data?.detail || '发送失败，请稍后重试');
      captchaObjRef.current.reset(); // 失败后也要重置，让用户可以重新滑
    }
  };

  // 页面加载时初始化阿里云验证码
  useEffect(() => {
    // 确认浏览器环境和全局 initAlicom4 存在
    if (typeof window !== 'undefined' && (window as any).initAlicom4) {
      (window as any).initAlicom4(
        {
          captchaId: import.meta.env.VITE_ALIYUN_CAPTCHA_APP_ID,
          product: 'bind', // 或 'float'，根据业务需要
        },
        function (captchaObj: any) {
          // 保存对象，方便后续销毁
          captchaObjRef.current = captchaObj;

          // 回调注册
          captchaObj
            .onNextReady(function () {
              setIsCaptchaReady(true);
              console.log('验证码已准备好');
            })
            .onSuccess(async function () {
              // 用户验证成功！获取二次校验参数
              const result = captchaObj.getValidate();
              console.log('阿里云验证码验证成功，获取到的参数:', result);

              // 调用发送短信接口
              try {
                await realSendCode(result); // ⚠️ result 要包含 lot_number、pass_token、captcha_output、gen_time
                console.log('短信发送成功');
              } catch (err) {
                console.error('发送短信失败:', err);
              }
            })
            .onError(function (error: any) {
              console.error('图形验证码出错:', error);
            })
            .onClose(function () {
              console.log('用户关闭了验证码弹窗');
            });

          // 不自动显示滑块弹窗，只在用户点击获取验证码时显示
          // captchaObj.showBox();
        }
      );
    } else {
      console.error('未检测到阿里云 ct4.js 脚本，请确认是否在 index.html 中引入');
    }

    // 组件卸载时销毁实例
    return () => {
      if (captchaObjRef.current) {
        captchaObjRef.current.destroy();
      }
    };
  }, []);// ⚠️ 这里必须加上空依赖数组，否则每次输入手机号都会重新挂载阿里云插件

  // 点击“获取验证码”按钮
  const handleGetCodeClick = () => {
    
    const phoneRegex = /^\d{11}$/;
    if (!account) {
      alert('请先输入手机号');
      return;
    }
    if (!phoneRegex.test(account)) {
      alert('格式错误：请输入11位纯数字手机号码');
      return;
    }
    if (!isCaptchaReady || !captchaObjRef.current) {
      alert('安全防护组件正在加载中，请稍等片刻...');
      return;
    }
    console.log('触发获取验证码流程，当前手机号:', account);
    // 唤起阿里云官方滑块/拼图弹窗
    captchaObjRef.current.showCaptcha();
  };



  // 登录逻辑
  const handleLogin = async () => {
    const phoneRegex = /^\d{11}$/;
    if (loginMethod === 'password') {
      if (!account || !password) {
        alert('请输入账号和密码');
        return;
      }
    } else {
      if (!phoneRegex.test(account)) {
        alert('格式错误：请输入11位纯数字手机号码');
        return;
      }
      if (!code) {
        alert('请输入验证码');
        return;
      }
    }

    try {
      setIsLoading(true);

      // 注意：发短信时才需要图形验证码，真实登录时只需要传手机号和短信验证码
      await dispatch(
        login({
          phone: account,
          password: loginMethod === 'password' ? password : null,
          sms_code: loginMethod === 'code' ? code : null,
          remember_me: rememberMe
        })
      ).unwrap();

      // 登录成功后跳转
      const from = location.state?.from?.pathname || '/chat';
      navigate(from, { replace: true });

    } catch (error: any) {
      // 👇 修改这里：精准捕获“未注册”的提示
      const errorMsg = error.message || error.response?.data?.detail || '登录失败';
      
      if (errorMsg.includes('该账号未注册，请先去注册')) {
         // 提示用户并跳转到注册页，顺便把手机号带过去，免得用户重新填
         const confirmGo = window.confirm('该手机号尚未注册，是否立即前往注册？');
         if (confirmGo) {
             navigate('/register', { state: { phone: account } });
         }
      } else {
         // 其他常规错误（如密码错误、验证码错误）正常提示
         setCode('');
         alert(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 relative">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100 z-10">
        {/* 登录方式切换 Tab */}
        <div className="flex justify-center space-x-8 mb-6 border-b border-gray-100">
          <button
            className={`pb-2 text-lg font-bold transition-colors ${
              loginMethod === 'password'
                ? 'text-black border-b-2 border-black'
                : 'text-gray-400 hover:text-gray-700'
            }`}
            onClick={() => {
              setLoginMethod('password');
              setCode('');
            }}
          >
            密码登录
          </button>
          <button
            className={`pb-2 text-lg font-bold transition-colors ${
              loginMethod === 'code'
                ? 'text-black border-b-2 border-black'
                : 'text-gray-400 hover:text-gray-700'
            }`}
            onClick={() => {
              setLoginMethod('code');
              setPassword('');
            }}
          >
            验证码登录
          </button>
        </div>

        <form className="space-y-4">
          {/* 账号输入框 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {loginMethod === 'code' ? '手机号码' : '账号'}
            </label>
            <input
              type="text"
              value={account}
              onChange={(e) => {
                const val = e.target.value;
                if (loginMethod === 'code') {
                  if (/^\d*$/.test(val) && val.length <= 11) setAccount(val);
                } else {
                  setAccount(val);
                }
              }}
              placeholder={loginMethod === 'code' ? '请输入11位手机号' : '请输入手机号或邮箱'}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black transition"
            />
          </div>
          
         
          {/* 密码输入框 */}
          {loginMethod === 'password' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black transition"
              />
            </div>
          )}

          {/* 验证码输入框 */}
          {loginMethod === 'code' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">验证码</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^\d*$/.test(val) && val.length <= 6) setCode(val);
                  }}
                  placeholder="请输入短信验证码"
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
          )}

          {/* 记住我 */}
          <div className="flex items-center justify-end">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded cursor-pointer"
            />
            <label htmlFor="remember" className="ml-2 block text-sm text-gray-700 cursor-pointer">
              自动登录
            </label>
          </div>

          {/* 登录提交按钮 */}
          <button
            type="button"
            disabled={isLoading}
            onClick={handleLogin}
            className="w-full py-2 px-4 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition mt-6"
          >
            {isLoading ? '登录中...' : '立即登录'}
          </button>

          {/* 底部链接 */}
          <div className="flex justify-between text-sm text-gray-500 mt-4">
            <button

              type="button"
              className="hover:underline hover:text-gray-800"
              onClick={() => navigate('/register')}
            >
              注册账号
            </button>
            <button
              type="button"
              className="hover:underline hover:text-gray-800"
              onClick={() => navigate('/forgotpassword')}
            >
              忘记密码？
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
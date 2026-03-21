import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/store/hooks';
import { register } from '@/store/slices/authSlice';
import { sendSmsCode } from '@/services/authService';

export default function Register() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // ==================== 状态 ====================
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [code, setCode] = useState('');

  const [countdown, setCountdown] = useState(0);
  const [smsLoading, setSmsLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [isCaptchaReady, setIsCaptchaReady] = useState(false);

  const phoneRef = useRef(phone);
  useEffect(() => {
    phoneRef.current = phone;
  }, [phone]);

  const captchaObjRef = useRef<any>(null);

  // ==================== 表单验证 ====================
  const isValidPhone = (p: string) => /^\d{11}$/.test(p);
  const isValidPassword = (p: string) =>
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,}$/.test(p);
  const isValidCode = (c: string) => /^\d{6}$/.test(c);

  // ==================== 倒计时 ====================
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // ==================== 阿里云验证码初始化 ====================
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).initAlicom4) {
      (window as any).initAlicom4(
        {
          captchaId: import.meta.env.VITE_ALIYUN_CAPTCHA_APP_ID,
          product: 'bind',
        },
        function (captchaObj: any) {
          captchaObjRef.current = captchaObj;

          captchaObj
            .onNextReady(() => setIsCaptchaReady(true))
            .onSuccess(async () => {
              const result = captchaObj.getValidate();
              if (!result || !result.lot_number) {
                alert('验证码验证失败，请重试');
                captchaObjRef.current?.reset();
                return;
              }
              try {
                await realSendCode(result);
              } catch (err) {
                console.error(err);
              }
            })
            .onError((err: any) => console.error('验证码出错', err))
            .onClose(() => console.log('验证码弹窗关闭'));
        }
      );
    } else {
      console.error('未检测到阿里云验证码脚本');
    }

    return () => captchaObjRef.current?.destroy();
  }, []);

  // ==================== 发送短信验证码 ====================
  const realSendCode = async (captchaData: any) => {
    const currentPhone = phoneRef.current;
    setSmsLoading(true);
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
      captchaObjRef.current?.reset();
    } catch (err: any) {
      console.error('发送短信失败', err);
      alert(err.response?.data?.detail || '发送失败，请稍后重试');
      captchaObjRef.current?.reset();
    } finally {
      setSmsLoading(false);
    }
  };

  const handleGetCodeClick = () => {
    if (!isValidPhone(phone)) {
      alert('请输入11位手机号');
      return;
    }
    if (!isCaptchaReady || !captchaObjRef.current) {
      alert('验证码组件尚未加载，请稍候');
      return;
    }
    captchaObjRef.current.showCaptcha();
  };

  // ==================== 提交注册 ====================
  const handleRegister = async () => {
    if (!isValidPhone(phone)) {
      alert('请输入11位手机号');
      return;
    }
    if (!isValidPassword(password)) {
      alert('密码格式错误：必须包含字母、数字和特殊字符，且至少8位');
      return;
    }
    if (password !== confirmPassword) {
      alert('两次输入的密码不一致');
      return;
    }
    if (!isValidCode(code)) {
      alert('请输入6位验证码');
      return;
    }

    setRegisterLoading(true);
    try {
      await dispatch(
        register({
          phone,
          password,
          confirm_password: confirmPassword,
          sms_code: code,
          nickname,
        })
      ).unwrap();
      alert('注册成功！跳转主页');
      navigate('/');
    } catch (err: any) {
      alert(err.message || '注册失败');
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 relative">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100 z-10">
        <h2 className="text-2xl font-bold text-center mb-6">注册账号</h2>
        <form className="space-y-4">
          {/* 手机号 */}
          <div>
            <label className="block text-sm font-medium mb-1">手机号</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => {
                const val = e.target.value;
                if (/^\d*$/.test(val) && val.length <= 11) setPhone(val);
              }}
              placeholder="请输入11位手机号"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-black transition"
            />
          </div>

          {/* 昵称 */}
          <div>
            <label className="block text-sm font-medium mb-1">昵称（可选）</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="请输入昵称"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-black transition"
            />
          </div>

          {/* 密码 */}
          <div>
            <label className="block text-sm font-medium mb-1">设置密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-black transition"
            />
            <p className="text-xs text-gray-400 mt-1">
              密码至少8位，包含字母、数字和特殊字符
            </p>
          </div>

          {/* 确认密码 */}
          <div>
            <label className="block text-sm font-medium mb-1">确认密码</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="请确认密码"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-black transition"
            />
          </div>

          {/* 验证码 */}
          <div>
            <label className="block text-sm font-medium mb-1">验证码</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^\d*$/.test(val) && val.length <= 6) setCode(val);
                }}
                placeholder="请输入6位数字验证码"
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:border-black transition"
              />
              <button
                type="button"
                disabled={countdown > 0 || smsLoading}
                onClick={handleGetCodeClick}
                className={`whitespace-nowrap px-4 py-2 rounded-lg border transition ${
                  countdown === 0 && !smsLoading
                    ? 'bg-black text-white border-black hover:bg-gray-800'
                    : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                }`}
              >
                {smsLoading ? '请求中...' : countdown > 0 ? `${countdown}s后重新获取` : '获取验证码'}
              </button>
            </div>
          </div>

          <button
            type="button"
            disabled={registerLoading}
            onClick={handleRegister}
            className="w-full py-2 px-4 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition mt-6"
          >
            {registerLoading ? '处理中...' : '立即注册'}
          </button>

          <div className="text-center text-sm text-gray-500 mt-4">
            已有账号？
            <button
              type="button"
              className="text-black font-medium hover:underline ml-1"
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
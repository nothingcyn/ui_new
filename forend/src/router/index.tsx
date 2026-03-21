import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import ProtectedRoute from './ProtectedRoute'

// 懒加载页面组件
const Home = lazy(() => import('../pages/Home/Home'))
const Login = lazy(() => import('../pages/Auth/Login.tsx'))
const Register = lazy(() => import('../pages/Auth/Register.tsx'))
const ForgotPassword = lazy(() => import('../pages/Auth/ForgotPassword.tsx'))
const Chat = lazy(() => import('../pages/Chat/Chat.tsx'))
const ChangePassword = lazy(() => import('../pages/Auth/ChangePassword.tsx'))
// 加载中组件
const LoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '24px', color: '#333' }}>
    加载中...
  </div>
)

const Router = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* 公开路由 */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgotpassword" element={<ForgotPassword />} />
        <Route path="/changepassword" element={<ChangePassword />} />
        {/* 受保护路由 */}
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />

        {/* 默认重定向 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default Router
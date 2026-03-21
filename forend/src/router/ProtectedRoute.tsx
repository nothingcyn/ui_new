import { Navigate, useLocation } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // 暂时屏蔽身份验证功能，直接返回children
  // 注释掉以下代码
  /*
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) {
    // 保存原始路径，登录后跳转回来
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  */

  return <>{children}</>
}

export default ProtectedRoute

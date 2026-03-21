import Router from './router';
import { useEffect } from 'react';
import {useLogout} from '@/utils/logout';
const App = () => {
  const logout = useLogout();
  useEffect(() => {
    // 处理跨标签页登出同步
    const handleStorageChange = (e: StorageEvent) => {
      // 只有当被清除的是特定的 key 时才触发，或者简单判断 token 是否消失
      const hasToken = localStorage.getItem('access_token');
      
      // 如果 token 没了，说明其他页面执行了退出登录
      if (!hasToken) {
        logout();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [logout]);
  // 重点：在这里返回你的路由组件
  return (
    <Router />
  );
};
export default App;
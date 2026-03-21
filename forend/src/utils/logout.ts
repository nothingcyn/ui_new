import { useDispatch } from 'react-redux';
import { resetUserState } from '@/store/slices/userSlice';
import { useNavigate } from 'react-router-dom';
import { backendLogout } from '@/services/authService';
export const useLogout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      await backendLogout();
    } catch (err) {
      console.error("后端注销失败:", err);
    }
  };
  const logout = () => {
  // ✅ 1. 调后端（不阻塞，不重复 catch）
  handleLogout();

  // ✅ 2. 清 token（精准删除）
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('userInfo');

  // ❌ 不建议：会误删其他数据
  // localStorage.clear();

  // ✅ 3. 多标签页同步（推荐加）
  localStorage.setItem('logout', Date.now().toString());

  // ❌ Cookie 清理可以删掉（基本没用，除非你自己手动设置过）
  /*
  const cookies = document.cookie.split(';');
  cookies.forEach(cookie => {
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/`;
  });
  */

  // ✅ 4. Redux
  dispatch(resetUserState());

  // ✅ 5. 跳转
  navigate('/login', { replace: true });
};

return logout;
};
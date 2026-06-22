import { useEffect, useState } from 'react';
import userApi from '../api/userApi';
import { logoutApi } from '../api/authApi'; // MỚI
import { buildAuthUser } from '../utils/authUtils';
import { AuthContext } from './authContextValue';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('refreshToken'); // MỚI — xóa cả refresh token
    setUser(null);
  };

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    userApi.getMe()
      .then((res) => {
        if (res.success && res.data) {
          setUser(buildAuthUser(res.data));
        } else {
          clearSession();
        }
      })
      .catch(() => {
        clearSession();
      })
      .finally(() => setLoading(false));
  }, []);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    const refreshToken = sessionStorage.getItem('refreshToken'); 
    if (refreshToken) {
      logoutApi(refreshToken).catch(() => {}); // — báo backend xóa refresh token, lỗi thì vẫn cho logout phía client
    }
    clearSession();
  };

  const value = {
    user,
    login,
    logout,
    clearSession,
    loading,
    isAuthenticated: Boolean(user),
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

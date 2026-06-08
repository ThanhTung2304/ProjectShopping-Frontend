import { useEffect, useState } from 'react';
import userApi from '../api/userApi';
import { buildAuthUser, getTokenUser } from '../utils/authUtils';
import { AuthContext } from './authContextValue';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getTokenUser());
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('token')));

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    userApi.getMe()
      .then((res) => {
        if (res.success && res.data) setUser(buildAuthUser(res.data));
      })
      .catch(async () => {
        try {
          const res = await userApi.getProfile();
          if (res.success && res.data) setUser(buildAuthUser(res.data));
        } catch {
          setUser((currentUser) => currentUser || getTokenUser());
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const login = (userData) => {
    setUser(userData || getTokenUser());
  };

  const clearSession = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const logout = () => {
    clearSession();
  };

  const value = {
    user,
    login,
    logout,
    clearSession,
    loading,
    isAuthenticated: Boolean(localStorage.getItem('token')),
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

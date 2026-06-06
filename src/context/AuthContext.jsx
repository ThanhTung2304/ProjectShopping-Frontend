import { useEffect, useState } from 'react';
import userApi from '../api/userApi';
import { AuthContext } from './authContextValue';

const decodeTokenPayload = (token) => {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;

    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(normalizedPayload)
        .split('')
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    );

    return JSON.parse(json);
  } catch {
    return null;
  }
};

const getTokenUser = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  const payload = decodeTokenPayload(token);
  return {
    id: payload?.id || payload?.userId || payload?.sub || 'authenticated-user',
    email: payload?.email || payload?.sub || '',
    fullName: payload?.fullName || payload?.name || payload?.sub || 'Tài khoản',
    role: payload?.role || payload?.authorities?.[0]?.authority || payload?.authorities?.[0] || 'customer',
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getTokenUser());
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('token')));

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    userApi.getProfile()
      .then((res) => {
        if (res.success && res.data) setUser(res.data);
      })
      .catch(() => {
        setUser((currentUser) => currentUser || getTokenUser());
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

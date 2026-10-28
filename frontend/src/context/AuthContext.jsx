import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('veribrand_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('veribrand_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          const res = await authApi.getMe();
          const userData = {
            ...user,
            ...res.data,
          };
          setUser(userData);
          localStorage.setItem('veribrand_user', JSON.stringify(userData));
        } catch (err) {
          console.warn('Session expired or invalid, logging out.');
          logout();
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, [token]);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    const { access_token, user_id, full_name, role, workspace_id, workspace_name } = res.data;
    const userData = { user_id, email, full_name, role, workspace_id, workspace_name };

    localStorage.setItem('veribrand_token', access_token);
    localStorage.setItem('veribrand_user', JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const register = async (userData) => {
    const res = await authApi.register(userData);
    const { access_token, user_id, email, full_name, role, workspace_id, workspace_name } = res.data;
    const userObj = { user_id, email, full_name, role, workspace_id, workspace_name };

    localStorage.setItem('veribrand_token', access_token);
    localStorage.setItem('veribrand_user', JSON.stringify(userObj));
    setToken(access_token);
    setUser(userObj);
    return userObj;
  };

  const logout = () => {
    localStorage.removeItem('veribrand_token');
    localStorage.removeItem('veribrand_user');
    setToken(null);
    setUser(null);
  };

  // Pre-configured role credentials for quick workspace preview
  const quickLogin = async (role) => {
    const credentials = {
      admin: { email: 'admin@veribrand.ai', password: 'AdminPass123!' },
      creator: { email: 'creator@veribrand.ai', password: 'CreatorPass123!' },
      reviewer: { email: 'reviewer@veribrand.ai', password: 'ReviewerPass123!' },
    };
    if (credentials[role]) {
      return await login(credentials[role].email, credentials[role].password);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        register,
        logout,
        quickLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

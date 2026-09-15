import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('mausam360_token') || null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('mausam360_user');
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('mausam360_user');
      }
    }
  }, [token]);

  const handleLogin = async (emailOrUsername, password) => {
    const data = await loginUser(emailOrUsername, password);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('mausam360_token', data.token);
    localStorage.setItem('mausam360_user', JSON.stringify(data.user));
    setIsAuthModalOpen(false);
    return data.user;
  };

  const handleRegister = async (username, email, password) => {
    const data = await registerUser(username, email, password);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('mausam360_token', data.token);
    localStorage.setItem('mausam360_user', JSON.stringify(data.user));
    setIsAuthModalOpen(false);
    return data.user;
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('mausam360_token');
    localStorage.removeItem('mausam360_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

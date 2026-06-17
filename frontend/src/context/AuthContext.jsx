import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Authenticate user if token exists on load
  useEffect(() => {
    const bootstrapAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await authService.getMe();
          setUser(userData);
        } catch (error) {
          console.error('Failed to authenticate token', error);
          authService.logout();
          setUser(null);
        }
      }
      setLoading(false);
    };

    bootstrapAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      await authService.login(email, password);
      const userData = await authService.getMe();
      setUser(userData);
      return userData;
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, fullName, otp) => {
    setLoading(true);
    try {
      const userData = await authService.register(email, password, fullName, otp);
      // Automatically log in user on registration
      await login(email, password);
      return userData;
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async (email) => {
    return await authService.sendOtp(email);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, sendOtp }}>
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

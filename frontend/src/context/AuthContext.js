import React, { createContext, useState, useContext, useEffect } from 'react';
import apiService from '../services/api';

// Create the AuthContext
const AuthContext = createContext(null);

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Get storage type based on which one has the token
  const getStorage = () => {
    if (localStorage.getItem('token')) return localStorage;
    if (sessionStorage.getItem('token')) return sessionStorage;
    return null;
  };

  // Initialize auth state from storage on mount
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storage = getStorage();
        if (storage) {
          const token = storage.getItem('token');
          const userData = storage.getItem('user');

          if (token && userData) {
            setUser(JSON.parse(userData));
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear invalid data
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Clear authentication data
  const clearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  // Login function
  const login = async (credentials, rememberMe = false) => {
    try {
      const data = await apiService.login(credentials);

      // Choose storage based on rememberMe
      const storage = rememberMe ? localStorage : sessionStorage;

      // Store token and user data
      storage.setItem('token', data.data.token);
      storage.setItem('user', JSON.stringify(data.data.user));

      // Update state
      setUser(data.data.user);
      setIsAuthenticated(true);

      return { success: true, data: data.data };
    } catch (error) {
      return {
        success: false,
        error: error.error?.message || error.message || 'Login failed'
      };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      const data = await apiService.register(userData);

      // Store in localStorage by default for registration
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));

      // Update state
      setUser(data.data.user);
      setIsAuthenticated(true);

      return { success: true, data: data.data };
    } catch (error) {
      return {
        success: false,
        error: error.error?.message || error.message || 'Registration failed'
      };
    }
  };

  // Logout function
  const logout = () => {
    clearAuth();
    // Redirect to home page
    window.location.href = '/';
  };

  // Update user data (for profile updates, etc.)
  const updateUser = (userData) => {
    const storage = getStorage();
    if (storage) {
      storage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    }
  };

  // Check if token is still valid (optional - can be enhanced)
  const checkAuth = () => {
    const storage = getStorage();
    if (!storage || !storage.getItem('token')) {
      clearAuth();
      return false;
    }
    return true;
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    checkAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;

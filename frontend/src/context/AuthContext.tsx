import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import apiService from '../services/api';

// Type definitions
export interface User {
  id: string;
  email: string;
  username: string;
  bio?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    token: string;
    user: User;
  };
  error?: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials, rememberMe?: boolean) => Promise<AuthResponse>;
  register: (userData: RegisterData) => Promise<AuthResponse>;
  logout: () => void;
  updateUser: (userData: User) => void;
  checkAuth: () => boolean;
}

// Create the AuthContext
const AuthContext = createContext<AuthContextType | null>(null);

// Custom hook to use the AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// AuthProvider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Get storage type based on which one has the token
  const getStorage = (): Storage | null => {
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
  const login = async (credentials: LoginCredentials, rememberMe: boolean = false): Promise<AuthResponse> => {
    try {
      const data: any = await apiService.login(credentials);

      // Choose storage based on rememberMe
      const storage = rememberMe ? localStorage : sessionStorage;

      // Store token and user data
      storage.setItem('token', data.data.token);
      storage.setItem('user', JSON.stringify(data.data.user));

      // Update state
      setUser(data.data.user);
      setIsAuthenticated(true);

      return { success: true, data: data.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.error?.message || error.message || 'Login failed'
      };
    }
  };

  // Register function
  const register = async (userData: RegisterData): Promise<AuthResponse> => {
    try {
      const data: any = await apiService.register(userData);

      // Store in localStorage by default for registration
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));

      // Update state
      setUser(data.data.user);
      setIsAuthenticated(true);

      return { success: true, data: data.data };
    } catch (error: any) {
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
  const updateUser = (userData: User) => {
    const storage = getStorage();
    if (storage) {
      storage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    }
  };

  // Check if token is still valid (optional - can be enhanced)
  const checkAuth = (): boolean => {
    const storage = getStorage();
    if (!storage || !storage.getItem('token')) {
      clearAuth();
      return false;
    }
    return true;
  };

  const value: AuthContextType = {
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

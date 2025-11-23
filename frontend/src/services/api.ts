import axios, { AxiosInstance, AxiosProgressEvent, InternalAxiosRequestConfig } from 'axios';

// API base URL - uses proxy in development (package.json)
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Type definitions
export interface RegisterData {
  email: string;
  username: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ProfileData {
  username?: string;
  bio?: string;
  avatar_url?: string;
}

export interface ContentData {
  title: string;
  description?: string;
  category_id: string;
  media_url?: string;
  thumbnail_url?: string;
  tags?: string[];
  status?: 'draft' | 'published' | 'archived';
}

export interface ContentParams {
  limit?: number;
  offset?: number;
  sort?: 'recent' | 'popular' | 'most_liked' | 'oldest';
  status?: 'draft' | 'published' | 'archived';
}

export interface CommentData {
  text: string;
}

export interface CommentParams {
  limit?: number;
  offset?: number;
}

export interface ApiError {
  message: string;
  errors?: any;
}

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Generate or get session ID for view tracking (HER-43)
 * This persists across browser sessions to prevent view count inflation
 */
const getSessionId = (): string => {
  const STORAGE_KEY = 'kola_session_id';
  let sessionId = localStorage.getItem(STORAGE_KEY);

  if (!sessionId) {
    // Generate a UUID-like session ID
    sessionId = 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem(STORAGE_KEY, sessionId);
  }

  return sessionId;
};

// Request interceptor - add auth token and session ID
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Check both localStorage and sessionStorage for token
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add session ID for view tracking (HER-43)
    if (config.headers) {
      config.headers['X-Session-ID'] = getSessionId();
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Handle specific error cases
    if (error.response) {
      // Server responded with error
      const { status, data } = error.response;

      if (status === 401) {
        // Unauthorized - clear token from both storages and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        window.location.href = '/login';
      }

      return Promise.reject(data.error || data);
    } else if (error.request) {
      // Request made but no response
      return Promise.reject({ message: 'Network error. Please try again.' } as ApiError);
    } else {
      // Something else happened
      return Promise.reject({ message: error.message } as ApiError);
    }
  }
);

// API methods
const apiService = {
  // Health check
  health: () => axios.get('/health'),

  // Auth
  register: (data: RegisterData) => api.post('/auth/register', data),
  login: (data: LoginData) => api.post('/auth/login', data),

  // Users
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: ProfileData) => api.put('/users/profile', data),
  getUserByUsername: (username: string) => api.get(`/users/${username}`),

  // Content
  createContent: (data: ContentData) => api.post('/content', data),
  getContent: (id: string) => api.get(`/content/${id}`),
  getContentByCategory: (categoryId: string, params?: ContentParams) =>
    api.get(`/content/category/${categoryId}`, { params }),
  getRandomContent: (categoryId?: string) =>
    api.get('/content/random', { params: categoryId ? { category_id: categoryId } : undefined }),
  updateContent: (id: string, data: Partial<ContentData>) => api.put(`/content/${id}`, data),
  deleteContent: (id: string) => api.delete(`/content/${id}`),
  likeContent: (id: string) => api.post(`/content/${id}/like`),
  checkLikeStatus: (id: string) => api.get(`/content/${id}/like`),
  searchContent: (query: string) => api.get('/content/search', { params: { q: query } }),

  // Categories
  getCategories: () => api.get('/categories'),
  getCategory: (id: string) => api.get(`/categories/${id}`),

  // Comments
  getComments: (contentId: string, params?: CommentParams) =>
    api.get(`/content/${contentId}/comments`, { params }),
  createComment: (contentId: string, data: CommentData) =>
    api.post(`/content/${contentId}/comments`, data),
  deleteComment: (contentId: string, commentId: string) =>
    api.delete(`/content/${contentId}/comments/${commentId}`),

  // Upload
  uploadFile: (formData: FormData, onUploadProgress?: (progressEvent: AxiosProgressEvent) => void) =>
    api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    }),
};

export default apiService;

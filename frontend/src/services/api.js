import axios from 'axios';

// API base URL - uses proxy in development (package.json)
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    // Check both localStorage and sessionStorage for token
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
      return Promise.reject({ message: 'Network error. Please try again.' });
    } else {
      // Something else happened
      return Promise.reject({ message: error.message });
    }
  }
);

// API methods
const apiService = {
  // Health check
  health: () => axios.get('/health'),

  // Auth
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),

  // Users
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getUserByUsername: (username) => api.get(`/users/${username}`),

  // Content
  createContent: (data) => api.post('/content', data),
  getContent: (id) => api.get(`/content/${id}`),
  getContentByCategory: (categoryId, params) => 
    api.get(`/content/category/${categoryId}`, { params }),
  getRandomContent: (categoryId) => 
    api.get('/content/random', { params: { category_id: categoryId } }),
  updateContent: (id, data) => api.put(`/content/${id}`, data),
  deleteContent: (id) => api.delete(`/content/${id}`),
  likeContent: (id) => api.post(`/content/${id}/like`),
  searchContent: (query) => api.get('/content/search', { params: { q: query } }),

  // Categories
  getCategories: () => api.get('/categories'),
  getCategory: (id) => api.get(`/categories/${id}`),

  // Comments
  getComments: (contentId, params) => 
    api.get(`/content/${contentId}/comments`, { params }),
  createComment: (contentId, data) => 
    api.post(`/content/${contentId}/comments`, data),
  deleteComment: (contentId, commentId) => 
    api.delete(`/content/${contentId}/comments/${commentId}`),

  // Upload
  uploadFile: (formData) => 
    api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export default apiService;
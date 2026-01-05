import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import CategoryPage from './pages/CategoryPage';
import ContentDetail from './pages/ContentDetail';
import SearchResults from './pages/SearchResults';
import Upload from './pages/Upload';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Styles
import './App.css';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/category/:categoryId" element={<CategoryPage />} />
          <Route path="/content/:contentId" element={<ContentDetail />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/profile/:username" element={<Profile />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <Upload />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </AuthProvider>
  );
};

export default App;

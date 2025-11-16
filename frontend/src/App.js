import React from 'react';
import {Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import CategoryPage from './pages/CategoryPage';
import ContentDetail from './pages/ContentDetail';
import Upload from './pages/Upload';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Styles
import './App.css';

function App() {
  return (
    <Layout>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/category/:categoryId" element={<CategoryPage />} />
        <Route path="/content/:contentId" element={<ContentDetail />} />
        
        {/* Protected Routes - will add auth later */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/profile/:username" element={<Profile />} />
        
        {/* 404 */}
         <Route path="*" element={<NotFound />} /> 
      </Routes>
    </Layout>
    
  );
}

export default App;
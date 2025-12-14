import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import './Dashboard.css';

/**
 * User Dashboard Page
 * HER-50: User Dashboard Page
 *
 * Features:
 * - Display all user's published content in grid
 * - Show draft content separately
 * - Content statistics: total views, total likes
 * - Quick actions: edit, delete, view
 * - "Upload New" button prominent
 * - Responsive design
 * - Handle empty state
 */

interface ContentItem {
  id: string;
  title: string;
  description?: string;
  category_id: string;
  category_name?: string;
  category_slug?: string;
  user_id: string;
  media_url?: string;
  thumbnail_url?: string;
  tags?: string[];
  status: 'draft' | 'published' | 'archived';
  view_count?: number;
  likes?: number;
  created_at?: string;
  updated_at?: string;
}

interface UserStats {
  total_content: number;
  published_count: number;
  draft_count: number;
  total_views: number;
  total_likes: number;
}

const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<UserStats>({
    total_content: 0,
    published_count: 0,
    draft_count: 0,
    total_views: 0,
    total_likes: 0,
  });
  const [publishedContent, setPublishedContent] = useState<ContentItem[]>([]);
  const [draftContent, setDraftContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    fetchDashboardData();
  }, [isAuthenticated, navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch stats and content in parallel
      const [statsResponse, publishedResponse, draftResponse] = await Promise.all([
        apiService.getUserStats(),
        apiService.getMyContent({ status: 'published', limit: 100 }),
        apiService.getMyContent({ status: 'draft', limit: 100 }),
      ]);

      setStats(statsResponse.data);
      setPublishedContent(publishedResponse.data.content || []);
      setDraftContent(draftResponse.data.content || []);
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (id: string) => {
    navigate(`/content/${id}`);
  };

  const handleEdit = (id: string) => {
    navigate(`/upload?edit=${id}`);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleteLoading(id);
      await apiService.deleteContent(id);

      // Remove from local state
      setPublishedContent((prev) => prev.filter((item) => item.id !== id));
      setDraftContent((prev) => prev.filter((item) => item.id !== id));

      // Refresh stats
      const statsResponse = await apiService.getUserStats();
      setStats(statsResponse.data);
    } catch (err: any) {
      console.error('Failed to delete content:', err);
      alert(err.message || 'Failed to delete content');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleUploadNew = () => {
    navigate('/upload');
  };

  const renderContentCard = (content: ContentItem) => (
    <div key={content.id} className="content-card">
      <div className="content-card-image">
        {content.thumbnail_url ? (
          <img src={content.thumbnail_url} alt={content.title} />
        ) : (
          <div className="content-card-placeholder">
            <span>No Image</span>
          </div>
        )}
      </div>
      <div className="content-card-body">
        <h3 className="content-card-title">{content.title}</h3>
        {content.description && (
          <p className="content-card-description">
            {content.description.length > 100
              ? `${content.description.substring(0, 100)}...`
              : content.description}
          </p>
        )}
        <div className="content-card-meta">
          <span className="content-card-category">{content.category_name || 'Uncategorized'}</span>
          <div className="content-card-stats">
            <span title="Views">👁 {content.view_count || 0}</span>
            <span title="Likes">❤️ {content.likes || 0}</span>
          </div>
        </div>
        <div className="content-card-actions">
          <button
            className="btn-secondary btn-small"
            onClick={() => handleView(content.id)}
            title="View"
          >
            View
          </button>
          <button
            className="btn-secondary btn-small"
            onClick={() => handleEdit(content.id)}
            title="Edit"
          >
            Edit
          </button>
          <button
            className="btn-danger btn-small"
            onClick={() => handleDelete(content.id, content.title)}
            disabled={deleteLoading === content.id}
            title="Delete"
          >
            {deleteLoading === content.id ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderEmptyState = (type: 'published' | 'draft') => (
    <div className="empty-state">
      <div className="empty-state-icon">
        {type === 'published' ? '📦' : '✏️'}
      </div>
      <h3 className="empty-state-title">
        {type === 'published' ? 'No Published Content' : 'No Drafts'}
      </h3>
      <p className="empty-state-message">
        {type === 'published'
          ? 'You haven\'t published any content yet. Start creating and sharing your heritage!'
          : 'You don\'t have any drafts. Create new content and save it as a draft to work on later.'}
      </p>
      {type === 'published' && (
        <button className="btn-primary" onClick={handleUploadNew}>
          Upload New Content
        </button>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="page-container">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="error-message">
          <h2>Failed to Load Dashboard</h2>
          <p>{error}</p>
          <button className="btn-primary" onClick={fetchDashboardData}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container dashboard">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="dashboard-header-content">
          <h1>Welcome, {user?.username}!</h1>
          <p className="dashboard-subtitle">Manage your heritage content</p>
        </div>
        <button className="btn-primary btn-upload" onClick={handleUploadNew}>
          + Upload New Content
        </button>
      </div>

      {/* Statistics Section */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.total_content}</h3>
            <p className="stat-label">Total Content</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.published_count}</h3>
            <p className="stat-label">Published</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.draft_count}</h3>
            <p className="stat-label">Drafts</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👁</div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.total_views}</h3>
            <p className="stat-label">Total Views</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">❤️</div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.total_likes}</h3>
            <p className="stat-label">Total Likes</p>
          </div>
        </div>
      </div>

      {/* Published Content Section */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Published Content</h2>
          <span className="section-count">{publishedContent.length} items</span>
        </div>
        {publishedContent.length > 0 ? (
          <div className="content-grid">
            {publishedContent.map(renderContentCard)}
          </div>
        ) : (
          renderEmptyState('published')
        )}
      </div>

      {/* Draft Content Section */}
      {draftContent.length > 0 && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Drafts</h2>
            <span className="section-count">{draftContent.length} items</span>
          </div>
          <div className="content-grid">
            {draftContent.map(renderContentCard)}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

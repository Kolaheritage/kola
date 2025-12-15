import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import './Profile.css';

/**
 * Public User Profile Page
 * HER-53: Public User Profile Page
 *
 * Features:
 * - Display user avatar, bio, join date
 * - Grid of user's published content
 * - Content count, total views statistics
 * - No private information shown
 * - 404 for non-existent users
 */

interface UserProfile {
  id: string;
  username: string;
  bio?: string;
  avatar_url?: string;
  created_at: string;
}

interface ContentItem {
  id: string;
  title: string;
  description?: string;
  media_url: string;
  thumbnail_url?: string;
  view_count: number;
  likes: number;
  created_at: string;
  category_name?: string;
}

interface UserStats {
  total_content: number;
  total_views: number;
}

const Profile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [stats, setStats] = useState<UserStats>({ total_content: 0, total_views: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const loadUserProfile = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      setNotFound(false);

      const response: any = await apiService.getUserByUsername(username!);
      const data = response.data;

      setUser(data.user);
      setContent(data.content || []);
      setStats(data.stats || { total_content: 0, total_views: 0 });
    } catch (err: any) {
      console.error('Failed to load user profile:', err);

      if (err.response?.status === 404) {
        setNotFound(true);
      } else {
        setError(err.message || 'Failed to load user profile');
      }
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    if (!username) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    loadUserProfile();
  }, [username, loadUserProfile]);

  const handleContentClick = (contentId: string) => {
    navigate(`/content/${contentId}`);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  if (loading) {
    return (
      <div className="public-profile-container">
        <div className="loading-message">Loading profile...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="public-profile-container">
        <div className="not-found-state">
          <div className="not-found-icon">👤</div>
          <h2>User Not Found</h2>
          <p>The user @{username} does not exist.</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="public-profile-container">
        <div className="error-state">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={loadUserProfile} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const renderContentCard = (item: ContentItem) => (
    <div
      key={item.id}
      className="content-card"
      onClick={() => handleContentClick(item.id)}
    >
      <div className="content-media">
        <img
          src={item.thumbnail_url || item.media_url}
          alt={item.title}
          loading="lazy"
        />
      </div>
      <div className="content-info">
        <h3 className="content-title">{item.title}</h3>
        {item.description && (
          <p className="content-description">{item.description}</p>
        )}
        <div className="content-meta">
          <span className="meta-item">
            👁️ {formatNumber(item.view_count)} views
          </span>
          <span className="meta-item">
            ❤️ {formatNumber(item.likes)} likes
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="public-profile-container">
      {/* User Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.username} />
          ) : (
            <div className="avatar-placeholder">{user.username.charAt(0).toUpperCase()}</div>
          )}
        </div>
        <div className="profile-info">
          <h1 className="profile-username">@{user.username}</h1>
          {user.bio && <p className="profile-bio">{user.bio}</p>}
          <p className="profile-joined">
            Joined {formatDate(user.created_at)}
          </p>
        </div>
      </div>

      {/* User Statistics */}
      <div className="profile-stats">
        <div className="stat-card">
          <div className="stat-value">{stats.total_content}</div>
          <div className="stat-label">Content</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{formatNumber(stats.total_views)}</div>
          <div className="stat-label">Total Views</div>
        </div>
      </div>

      {/* User Content Grid */}
      <div className="profile-content-section">
        <h2 className="section-title">Published Content</h2>

        {content.length > 0 ? (
          <div className="content-grid">
            {content.map(renderContentCard)}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No Content Yet</h3>
            <p>@{user.username} hasn't published any content.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;

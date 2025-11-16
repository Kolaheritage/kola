import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import ContentCard from './ContentCard';
import './CategoryCard.css';

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface Content {
  id: string;
  title: string;
  thumbnail_url?: string;
  media_url?: string;
  category_name?: string;
  category_icon?: string;
  username?: string;
  user_avatar?: string;
  view_count?: number;
  likes?: number;
  tags?: string[];
  created_at?: string;
}

interface CategoryCardProps {
  category: Category;
  style?: React.CSSProperties;
}

/**
 * CategoryCard Component
 * HER-31: Category Card with Rotating Content
 * Displays category with rotating random content preview
 */
const CategoryCard: React.FC<CategoryCardProps> = ({ category, style }) => {
  const [randomContent, setRandomContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const navigate = useNavigate();

  // Fetch random content for this category
  const fetchRandomContent = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await apiService.getRandomContent(category.id);
      const contentData = response.data || response;

      // Trigger fade-out transition
      setIsTransitioning(true);

      // Wait for fade-out, then update content and fade-in
      setTimeout(() => {
        setRandomContent(contentData);
        setIsTransitioning(false);
        setError(null);
      }, 300); // Match CSS transition duration

    } catch (err) {
      console.error(`Failed to load content for category ${category.id}:`, err);
      setError((err as Error).message || 'Failed to load content');
      setRandomContent(null);
    } finally {
      setLoading(false);
    }
  }, [category.id]);

  // Initial fetch
  useEffect(() => {
    fetchRandomContent();
  }, [fetchRandomContent]);

  // Auto-rotation: fetch new random content every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRandomContent();
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, [fetchRandomContent]);

  // Handle card click
  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    // Don't navigate if clicking on content card link
    if ((e.target as HTMLElement).closest('.content-card')) {
      return;
    }
    navigate(`/category/${category.id}`);
  };

  return (
    <div className="category-card-container" style={style}>
      {/* Category Header */}
      <div className="category-card-header">
        <div className="category-card-header-content">
          <span className="category-card-icon">{category.icon}</span>
          <h3 className="category-card-title">{category.name}</h3>
        </div>
        <Link
          to={`/category/${category.id}`}
          className="category-card-view-all"
        >
          View All →
        </Link>
      </div>

      {/* Content Preview Area */}
      <div
        className="category-card-content"
        onClick={handleCardClick}
      >
        {/* Loading State */}
        {loading && !randomContent && (
          <div className="category-card-loading">
            <div className="spinner-small"></div>
            <p className="loading-text">Loading...</p>
          </div>
        )}

        {/* Error State */}
        {error && !randomContent && (
          <div className="category-card-error">
            <div className="error-icon">⚠️</div>
            <p className="error-text">Failed to load content</p>
          </div>
        )}

        {/* Content Display with Transition */}
        {!loading && !error && randomContent && (
          <div className={`category-card-preview ${isTransitioning ? 'transitioning' : ''}`}>
            <ContentCard content={randomContent} />
            <div className="rotation-indicator">
              <div className="rotation-dot"></div>
            </div>
          </div>
        )}

        {/* Fallback: No Content */}
        {!loading && !error && !randomContent && (
          <div className="category-card-empty">
            <div className="empty-icon">{category.icon}</div>
            <p className="empty-text">No content yet</p>
            <p className="empty-subtext">Be the first to share!</p>
            <Link
              to="/upload"
              className="empty-cta"
              onClick={(e) => e.stopPropagation()}
            >
              Share Now →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryCard;

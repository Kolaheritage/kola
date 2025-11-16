import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import ContentCard from '../components/ContentCard';
import './CategoryPage.css';

interface Category {
  id: string;
  name: string;
  icon: string;
  description?: string;
  slug: string;
}

interface ContentItem {
  id: string;
  title: string;
  username: string;
  user_avatar?: string | null;
  media_url?: string;
  thumbnail_url?: string | null;
  category_name?: string;
  category_icon?: string;
  category_slug?: string;
  view_count?: number;
  likes?: number;
  tags?: string[];
  created_at: string;
}

interface Pagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

interface CategoryContentResponse {
  category?: Category;
  content: ContentItem[];
  pagination: Pagination;
}

type SortOption = 'recent' | 'popular' | 'most_liked' | 'oldest';

/**
 * CategoryPage Component
 * HER-32: Category Page Layout
 * Displays all content within a specific category with filtering and pagination
 */
const CategoryPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();

  const [category, setCategory] = useState<Category | null>(null);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  // Fetch content for the category
  const fetchContent = useCallback(async (loadMore: boolean = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const offset = loadMore && pagination ? pagination.offset + pagination.limit : 0;

      const response = await apiService.getContentByCategory(categoryId!, {
        limit: 20,
        offset,
        sort: sortBy,
        status: 'published'
      });

      const data: CategoryContentResponse = response.data || response;

      if (data.category) {
        setCategory(data.category);
      }

      if (loadMore) {
        // Append new content to existing
        setContent(prev => [...prev, ...(data.content || [])]);
      } else {
        // Replace content
        setContent(data.content || []);
      }

      setPagination(data.pagination);
      setError(null);

    } catch (err: any) {
      console.error('Failed to load category content:', err);
      if (err.code === 'CATEGORY_NOT_FOUND' || err.message?.includes('not found')) {
        setError('Category not found');
      } else {
        setError(err.message || 'Failed to load content');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [categoryId, sortBy, pagination]);

  // Initial load
  useEffect(() => {
    fetchContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, sortBy]); // Fetch when category or sort changes

  // Handle sort change
  const handleSortChange = (newSort: SortOption): void => {
    setSortBy(newSort);
    setContent([]); // Clear content when sorting changes
    setPagination(null);
  };

  // Handle load more
  const handleLoadMore = (): void => {
    fetchContent(true);
  };

  // Back to home
  const handleBackToHome = (): void => {
    navigate('/');
  };

  return (
    <div className="category-page">
      {/* Loading State */}
      {loading && !category && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading category...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="error-container">
          <div className="error-content">
            <div className="error-icon">⚠️</div>
            <h2>Oops! Something went wrong</h2>
            <p className="error-message">{error}</p>
            <div className="error-actions">
              <button onClick={() => fetchContent()} className="btn btn-primary">
                Try Again
              </button>
              <button onClick={handleBackToHome} className="btn btn-secondary">
                Back to Home
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Content */}
      {!loading && !error && category && (
        <>
          {/* Category Header */}
          <div className="category-header-section">
            <div className="category-header-container">
              <button onClick={handleBackToHome} className="back-button">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M19 12H5M5 12L12 19M5 12L12 5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Back to Home
              </button>

              <div className="category-info">
                <div className="category-icon-large">{category.icon}</div>
                <div className="category-details">
                  <h1 className="category-name">{category.name}</h1>
                  {category.description && (
                    <p className="category-description">{category.description}</p>
                  )}
                  {pagination && (
                    <p className="category-count">
                      {pagination.total} {pagination.total === 1 ? 'item' : 'items'}
                    </p>
                  )}
                </div>
              </div>

              {/* Sort Options */}
              <div className="sort-controls">
                <label className="sort-label">Sort by:</label>
                <div className="sort-buttons">
                  <button
                    className={`sort-btn ${sortBy === 'recent' ? 'active' : ''}`}
                    onClick={() => handleSortChange('recent')}
                  >
                    Newest
                  </button>
                  <button
                    className={`sort-btn ${sortBy === 'popular' ? 'active' : ''}`}
                    onClick={() => handleSortChange('popular')}
                  >
                    Popular
                  </button>
                  <button
                    className={`sort-btn ${sortBy === 'most_liked' ? 'active' : ''}`}
                    onClick={() => handleSortChange('most_liked')}
                  >
                    Most Liked
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="category-content-section">
            {content.length > 0 ? (
              <>
                <div className="content-grid">
                  {content.map((item, index) => (
                    <ContentCard
                      key={item.id}
                      content={item}
                      style={{ animationDelay: `${(index % 20) * 0.05}s` }}
                    />
                  ))}
                </div>

                {/* Pagination / Load More */}
                {pagination && pagination.hasMore && (
                  <div className="pagination-container">
                    <button
                      onClick={handleLoadMore}
                      className="load-more-btn"
                      disabled={loadingMore}
                    >
                      {loadingMore ? (
                        <>
                          <div className="spinner-small"></div>
                          Loading...
                        </>
                      ) : (
                        <>
                          Load More
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path
                              d="M19 9l-7 7-7-7"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </>
                      )}
                    </button>
                    <p className="pagination-info">
                      Showing {content.length} of {pagination.total}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">{category.icon}</div>
                <h3 className="empty-title">No content yet</h3>
                <p className="empty-text">
                  Be the first to share something in {category.name}!
                </p>
                <Link to="/upload" className="btn btn-primary">
                  Share Your Heritage
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CategoryPage;

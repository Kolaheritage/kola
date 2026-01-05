import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import ContentCard from '../components/ContentCard';
import './SearchResults.css';

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
  headline_title?: string;
  headline_description?: string;
  rank?: number;
}

interface Pagination {
  total: number;
  limit: number;
  offset: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

interface SearchResponse {
  query: string;
  content: ContentItem[];
  pagination: Pagination;
}

/**
 * SearchResults Component
 * HER-44: Search Functionality
 * Displays search results with pagination
 */
const SearchResults: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';

  const [content, setContent] = useState<ContentItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState<string>(query);

  // Fetch search results
  const fetchResults = useCallback(async (loadMore: boolean = false) => {
    if (!query || query.trim().length < 2) {
      setLoading(false);
      setContent([]);
      setPagination(null);
      return;
    }

    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await apiService.searchContent(query);
      const data: SearchResponse = response.data || response;

      if (loadMore) {
        setContent(prev => [...prev, ...(data.content || [])]);
      } else {
        setContent(data.content || []);
      }

      setPagination(data.pagination);
      setError(null);

    } catch (err: any) {
      console.error('Search failed:', err);
      setError(err.message || 'Search failed. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [query]);

  // Fetch on query change
  useEffect(() => {
    setSearchInput(query);
    if (query) {
      fetchResults();
    } else {
      setLoading(false);
      setContent([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Handle new search
  const handleSearch = (e: React.FormEvent): void => {
    e.preventDefault();
    const trimmedQuery = searchInput.trim();
    if (trimmedQuery.length >= 2) {
      setSearchParams({ q: trimmedQuery });
    }
  };

  // Handle load more
  const handleLoadMore = (): void => {
    fetchResults(true);
  };

  // Back to home
  const handleBackToHome = (): void => {
    navigate('/');
  };

  return (
    <div className="search-results-page">
      {/* Search Header */}
      <div className="search-header-section">
        <div className="search-header-container">
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

          {/* Search Form */}
          <form onSubmit={handleSearch} className="search-results-form">
            <div className="search-input-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="search-icon">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                className="search-results-input"
                placeholder="Search content..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                aria-label="Search content"
              />
              <button
                type="submit"
                className="search-results-submit"
                disabled={searchInput.trim().length < 2}
              >
                Search
              </button>
            </div>
          </form>

          {/* Results Count */}
          {query && pagination && !loading && (
            <div className="search-results-info">
              <h1 className="search-results-title">
                {pagination.total === 0 ? (
                  <>No results for "<span className="search-query">{query}</span>"</>
                ) : (
                  <>
                    {pagination.total} {pagination.total === 1 ? 'result' : 'results'} for "
                    <span className="search-query">{query}</span>"
                  </>
                )}
              </h1>
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Searching...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="error-container">
          <div className="error-content">
            <div className="error-icon">⚠️</div>
            <h2>Search Error</h2>
            <p className="error-message">{error}</p>
            <div className="error-actions">
              <button onClick={() => fetchResults()} className="btn btn-primary">
                Try Again
              </button>
              <button onClick={handleBackToHome} className="btn btn-secondary">
                Back to Home
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty Query State */}
      {!loading && !error && !query && (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
              <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h3 className="empty-title">Start Searching</h3>
          <p className="empty-text">
            Enter keywords above to search for content
          </p>
        </div>
      )}

      {/* No Results State */}
      {!loading && !error && query && content.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
              <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M8 8l6 6M14 8l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <h3 className="empty-title">No results found</h3>
          <p className="empty-text">
            We couldn't find any content matching "{query}".
            <br />Try different keywords or check your spelling.
          </p>
          <Link to="/" className="btn btn-primary">
            Browse All Content
          </Link>
        </div>
      )}

      {/* Search Results */}
      {!loading && !error && content.length > 0 && (
        <div className="search-content-section">
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
        </div>
      )}
    </div>
  );
};

export default SearchResults;

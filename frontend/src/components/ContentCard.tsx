import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './ContentCard.css';

interface Content {
  id: string;
  title: string;
  thumbnail_url?: string | null;
  media_url?: string | null;
  category_name?: string | null;
  category_icon?: string | null;
  username?: string | null;
  user_avatar?: string | null;
  view_count?: number | null;
  likes?: number | null;
  tags?: string[] | null;
  created_at?: string | null;
}

interface ContentCardProps {
  content: Content;
  style?: React.CSSProperties;
}

/**
 * ContentCard Component
 * HER-26: Content Card Component
 * Reusable card component for displaying content in grids
 */
const ContentCard: React.FC<ContentCardProps> = ({ content, style }) => {
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const cardRef = useRef<HTMLAnchorElement>(null);

  // Lazy loading with Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before card is visible
        threshold: 0.01
      }
    );

    const currentCard = cardRef.current;
    if (currentCard) {
      observer.observe(currentCard);
    }

    return () => {
      if (currentCard) {
        observer.unobserve(currentCard);
      }
    };
  }, []);

  // Handle image load
  const handleImageLoad = (): void => {
    setImageLoaded(true);
  };

  // Handle image error
  const handleImageError = (): void => {
    setImageError(true);
    setImageLoaded(true);
  };

  // Format view count for display
  const formatCount = (count: number | undefined): string => {
    if (!count) return '0';
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  // Get thumbnail or media URL with fallback
  const getImageUrl = (): string | null => {
    if (imageError) {
      return null;
    }
    return content.thumbnail_url || content.media_url || null;
  };

  // Determine if content is video
  const isVideo = (): boolean => {
    const mediaUrl = content.media_url || '';
    return !!mediaUrl.match(/\.(mp4|webm|mov)$/i);
  };

  const imageUrl = getImageUrl();

  return (
    <Link
      to={`/content/${content.id}`}
      className="content-card"
      ref={cardRef}
      style={style}
    >
      <div className="content-card-thumbnail">
        {/* Lazy load image only when visible */}
        {isVisible ? (
          <>
            {imageUrl && !imageError ? (
              <>
                <img
                  src={imageUrl}
                  alt={content.title}
                  className={`content-card-image ${imageLoaded ? 'loaded' : ''}`}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  loading="lazy"
                />
                {!imageLoaded && (
                  <div className="content-card-skeleton">
                    <div className="skeleton-shimmer"></div>
                  </div>
                )}
              </>
            ) : (
              <div className="content-card-fallback">
                <div className="fallback-icon">
                  {isVideo() ? '🎥' : '🖼️'}
                </div>
                <div className="fallback-text">
                  {content.category_name || 'Content'}
                </div>
              </div>
            )}
            {/* Video indicator */}
            {isVideo() && (
              <div className="video-indicator">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8 5v14l11-7L8 5z"
                    fill="currentColor"
                  />
                </svg>
              </div>
            )}
            {/* Category badge */}
            {content.category_name && (
              <div className="category-badge">
                {content.category_icon && (
                  <span className="category-icon">{content.category_icon}</span>
                )}
                <span className="category-name">{content.category_name}</span>
              </div>
            )}
          </>
        ) : (
          <div className="content-card-skeleton">
            <div className="skeleton-shimmer"></div>
          </div>
        )}
      </div>

      <div className="content-card-body">
        <h3 className="content-card-title">{content.title}</h3>

        <div className="content-card-creator">
          <div className="creator-avatar">
            {content.user_avatar ? (
              <img src={content.user_avatar} alt={content.username || 'User'} />
            ) : (
              <div className="avatar-placeholder">
                {content.username?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <span className="creator-name">{content.username || 'Anonymous'}</span>
        </div>

        <div className="content-card-stats">
          <div className="stat-item">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
                fill="currentColor"
              />
            </svg>
            <span>{formatCount(content.view_count || 0)}</span>
          </div>

          <div className="stat-item">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                fill="currentColor"
              />
            </svg>
            <span>{formatCount(content.likes || 0)}</span>
          </div>

          {content.tags && content.tags.length > 0 && (
            <div className="stat-item tags-indicator">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"
                  fill="currentColor"
                />
              </svg>
              <span>{content.tags.length}</span>
            </div>
          )}
        </div>

        {/* Tags preview (first 2 tags) */}
        {content.tags && content.tags.length > 0 && (
          <div className="content-card-tags">
            {content.tags.slice(0, 2).map((tag, index) => (
              <span key={index} className="tag-chip">
                {tag}
              </span>
            ))}
            {content.tags.length > 2 && (
              <span className="tag-more">+{content.tags.length - 2}</span>
            )}
          </div>
        )}

        {/* Timestamp */}
        {content.created_at && (
          <div className="content-card-time">
            {formatTimeAgo(content.created_at)}
          </div>
        )}
      </div>
    </Link>
  );
};

/**
 * Format timestamp to relative time (e.g., "2 hours ago")
 */
const formatTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const past = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} ${diffInWeeks === 1 ? 'week' : 'weeks'} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'} ago`;
};

export default ContentCard;

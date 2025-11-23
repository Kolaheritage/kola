import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import ContentCard from '../components/ContentCard';
import VideoPlayer from '../components/VideoPlayer';
import './ContentDetail.css';

/**
 * Content interfaces
 */
interface ContentWithDetails {
  id: string;
  title: string;
  description?: string;
  category_id: string;
  user_id: string;
  media_url?: string;
  thumbnail_url?: string;
  tags?: string[];
  status: 'draft' | 'published' | 'archived';
  view_count: number;
  likes: number;
  created_at: string;
  updated_at?: string;
  username?: string;
  user_avatar?: string;
  user_email?: string;
  category_name?: string;
  category_slug?: string;
  category_icon?: string;
}

interface Comment {
  id: string;
  content_id: string;
  user_id: string;
  text: string;
  created_at: string;
  username?: string;
  user_avatar?: string;
}

interface RelatedContent {
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

/**
 * ContentDetail Page Component
 * HER-40: Content Detail Page
 * Displays individual content with full details and media player
 */
const ContentDetail: React.FC = () => {
  const { contentId } = useParams<{ contentId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Content state
  const [content, setContent] = useState<ContentWithDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Media state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const mediaContainerRef = useRef<HTMLDivElement>(null);

  // Like state
  const [liked, setLiked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [likeLoading, setLikeLoading] = useState<boolean>(false);

  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState<boolean>(false);
  const [newComment, setNewComment] = useState<string>('');
  const [commentSubmitting, setCommentSubmitting] = useState<boolean>(false);

  // Related content state
  const [relatedContent, setRelatedContent] = useState<RelatedContent[]>([]);
  const [relatedLoading, setRelatedLoading] = useState<boolean>(false);

  // Share state
  const [showShareMenu, setShowShareMenu] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  /**
   * Determine if content is video
   */
  const isVideo = useCallback((): boolean => {
    const mediaUrl = content?.media_url || '';
    return !!mediaUrl.match(/\.(mp4|webm|mov|avi|mkv)$/i);
  }, [content?.media_url]);

  /**
   * Format count for display (1K, 1M, etc.)
   */
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

  /**
   * Format date for display
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  /**
   * Format relative time
   */
  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks} ${diffInWeeks === 1 ? 'week' : 'weeks'} ago`;
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'} ago`;
  };

  /**
   * Fetch content details
   */
  useEffect(() => {
    const fetchContent = async () => {
      if (!contentId) return;

      setLoading(true);
      setError(null);

      try {
        const response: any = await apiService.getContent(contentId);
        const contentData = response.data?.content || response.content || response.data;

        if (contentData) {
          setContent(contentData);
          setLikeCount(contentData.likes || 0);
        } else {
          setError('Content not found');
        }
      } catch (err: any) {
        console.error('Error fetching content:', err);
        setError(err.error?.message || err.message || 'Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [contentId]);

  /**
   * Fetch like status for authenticated users
   */
  useEffect(() => {
    const fetchLikeStatus = async () => {
      if (!contentId || !isAuthenticated) return;

      try {
        const response: any = await apiService.checkLikeStatus(contentId);
        const data = response.data || response;
        setLiked(data.liked || false);
      } catch (err) {
        // Silently fail - user might not have liked yet
        console.error('Error checking like status:', err);
      }
    };

    fetchLikeStatus();
  }, [contentId, isAuthenticated]);

  /**
   * Fetch comments
   */
  useEffect(() => {
    const fetchComments = async () => {
      if (!contentId) return;

      setCommentsLoading(true);

      try {
        const response: any = await apiService.getComments(contentId);
        const commentsData = response.data?.comments || response.comments || [];
        setComments(commentsData);
      } catch (err) {
        console.error('Error fetching comments:', err);
      } finally {
        setCommentsLoading(false);
      }
    };

    fetchComments();
  }, [contentId]);

  /**
   * Fetch related content
   */
  useEffect(() => {
    const fetchRelatedContent = async () => {
      if (!content?.category_id) return;

      setRelatedLoading(true);

      try {
        const response: any = await apiService.getContentByCategory(content.category_id, {
          limit: 6,
          sort: 'popular'
        });
        const contentList = response.data?.content || response.content || [];
        // Filter out current content
        const filtered = contentList.filter((item: RelatedContent) => item.id !== contentId);
        setRelatedContent(filtered.slice(0, 4));
      } catch (err) {
        console.error('Error fetching related content:', err);
      } finally {
        setRelatedLoading(false);
      }
    };

    fetchRelatedContent();
  }, [content?.category_id, contentId]);

  /**
   * Handle like toggle
   */
  const handleLike = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/content/${contentId}` } });
      return;
    }

    if (likeLoading) return;

    setLikeLoading(true);

    // Optimistic update
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount(prev => wasLiked ? prev - 1 : prev + 1);

    try {
      const response: any = await apiService.likeContent(contentId!);
      const data = response.data || response;
      // Use server response to ensure consistency
      setLiked(data.liked);
      setLikeCount(data.likeCount);
    } catch (err) {
      // Revert optimistic update on error
      setLiked(wasLiked);
      setLikeCount(prev => wasLiked ? prev + 1 : prev - 1);
      console.error('Error toggling like:', err);
    } finally {
      setLikeLoading(false);
    }
  };

  /**
   * Handle comment submit
   */
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/content/${contentId}` } });
      return;
    }

    if (!newComment.trim() || commentSubmitting) return;

    setCommentSubmitting(true);

    try {
      const response: any = await apiService.createComment(contentId!, { text: newComment.trim() });
      const newCommentData = response.data?.comment || response.comment;

      if (newCommentData) {
        setComments(prev => [newCommentData, ...prev]);
        setNewComment('');
      }
    } catch (err) {
      console.error('Error posting comment:', err);
    } finally {
      setCommentSubmitting(false);
    }
  };

  /**
   * Handle comment delete
   */
  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await apiService.deleteComment(contentId!, commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  /**
   * Toggle fullscreen
   */
  const toggleFullscreen = async () => {
    if (!mediaContainerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await mediaContainerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  /**
   * Handle share
   */
  const handleShare = async (platform?: string) => {
    const shareUrl = window.location.href;
    const shareTitle = content?.title || 'Check out this content';
    const shareText = content?.description || '';

    if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
    } else if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    }

    setShowShareMenu(false);
  };

  /**
   * Listen for fullscreen changes
   */
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  /**
   * Handle back navigation
   */
  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="content-detail-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading content...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !content) {
    return (
      <div className="content-detail-page">
        <div className="error-container">
          <div className="error-content">
            <div className="error-icon">😔</div>
            <h2>Oops! Something went wrong</h2>
            <p className="error-message">{error || 'Content not found'}</p>
            <div className="error-actions">
              <button className="btn btn-primary" onClick={handleBack}>
                Go Back
              </button>
              <Link to="/" className="btn btn-secondary">
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content-detail-page">
      {/* Header with back button */}
      <div className="content-header-section">
        <div className="content-header-container">
          <button className="back-button" onClick={handleBack}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>

          {/* Category breadcrumb */}
          {content.category_name && (
            <Link to={`/category/${content.category_id}`} className="category-breadcrumb">
              {content.category_icon && <span className="category-icon">{content.category_icon}</span>}
              <span>{content.category_name}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className="content-main">
        <div className="content-layout">
          {/* Left column - Media and details */}
          <div className="content-primary">
            {/* Media player/viewer */}
            {isVideo() ? (
              <VideoPlayer
                src={content.media_url!}
                poster={content.thumbnail_url}
                title={content.title}
              />
            ) : (
              <div
                className={`media-container ${isFullscreen ? 'fullscreen' : ''}`}
                ref={mediaContainerRef}
              >
                <div className="image-viewer">
                  <img
                    src={content.media_url || content.thumbnail_url}
                    alt={content.title}
                    className="image-element"
                    onClick={toggleFullscreen}
                  />
                  <button
                    className="fullscreen-btn"
                    onClick={toggleFullscreen}
                    title={isFullscreen ? 'Exit fullscreen' : 'View fullscreen'}
                  >
                    {isFullscreen ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Content metadata */}
            <div className="content-info">
              <h1 className="content-title">{content.title}</h1>

              {/* Stats row */}
              <div className="content-stats">
                <span className="stat-item">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor"/>
                  </svg>
                  {formatCount(content.view_count)} views
                </span>
                <span className="stat-separator">•</span>
                <span className="stat-item">
                  {formatDate(content.created_at)}
                </span>
              </div>

              {/* Action buttons */}
              <div className="content-actions">
                <button
                  className={`action-btn like-btn ${liked ? 'liked' : ''}`}
                  onClick={handleLike}
                  disabled={likeLoading}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <span>{formatCount(likeCount)}</span>
                </button>

                <div className="share-container">
                  <button
                    className="action-btn share-btn"
                    onClick={() => setShowShareMenu(!showShareMenu)}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Share</span>
                  </button>

                  {showShareMenu && (
                    <div className="share-menu">
                      <button onClick={() => handleShare('copy')} className="share-option">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        {copied ? 'Copied!' : 'Copy Link'}
                      </button>
                      <button onClick={() => handleShare('twitter')} className="share-option">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        Twitter
                      </button>
                      <button onClick={() => handleShare('facebook')} className="share-option">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        Facebook
                      </button>
                      <button onClick={() => handleShare('linkedin')} className="share-option">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                        LinkedIn
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Creator info */}
              <div className="creator-section">
                <Link to={`/profile/${content.username}`} className="creator-info">
                  <div className="creator-avatar">
                    {content.user_avatar ? (
                      <img src={content.user_avatar} alt={content.username || 'Creator'} />
                    ) : (
                      <div className="avatar-placeholder">
                        {content.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                  <div className="creator-details">
                    <span className="creator-name">{content.username || 'Anonymous'}</span>
                    <span className="creator-label">Creator</span>
                  </div>
                </Link>
              </div>

              {/* Description */}
              {content.description && (
                <div className="content-description">
                  <h3>Description</h3>
                  <p>{content.description}</p>
                </div>
              )}

              {/* Tags */}
              {content.tags && content.tags.length > 0 && (
                <div className="content-tags">
                  {content.tags.map((tag, index) => (
                    <span key={index} className="tag-chip">{tag}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Comments section */}
            <div className="comments-section">
              <h3 className="section-title">
                Comments ({comments.length})
              </h3>

              {/* Comment form */}
              <form className="comment-form" onSubmit={handleCommentSubmit}>
                <div className="comment-input-wrapper">
                  {isAuthenticated ? (
                    <>
                      <div className="comment-avatar">
                        {user?.avatar_url ? (
                          <img src={user.avatar_url} alt={user.username} />
                        ) : (
                          <div className="avatar-placeholder">
                            {user?.username?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                      </div>
                      <textarea
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={2}
                        className="comment-input"
                      />
                    </>
                  ) : (
                    <div className="login-prompt">
                      <Link to="/login" state={{ from: `/content/${contentId}` }}>
                        Log in to comment
                      </Link>
                    </div>
                  )}
                </div>
                {isAuthenticated && newComment.trim() && (
                  <button
                    type="submit"
                    className="btn btn-primary comment-submit"
                    disabled={commentSubmitting}
                  >
                    {commentSubmitting ? 'Posting...' : 'Post Comment'}
                  </button>
                )}
              </form>

              {/* Comments list */}
              <div className="comments-list">
                {commentsLoading ? (
                  <div className="comments-loading">
                    <div className="spinner-small"></div>
                    <span>Loading comments...</span>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="no-comments">
                    <p>No comments yet. Be the first to comment!</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="comment-item">
                      <div className="comment-avatar">
                        {comment.user_avatar ? (
                          <img src={comment.user_avatar} alt={comment.username || 'User'} />
                        ) : (
                          <div className="avatar-placeholder">
                            {comment.username?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                      </div>
                      <div className="comment-content">
                        <div className="comment-header">
                          <Link to={`/profile/${comment.username}`} className="comment-author">
                            {comment.username || 'Anonymous'}
                          </Link>
                          <span className="comment-time">{formatTimeAgo(comment.created_at)}</span>
                        </div>
                        <p className="comment-text">{comment.text}</p>
                        {user?.id === comment.user_id && (
                          <button
                            className="comment-delete"
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right column - Related content */}
          <div className="content-sidebar">
            <div className="related-section">
              <h3 className="section-title">Related Content</h3>

              {relatedLoading ? (
                <div className="related-loading">
                  <div className="spinner-small"></div>
                </div>
              ) : relatedContent.length === 0 ? (
                <div className="no-related">
                  <p>No related content found</p>
                </div>
              ) : (
                <div className="related-grid">
                  {relatedContent.map((item) => (
                    <ContentCard key={item.id} content={item} />
                  ))}
                </div>
              )}

              {content.category_name && (
                <Link
                  to={`/category/${content.category_id}`}
                  className="view-more-link"
                >
                  View more in {content.category_name}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentDetail;

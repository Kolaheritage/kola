import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../services/api';
import ContentCard from '../components/ContentCard';
import './Home.css';

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [randomContent, setRandomContent] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contentLoading, setContentLoading] = useState({});

  const fetchAllRandomContent = useCallback(async (categoriesToFetch) => {
    const contentPromises = categoriesToFetch.map(async (category) => {
      setContentLoading(prev => ({ ...prev, [category.id]: true }));
      try {
        const response = await apiService.getRandomContent(category.id);
        const contentData = response.data || response;
        return { categoryId: category.id, content: contentData };
      } catch (err) {
        console.error(`Failed to load content for category ${category.id}:`, err);
        return { categoryId: category.id, content: null };
      } finally {
        setContentLoading(prev => ({ ...prev, [category.id]: false }));
      }
    });

    const results = await Promise.all(contentPromises);
    const contentMap = {};
    results.forEach(({ categoryId, content }) => {
      if (content) {
        contentMap[categoryId] = content;
      }
    });
    setRandomContent(contentMap);
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getCategories();
      const categoriesData = response.data || response;
      setCategories(categoriesData);

      // Fetch random content for each category
      if (categoriesData && categoriesData.length > 0) {
        fetchAllRandomContent(categoriesData);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
      setError(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, [fetchAllRandomContent]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Rotation mechanism - refresh random content every 30 seconds
  useEffect(() => {
    if (categories.length === 0) return;

    const interval = setInterval(() => {
      fetchAllRandomContent(categories);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [categories, fetchAllRandomContent]);

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">Your Heritage Is Your Content</h1>
          <p className="hero-subtitle">
            Share rituals, dances, music, recipes, or stories. Remix others'. 
            Collaborate with elders. Everything you post builds a living archive—and your creative legacy.
          </p>
          <div className="hero-actions">
            <Link to="/upload" className="btn btn-primary btn-large">
              Share Your Heritage
            </Link>
            <Link to="/explore" className="btn btn-secondary btn-large">
              Explore Content
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <h2 className="section-title">Explore Categories</h2>

        {loading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading categories...</p>
          </div>
        )}

        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={fetchCategories} className="btn btn-primary">
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="categories-grid">
            {categories.map((category) => (
              <div key={category.id} className="category-section">
                <div className="category-header">
                  <div className="category-header-content">
                    <span className="category-icon-large">{category.icon}</span>
                    <h3 className="category-title">{category.name}</h3>
                  </div>
                  <Link
                    to={`/category/${category.id}`}
                    className="category-view-all"
                  >
                    View All →
                  </Link>
                </div>

                <div className="category-content-preview">
                  {contentLoading[category.id] && (
                    <div className="content-loading">
                      <div className="spinner-small"></div>
                    </div>
                  )}

                  {!contentLoading[category.id] && randomContent[category.id] && (
                    <ContentCard content={randomContent[category.id]} />
                  )}

                  {!contentLoading[category.id] && !randomContent[category.id] && (
                    <Link
                      to={`/category/${category.id}`}
                      className="no-content-placeholder"
                    >
                      <div className="placeholder-icon">{category.icon}</div>
                      <p className="placeholder-text">No content yet</p>
                      <p className="placeholder-subtext">Be the first to share!</p>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">Why Share Your Heritage?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>Easy to Share</h3>
            <p>Upload videos, images, and audio with just a few clicks</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🤝</div>
            <h3>Collaborate</h3>
            <p>Work with elders and community members to preserve traditions</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">♻️</div>
            <h3>Remix & Create</h3>
            <p>Build upon others' content while giving proper credit</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🏛️</div>
            <h3>Living Archive</h3>
            <p>Your content becomes part of a permanent cultural record</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
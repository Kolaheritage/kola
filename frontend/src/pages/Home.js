import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../services/api';
import './Home.css';

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      // Will be implemented when backend is ready
      // const data = await apiService.getCategories();
      // setCategories(data);
      
      // Mock data for now
      setCategories([
        { id: 1, name: 'Rituals', icon: '🕯️' },
        { id: 2, name: 'Dance', icon: '💃' },
        { id: 3, name: 'Music', icon: '🎵' },
        { id: 4, name: 'Recipes', icon: '🍲' },
        { id: 5, name: 'Stories', icon: '📖' },
        { id: 6, name: 'Crafts', icon: '🎨' }
      ]);
    } catch (err) {
      setError(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

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
        
        {loading && <p>Loading categories...</p>}
        {error && <p className="error-message">{error}</p>}
        
        {!loading && !error && (
          <div className="categories-grid">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/category/${category.id}`}
                className="category-card"
              >
                <div className="category-icon">{category.icon}</div>
                <h3 className="category-name">{category.name}</h3>
                {/* Random content preview will be added later */}
                <div className="category-preview">
                  <div className="preview-placeholder">
                    Explore {category.name}
                  </div>
                </div>
              </Link>
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
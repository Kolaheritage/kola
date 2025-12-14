import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../services/api';
import CategoryCard from '../components/CategoryCard';
import './Home.css';

interface Category {
  id: string;
  name: string;
  icon: string;
  description?: string;
  slug: string;
}

const Home: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getCategories();
      // Handle both possible response structures
      const data = response.data || response;
      const categoriesData: Category[] = Array.isArray(data) ? data : (data.categories || []);
      setCategories(categoriesData);
    } catch (err: any) {
      console.error('Failed to load categories:', err);
      setError(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

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
            <Link to="/upload" className="btn btn-accent btn-large">
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
            {categories.map((category, index) => (
              <CategoryCard
                key={category.id}
                category={category}
                style={{ animationDelay: `${index * 0.1}s` }}
              />
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

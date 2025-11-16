import React from 'react';
import ContentCard from '../components/ContentCard';
import './ContentCardDemo.css';

/**
 * ContentCard Demo Page
 * HER-26: Demonstrates ContentCard component usage
 */
const ContentCardDemo = () => {
  // Sample content data for demonstration
  const sampleContent = [
    {
      id: '1',
      title: 'Traditional Yoruba Wedding Ceremony',
      username: 'heritage_keeper',
      user_avatar: null, // Will show fallback
      media_url: '/media/sample-video.mp4',
      thumbnail_url: '/thumbnails/wedding.jpg',
      category_name: 'Rituals',
      category_icon: '🕯️',
      category_slug: 'rituals',
      view_count: 15420,
      likes: 892,
      tags: ['yoruba', 'wedding', 'ceremony', 'traditional'],
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
    },
    {
      id: '2',
      title: 'Eyo Festival Dance Performance',
      username: 'lagos_cultural',
      user_avatar: null,
      media_url: '/media/eyo-dance.mp4',
      thumbnail_url: null, // Will show fallback
      category_name: 'Dance',
      category_icon: '💃',
      category_slug: 'dance',
      view_count: 8750,
      likes: 543,
      tags: ['eyo', 'lagos', 'festival'],
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
    },
    {
      id: '3',
      title: 'How to Make Authentic Jollof Rice',
      username: 'chef_mama',
      user_avatar: null,
      media_url: '/media/jollof.mp4',
      thumbnail_url: '/thumbnails/jollof.jpg',
      category_name: 'Recipes',
      category_icon: '🍲',
      category_slug: 'recipes',
      view_count: 52300,
      likes: 3421,
      tags: ['jollof', 'recipe', 'cooking'],
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
    },
    {
      id: '4',
      title: 'The Legend of Sango - Thunder God',
      username: 'story_teller',
      user_avatar: null,
      media_url: '/media/sango-story.mp4',
      thumbnail_url: '/thumbnails/sango.jpg',
      category_name: 'Stories',
      category_icon: '📖',
      category_slug: 'stories',
      view_count: 12890,
      likes: 765,
      tags: ['mythology', 'sango', 'yoruba', 'legend'],
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 1 week ago
    },
    {
      id: '5',
      title: 'Traditional Talking Drum Tutorial',
      username: 'drum_master',
      user_avatar: null,
      media_url: '/media/talking-drum.mp4',
      thumbnail_url: '/thumbnails/drum.jpg',
      category_name: 'Music',
      category_icon: '🥁',
      category_slug: 'music',
      view_count: 9340,
      likes: 612,
      tags: ['drum', 'music', 'tutorial', 'traditional'],
      created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() // 2 weeks ago
    },
    {
      id: '6',
      title: 'Adire Cloth Making Process',
      username: 'craft_artist',
      user_avatar: null,
      media_url: '/media/adire.mp4',
      thumbnail_url: '/thumbnails/adire.jpg',
      category_name: 'Crafts',
      category_icon: '🎨',
      category_slug: 'crafts',
      view_count: 6720,
      likes: 423,
      tags: ['adire', 'textile', 'craft', 'yoruba'],
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 1 month ago
    },
    {
      id: '7',
      title: 'Minimal Content Example',
      username: 'test_user',
      created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year ago
    },
    {
      id: '8',
      title: 'Content with Many Tags to Test Overflow',
      username: 'tagger',
      user_avatar: null,
      category_name: 'Dance',
      category_icon: '💃',
      tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6', 'tag7'],
      view_count: 100,
      likes: 5,
      created_at: new Date().toISOString() // Just now
    }
  ];

  return (
    <div className="demo-page">
      <div className="demo-header">
        <h1>ContentCard Component Demo</h1>
        <p className="demo-subtitle">
          HER-26: Interactive demonstration of the ContentCard component
        </p>
        <div className="demo-info">
          <div className="info-badge">
            <span className="badge-label">Features:</span>
            <span className="badge-value">
              Lazy Loading • Hover Effects • Responsive • Fallbacks
            </span>
          </div>
        </div>
      </div>

      <div className="demo-section">
        <h2>Standard Grid Layout</h2>
        <p className="section-description">
          Cards displayed in a responsive grid that adapts to screen size
        </p>
        <div className="content-grid">
          {sampleContent.map((content) => (
            <ContentCard key={content.id} content={content} />
          ))}
        </div>
      </div>

      <div className="demo-section">
        <h2>Single Card Examples</h2>

        <div className="example-row">
          <div className="example-card">
            <h3>With All Features</h3>
            <ContentCard content={sampleContent[0]} />
          </div>

          <div className="example-card">
            <h3>Without Thumbnail (Fallback)</h3>
            <ContentCard content={sampleContent[1]} />
          </div>

          <div className="example-card">
            <h3>Minimal Data</h3>
            <ContentCard content={sampleContent[6]} />
          </div>
        </div>
      </div>

      <div className="demo-section">
        <h2>Category Examples</h2>
        <div className="content-grid">
          {sampleContent.slice(0, 6).map((content) => (
            <ContentCard key={content.id} content={content} />
          ))}
        </div>
      </div>

      <div className="demo-footer">
        <p>
          Scroll to see lazy loading in action. Hover over cards to see animations.
          Click cards to navigate to content detail pages.
        </p>
        <div className="demo-stats">
          <div className="stat">
            <strong>{sampleContent.length}</strong>
            <span>Sample Cards</span>
          </div>
          <div className="stat">
            <strong>6</strong>
            <span>Categories</span>
          </div>
          <div className="stat">
            <strong>100%</strong>
            <span>Responsive</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentCardDemo;

# ContentCard Component

## HER-26: Content Card Component

A reusable, responsive content card component for displaying content in grids throughout the Heritage Platform.

## Features

- ✅ **Lazy Loading**: Images load only when visible using Intersection Observer API
- ✅ **Responsive Design**: Adapts to all screen sizes (desktop, tablet, mobile)
- ✅ **Hover Effects**: Smooth animations and visual feedback
- ✅ **Fallback Images**: Graceful handling of missing images
- ✅ **Video Indicator**: Shows play icon for video content
- ✅ **Category Badge**: Displays content category with icon
- ✅ **Metadata Display**: Shows title, creator, views, likes, tags
- ✅ **Time Display**: Relative timestamps (e.g., "2 hours ago")
- ✅ **Accessibility**: Keyboard navigation and focus states
- ✅ **Performance**: Optimized rendering with lazy loading

## Usage

### Basic Usage

```jsx
import ContentCard from '../components/ContentCard';

function HomePage() {
  const content = {
    id: '123',
    title: 'Traditional Yoruba Dance',
    username: 'john_doe',
    user_avatar: '/avatars/john.jpg',
    media_url: '/media/dance-video.mp4',
    thumbnail_url: '/thumbnails/dance-thumb.jpg',
    category_name: 'Dance',
    category_icon: '💃',
    view_count: 1250,
    likes: 89,
    tags: ['yoruba', 'traditional', 'culture'],
    created_at: '2025-11-15T10:30:00Z'
  };

  return (
    <div>
      <ContentCard content={content} />
    </div>
  );
}
```

### Grid Layout

```jsx
import ContentCard from '../components/ContentCard';

function ContentGrid({ contentList }) {
  return (
    <div className="content-grid">
      {contentList.map((content) => (
        <ContentCard key={content.id} content={content} />
      ))}
    </div>
  );
}
```

### With API Data

```jsx
import { useState, useEffect } from 'react';
import ContentCard from '../components/ContentCard';
import apiService from '../services/api';

function CategoryPage() {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const response = await apiService.getRandomContent();
        if (response.success) {
          setContent(response.data.content);
        }
      } catch (error) {
        console.error('Failed to load content:', error);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="content-grid">
      {content.map((item) => (
        <ContentCard key={item.id} content={item} />
      ))}
    </div>
  );
}
```

## Props

The `ContentCard` component accepts a single `content` prop with the following structure:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | ✅ | Unique content ID |
| `title` | string | ✅ | Content title |
| `username` | string | ✅ | Creator username |
| `user_avatar` | string | ❌ | Creator avatar URL |
| `media_url` | string | ❌ | Content media URL |
| `thumbnail_url` | string | ❌ | Thumbnail image URL |
| `category_name` | string | ❌ | Category name |
| `category_icon` | string | ❌ | Category emoji/icon |
| `category_slug` | string | ❌ | Category slug |
| `view_count` | number | ❌ | Number of views |
| `likes` | number | ❌ | Number of likes |
| `tags` | array | ❌ | Array of tag strings |
| `created_at` | string | ❌ | ISO timestamp |

## Styling

The component uses `ContentCard.css` with the following CSS custom properties that can be overridden:

```css
/* Override default styles */
.content-card {
  --card-border-radius: 12px;
  --card-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  --card-hover-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  --card-transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

## Responsive Breakpoints

- **Desktop**: `> 768px` - Full features, hover effects
- **Tablet**: `481px - 768px` - Optimized spacing, smaller elements
- **Mobile**: `≤ 480px` - Single column, adjusted aspect ratio

## Performance

### Lazy Loading
Images are lazy-loaded using the Intersection Observer API:
- Loads images 50px before they enter the viewport
- Reduces initial page load time
- Improves performance for long content lists

### Optimization Tips
1. Always provide `thumbnail_url` for faster loading
2. Use optimized image formats (WebP, JPEG)
3. Implement pagination or infinite scroll for large datasets
4. Use the `loading="lazy"` attribute (built-in)

## Accessibility

- Semantic HTML structure
- Keyboard navigation support
- Focus indicators for keyboard users
- Alt text for images
- ARIA labels where appropriate

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari 12+, Chrome Android

## Examples

### Without Thumbnail
```jsx
<ContentCard content={{
  id: '1',
  title: 'Story Title',
  username: 'user123',
  media_url: '/media/video.mp4',
  // No thumbnail - will show fallback
  category_name: 'Stories',
  category_icon: '📖'
}} />
```

### Minimal Data
```jsx
<ContentCard content={{
  id: '2',
  title: 'Minimal Content',
  username: 'anonymous'
  // Everything else is optional
}} />
```

### Full Featured
```jsx
<ContentCard content={{
  id: '3',
  title: 'Complete Content Card Example',
  username: 'heritage_keeper',
  user_avatar: '/avatars/user.jpg',
  media_url: '/media/ritual.mp4',
  thumbnail_url: '/thumbnails/ritual.jpg',
  category_name: 'Rituals',
  category_icon: '🕯️',
  category_slug: 'rituals',
  view_count: 5420,
  likes: 342,
  tags: ['traditional', 'yoruba', 'ceremony'],
  created_at: '2025-11-10T08:00:00Z'
}} />
```

## Notes

- Card automatically links to `/content/:id` on click
- Video content shows a play icon indicator
- Numbers format automatically (1.2K, 1.5M, etc.)
- Timestamps show relative time (e.g., "2 hours ago")
- Missing avatars show user's first letter
- Failed image loads show category-based fallback

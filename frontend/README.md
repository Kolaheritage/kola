# Heritage Platform - Frontend

React frontend for the Heritage Content Platform.

## Tech Stack

- **Framework**: React 18
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Styling**: CSS3 (custom)
- **Build Tool**: Create React App

## Project Structure

```
frontend/
├── public/
│   └── index.html          # HTML template
├── src/
│   ├── components/         # Reusable components
│   │   └── layout/
│   │       ├── Layout.js   # Main layout wrapper
│   │       ├── Layout.css
│   │       ├── Header.js   # Navigation header
│   │       ├── Header.css
│   │       ├── Footer.js   # Footer component
│   │       └── Footer.css
│   ├── pages/              # Page components
│   │   ├── Home.js         # Home page with categories
│   │   ├── Home.css
│   │   ├── Login.js        # Login form
│   │   ├── Register.js     # Registration form
│   │   ├── Auth.css        # Auth pages styling
│   │   ├── Dashboard.js    # User dashboard
│   │   ├── CategoryPage.js # Category content grid
│   │   ├── ContentDetail.js# Content detail view
│   │   ├── Upload.js       # Content upload form
│   │   ├── Profile.js      # User profile
│   │   └── NotFound.js     # 404 page
│   ├── services/           # API services
│   │   └── api.js          # API calls & axios config
│   ├── hooks/              # Custom hooks (to be added)
│   ├── utils/              # Utility functions (to be added)
│   ├── App.js              # Main app with routing
│   ├── App.css
│   ├── index.js            # App entry point
│   └── index.css           # Global styles
├── Dockerfile
├── package.json
└── README.md
```

## Features

### Implemented ✅
- React Router with public and protected routes
- Responsive layout with header and footer
- API service with Axios interceptors
- Authentication flow (UI only - backend pending)
- Home page with hero and categories
- Login and Register pages
- Placeholder pages for all main routes
- Global styling with CSS variables
- Mobile-responsive design

### To Be Implemented 🔄
- Authentication Context (HER-15)
- Protected route components
- Content upload form (HER-25)
- Category page with content grid (HER-32)
- Content detail page with player (HER-40)
- User dashboard (HER-50)
- Profile page (HER-53)
- Search functionality (HER-44)
- Comments system (HER-70)

## Getting Started

### Prerequisites
- Node.js 18+
- Docker (if using Docker Compose)

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm start

# Runs on http://localhost:3000
```

With Docker Compose (recommended):
```bash
# From project root
docker-compose up frontend
```

### Build

```bash
# Create production build
npm run build

# Output in build/ directory
```

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm test -- --watch
```

## API Integration

### Configuration

The API base URL is configured via:
1. Environment variable: `REACT_APP_API_URL`
2. Proxy in package.json (development): `http://backend:5000`

### API Service

All API calls go through `src/services/api.js`:

```javascript
import apiService from './services/api';

// Authentication
await apiService.login({ email, password });
await apiService.register({ email, username, password });

// Content
await apiService.getContent(id);
await apiService.createContent(data);
await apiService.getContentByCategory(categoryId);

// Categories
await apiService.getCategories();
```

### Interceptors

**Request Interceptor:**
- Automatically adds JWT token to Authorization header
- Reads token from localStorage

**Response Interceptor:**
- Handles 401 (unauthorized) - clears token and redirects to login
- Standardizes error responses
- Handles network errors

## Routing

### Public Routes
- `/` - Home page
- `/login` - Login page
- `/register` - Registration page
- `/category/:categoryId` - Category page
- `/content/:contentId` - Content detail page

### Protected Routes
- `/dashboard` - User dashboard
- `/upload` - Upload content
- `/profile/:username` - User profile

## Styling

### CSS Variables

Defined in `src/index.css`:
```css
--primary-color: #6366f1;
--text-color: #1e293b;
--bg-color: #ffffff;
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
```

### Component Styles

Each component has its own CSS file for encapsulation:
- Layout components: `components/layout/*.css`
- Pages: `pages/*.css`
- Global styles: `index.css`

### Responsive Design

Mobile-first approach with breakpoints:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## Components

### Layout Components

**Layout.js**
- Wraps all pages
- Includes Header and Footer
- Provides consistent structure

**Header.js**
- Logo and navigation
- Auth buttons (Login, Sign Up, Share Idea Now)
- Mobile menu toggle
- User dropdown (when logged in)

**Footer.js**
- Platform information
- Quick links
- Copyright notice

### Pages

**Home.js**
- Hero section with call-to-action
- Category grid with random content
- Features section

**Login.js & Register.js**
- Form validation
- Error handling
- Loading states
- Links to switch between pages

**Dashboard.js** (placeholder)
- Will display user's content
- Content management actions

**CategoryPage.js** (placeholder)
- Will show content grid for category
- Filtering and sorting

**ContentDetail.js** (placeholder)
- Media player/viewer
- Content metadata
- Engagement features

**Upload.js** (placeholder)
- Multi-step upload form
- File validation
- Progress tracking

## State Management

### Current
- Local component state with useState
- Props passing

### Future
- Auth Context for user state (HER-15)
- Potentially add Redux or Zustand for complex state

## Best Practices

### Component Structure
```javascript
import React, { useState, useEffect } from 'react';
import './Component.css';

const Component = ({ prop1, prop2 }) => {
  const [state, setState] = useState(initial);

  useEffect(() => {
    // Side effects
  }, [dependencies]);

  const handleAction = () => {
    // Event handlers
  };

  return (
    <div className="component">
      {/* JSX */}
    </div>
  );
};

export default Component;
```

### API Calls
- Use try-catch for error handling
- Show loading states
- Display error messages
- Handle edge cases

### Styling
- Use CSS variables for consistency
- Mobile-first responsive design
- Meaningful class names
- Avoid inline styles

## Environment Variables

Create `.env` file in frontend directory:
```
REACT_APP_API_URL=http://localhost:5000/api
```

Or use the proxy in package.json (automatic in Docker).

## Deployment

### Build for Production
```bash
npm run build
```

### Deploy Options
- **Vercel**: Connect GitHub repo, auto-deploys
- **Netlify**: Drag and drop build folder or connect repo
- **AWS S3 + CloudFront**: Static site hosting
- **Docker**: Use production Dockerfile

### Environment Variables for Production
Set `REACT_APP_API_URL` to production API URL.

## Troubleshooting

### Port 3000 Already in Use
```bash
# Change port in .env
PORT=3001
```

### Hot Reload Not Working
- Check Docker volume mounts
- Ensure `CHOKIDAR_USEPOLLING=true` is set

### API Connection Failed
- Verify backend is running
- Check API URL configuration
- Check CORS settings on backend

### Build Errors
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Next Steps

### Immediate (Sprint 2)
1. **HER-13**: Complete Registration functionality
2. **HER-14**: Complete Login functionality
3. **HER-15**: Implement Auth Context

### Sprint 3
4. **HER-25**: Build Upload form
5. **HER-30**: Enhance Home page with real data
6. **HER-31**: Category card with rotating content

### Sprint 4
7. **HER-32**: Category page implementation
8. **HER-40**: Content detail page
9. **HER-41**: Video player component

## Contributing

1. Follow existing code structure
2. Use meaningful component/file names
3. Write clean, readable code
4. Keep components small and focused
5. Add comments for complex logic
6. Update README when adding features

## Resources

- [React Documentation](https://react.dev)
- [React Router Documentation](https://reactrouter.com)
- [Axios Documentation](https://axios-http.com)
- [Create React App Documentation](https://create-react-app.dev)
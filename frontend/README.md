# Heritage Platform - Frontend

React frontend for the Heritage Content Platform.

## Tech Stack

- **Framework**: React 18
- **Language**: TypeScript
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Styling**: CSS3 (custom properties)
- **Build Tool**: Create React App

## Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── layout/           # Header, Footer, Layout
│   │   ├── ContentCard.tsx   # Content display card
│   │   ├── CategoryCard.tsx  # Category display card
│   │   ├── VideoPlayer.tsx   # Media player component
│   │   └── ProtectedRoute.tsx
│   ├── pages/                # Route pages
│   │   ├── Home.tsx          # Landing page
│   │   ├── Login.tsx         # Login form
│   │   ├── Register.tsx      # Registration form
│   │   ├── CategoryPage.tsx  # Category content grid
│   │   ├── ContentDetail.tsx # Content viewer with player
│   │   ├── SearchResults.tsx # Search results page
│   │   ├── Upload.tsx        # Content upload form
│   │   ├── Dashboard.tsx     # User dashboard
│   │   └── Profile.tsx       # User profile
│   ├── services/
│   │   └── api.ts            # API client with interceptors
│   ├── App.tsx               # Main app with routing
│   └── index.tsx             # Entry point
└── package.json
```

## Features

- User authentication (login, register, logout)
- Content browsing by category
- Content detail view with video player
- Search functionality
- Content upload with file validation
- Responsive design (mobile, tablet, desktop)
- Lazy loading for images
- Protected routes for authenticated users

## Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run tests
npm test

# Create production build
npm run build

# Run linting
npm run lint
```

With Docker:
```bash
docker-compose up frontend
```

## Routes

### Public Routes
| Path | Component | Description |
|------|-----------|-------------|
| `/` | Home | Landing page with categories |
| `/login` | Login | User login form |
| `/register` | Register | User registration form |
| `/category/:id` | CategoryPage | Content by category |
| `/content/:id` | ContentDetail | Content viewer |
| `/search` | SearchResults | Search results |

### Protected Routes
| Path | Component | Description |
|------|-----------|-------------|
| `/upload` | Upload | Content upload form |
| `/dashboard` | Dashboard | User dashboard |
| `/profile/:username` | Profile | User profile |

## Components

### ContentCard
Displays content in a card format with lazy loading, hover effects, and metadata.

```tsx
<ContentCard content={{
  id: '123',
  title: 'Traditional Dance',
  username: 'creator',
  thumbnail_url: '/thumb.jpg',
  category_name: 'Dance',
  view_count: 1250,
  likes: 89
}} />
```

### VideoPlayer
Full-featured media player with playback controls, volume, fullscreen, and progress tracking.

```tsx
<VideoPlayer
  src="/media/video.mp4"
  poster="/thumb.jpg"
  title="Video Title"
/>
```

### CategoryCard
Displays category information with icon and content preview.

```tsx
<CategoryCard category={{
  id: 'dance',
  name: 'Dance',
  icon: '💃',
  description: 'Traditional dances'
}} />
```

## API Integration

All API calls go through `src/services/api.ts`:

```typescript
import apiService from './services/api';

// Authentication
await apiService.login({ email, password });
await apiService.register({ email, username, password });

// Content
await apiService.getContent(id);
await apiService.getContentByCategory(categoryId);
await apiService.createContent(data);

// Categories
await apiService.getCategories();

// Search
await apiService.searchContent(query);
```

### Interceptors

- **Request**: Automatically adds JWT token to Authorization header
- **Response**: Handles 401 errors, clears token, redirects to login

## Styling

### CSS Variables

Defined in `src/index.css`:
```css
:root {
  --primary-color: #6366f1;
  --text-color: #1e293b;
  --bg-color: #ffffff;
  --border-radius: 8px;
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}
```

### Responsive Breakpoints

- Mobile: < 480px
- Tablet: 481px - 768px
- Desktop: > 768px

## Environment Variables

### Development

Create `.env` in frontend directory:

```bash
REACT_APP_API_URL=http://localhost:5002/api
```

Or use docker-compose which handles this automatically.

### Production

Set in Netlify dashboard (see `.env.production.example`):

```bash
REACT_APP_API_URL=https://heritage-backend.onrender.com/api
```

**Important**:
- Must start with `REACT_APP_` (Create React App requirement)
- Must include `/api` at the end
- Set in Netlify: Site Settings → Environment Variables

## Testing

```bash
# Run tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

---

## Deployment

### Production Deployment (Netlify)

**Quick Deploy**:
1. Push code to GitHub
2. Import project in Netlify dashboard
3. Build settings auto-detected from `netlify.toml`
4. Add environment variable: `REACT_APP_API_URL`
5. Deploy!

**Detailed Guide**: See `docs/FRONTEND_DEPLOYMENT_NETLIFY.md`

**Auto-Deploy**:
- Enabled by default on `main` branch
- Push to main → Automatic deployment
- Every PR gets a deploy preview

**Verify Deployment**:
```bash
./scripts/verify-frontend.sh https://your-frontend.netlify.app https://heritage-backend.onrender.com
```

---

## Documentation

- [Frontend Deployment (Netlify)](../docs/FRONTEND_DEPLOYMENT_NETLIFY.md)
- [Backend Deployment (Render)](../docs/BACKEND_DEPLOYMENT_RENDER.md)
- [Production Database Setup](../docs/PRODUCTION_DATABASE_SETUP.md)
- [CI/CD Setup](../docs/CI_CD_SETUP.md)
- [Deployment Quick Start](../docs/DEPLOYMENT_QUICK_START.md)

---

**Live URLs** (after deployment):
- Frontend: https://heritage-platform.netlify.app
- Backend API: https://heritage-backend.onrender.com/api
- API Docs: https://heritage-backend.onrender.com/api-docs

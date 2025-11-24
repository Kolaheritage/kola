# Kola Heritage Content Platform

A platform for sharing and preserving cultural heritage through visual content (rituals, dances, music, recipes, stories, crafts).

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Backend**: Node.js + Express
- **Database**: PostgreSQL 15
- **Development**: Docker + Docker Compose

## Quick Start (Docker)

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (version 20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (version 2.0+)

### Setup

```bash
# Clone repository
git clone <repository-url>
cd kola

# Run setup script
chmod +x setup.sh
./setup.sh

# Start all services
docker-compose up
```

Or manually:
```bash
cp .env.example .env
docker-compose up
```

### Access

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| Health Check | http://localhost:5000/health |

### Docker Commands

```bash
docker-compose up              # Start all services
docker-compose up -d           # Start in background
docker-compose logs -f         # View logs
docker-compose logs -f backend # View backend logs only
docker-compose down            # Stop services
docker-compose down -v         # Stop and remove volumes
docker-compose up --build      # Rebuild and start
```

## Local Development (Without Docker)

### Prerequisites

- Node.js 18+
- PostgreSQL 15+

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Set environment variables
export DATABASE_URL=postgresql://user:password@localhost:5432/heritage_db
export JWT_SECRET=your-secret-key
export NODE_ENV=development

# Run database migrations
npm run migrate

# Seed test data (optional)
npm run seed

# Start development server
npm run dev
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

## Testing

### Backend Tests

```bash
cd backend

npm test                    # Run all tests
npm test -- --coverage      # Run with coverage
npm test -- --watch         # Watch mode
npm run test:watch          # Watch mode (alias)
```

### Frontend Tests

```bash
cd frontend

npm test                    # Run all tests
npm test -- --coverage      # Run with coverage
npm test -- --watchAll      # Watch mode
```

## Linting & Formatting

### Backend

```bash
cd backend

npm run lint                # Check for issues
npm run lint:fix            # Auto-fix issues
npm run format              # Format code
npm run format:check        # Check formatting
```

### Frontend

```bash
cd frontend

npm run lint                # Check for issues
npm run lint:fix            # Auto-fix issues
```

## Project Structure

```
kola/
├── backend/                 # Node.js REST API
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── routes/          # API endpoints
│   │   ├── models/          # Database models
│   │   ├── middleware/      # Auth, validation, errors
│   │   ├── utils/           # Helpers and utilities
│   │   └── __tests__/       # Test files
│   └── uploads/             # Media storage
├── frontend/                # React SPA
│   └── src/
│       ├── components/      # Reusable UI components
│       ├── pages/           # Route pages
│       └── services/        # API client
├── database/
│   └── init.sql             # Database initialization
├── docs/                    # API documentation
├── docker-compose.yml       # Docker orchestration
├── setup.sh                 # Setup script
└── .env.example             # Environment template
```

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/users/profile` | Get profile | Yes |
| PUT | `/api/users/profile` | Update profile | Yes |
| GET | `/api/categories` | List categories | No |
| GET | `/api/content/:id` | Get content | No |
| POST | `/api/content` | Create content | Yes |
| POST | `/api/upload` | Upload media | Yes |

See `docs/API_AUTH.md` for detailed API documentation.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | Database host | localhost |
| `DB_PORT` | Database port | 5432 |
| `DB_USER` | Database username | heritage_user |
| `DB_PASSWORD` | Database password | heritage_password |
| `DB_NAME` | Database name | heritage_db |
| `JWT_SECRET` | JWT signing key | (required) |
| `JWT_EXPIRES_IN` | Token expiration | 7d |
| `PORT` | Backend port | 5000 |
| `FRONTEND_PORT` | Frontend port | 3000 |

## Documentation

- `backend/README.md` - Backend API details
- `frontend/README.md` - Frontend components
- `docs/API_AUTH.md` - Authentication API
- `docs/MIDDLEWARE_AUTH.md` - JWT middleware

## Troubleshooting

### Port Already in Use

```bash
# Change ports in .env
BACKEND_PORT=5001
FRONTEND_PORT=3001
DB_PORT=5433
```

### Database Connection Issues

```bash
# Check if database is running
docker-compose ps

# View database logs
docker-compose logs database

# Access database directly
docker exec -it heritage_db psql -U heritage_user -d heritage_db
```

### Reset Everything

```bash
docker-compose down -v
docker-compose up --build
```

## License

ISC

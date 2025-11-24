# Kola Heritage Content Platform

A platform for sharing and preserving cultural heritage through visual content (rituals, dances, music, recipes, stories, crafts).

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL 15
- **Development**: Docker + Docker Compose

## Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (version 20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (version 2.0+)

### Setup

```bash
# Clone and setup
git clone <repository-url>
cd kola
cp .env.example .env

# Start all services
docker-compose up
```

### Access

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## Project Structure

```
kola/
├── backend/                 # Node.js REST API
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── routes/          # API endpoints
│   │   ├── models/          # Database models
│   │   ├── middleware/      # Auth, validation, errors
│   │   └── utils/           # Helpers and utilities
│   └── uploads/             # Media storage
├── frontend/                # React SPA
│   └── src/
│       ├── components/      # Reusable UI components
│       ├── pages/           # Route pages
│       └── services/        # API client
├── database/
│   └── init.sql             # Database initialization
├── docs/                    # API documentation
└── docker-compose.yml
```

## Development

### Commands

```bash
# Start services
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f [service]

# Rebuild after dependency changes
docker-compose up --build

# Stop services
docker-compose down
```

### Hot Reload

Both frontend and backend support hot-reload during development.

### Database Access

```bash
docker exec -it heritage_db psql -U heritage_user -d heritage_db
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/register` | User registration |
| `POST /api/auth/login` | User login |
| `GET /api/users/profile` | Get user profile |
| `PUT /api/users/profile` | Update profile |
| `GET /api/categories` | List categories |
| `GET /api/content/:id` | Get content |
| `POST /api/content` | Create content |
| `POST /api/upload` | Upload media |

See `docs/API_AUTH.md` for detailed API documentation.

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_USER` | Database username | heritage_user |
| `DB_PASSWORD` | Database password | heritage_password |
| `DB_NAME` | Database name | heritage_db |
| `JWT_SECRET` | JWT signing key | (change in production!) |
| `PORT` | Backend port | 5000 |

## Testing

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

## Documentation

- `backend/README.md` - Backend architecture and API details
- `frontend/README.md` - Frontend components and structure
- `docs/API_AUTH.md` - Authentication API reference
- `docs/MIDDLEWARE_AUTH.md` - JWT middleware documentation

## License

ISC

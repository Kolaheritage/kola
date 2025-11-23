# Kola Heritage Content Platform

A platform for sharing and preserving cultural heritage through visual content (rituals, dances, music, recipes, stories, crafts).

## Tech Stack

- **Frontend**: React
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Development**: Docker + Docker Compose

## Prerequisites

Before you begin, ensure you have the following installed:
- [Docker](https://docs.docker.com/get-docker/) (version 20.10 or higher)
- [Docker Compose](https://docs.docker.com/compose/install/) (version 2.0 or higher)
- [Git](https://git-scm.com/downloads)

## Project Structure

```
heritage-platform/
├── docker-compose.yml          # Docker orchestration
├── .env.example                # Environment variables template
├── .gitignore                  # Git ignore rules
├── README.md                   # This file
├── backend/                    # Node.js backend
│   ├── Dockerfile
│   ├── package.json
│   ├── src/
│   │   ├── server.js
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── middleware/
│   │   └── utils/
│   └── uploads/               # Local media storage
├── frontend/                   # React frontend
│   ├── Dockerfile
│   ├── package.json
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       └── services/
└── database/
    └── init.sql               # Database initialization
```

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd heritage-platform
```

### 2. Set Up Environment Variables

Copy the example environment file and update with your values:

```bash
cp .env.example .env
```

**Important**: Update the `JWT_SECRET` in `.env` with a strong random string for production.

### 3. Start the Application

Run all services with Docker Compose:

```bash
docker-compose up
```

Or run in detached mode (background):

```bash
docker-compose up -d
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Database**: localhost:5433

### 5. Check Service Health

```bash
# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f database

# Check running containers
docker-compose ps
```

## Development Workflow

### Hot Reload

Both frontend and backend support hot-reload:
- **Backend**: Changes to `.js` files automatically restart the server (via nodemon)
- **Frontend**: Changes to `.jsx/.js` files automatically refresh the browser

### Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (caution: deletes database data)
docker-compose down -v
```

### Rebuilding Services

If you change dependencies or Dockerfiles:

```bash
# Rebuild all services
docker-compose up --build

# Rebuild specific service
docker-compose up --build backend
```

### Accessing Container Shell

```bash
# Backend container
docker exec -it heritage_backend sh

# Frontend container
docker exec -it heritage_frontend sh

# Database container
docker exec -it heritage_db psql -U heritage_user -d heritage_db
```

## Database Management

### Access PostgreSQL

```bash
# Using docker exec
docker exec -it heritage_db psql -U heritage_user -d heritage_db

# Or using psql from host (if installed)
psql -h localhost -U heritage_user -d heritage_db
```

### Run Migrations

```bash
# From host
docker exec -it heritage_backend npm run migrate

# From inside container
docker exec -it heritage_backend sh
npm run migrate
```

### Backup Database

```bash
docker exec heritage_db pg_dump -U heritage_user heritage_db > backup.sql
```

### Restore Database

```bash
docker exec -i heritage_db psql -U heritage_user -d heritage_db < backup.sql
```

## Common Issues & Troubleshooting

### Port Already in Use

If ports 3000, 5000, or 5433 are already in use:

1. Stop the conflicting service, or
2. Change the port in `.env` file:
   ```
   FRONTEND_PORT=3001
   BACKEND_PORT=5001
   DB_PORT=5433
   ```

### Node Modules Issues

If you encounter dependency issues:

```bash
# Remove node_modules and reinstall
docker-compose down
docker-compose up --build
```

### Database Connection Issues

1. Check if database is healthy:
   ```bash
   docker-compose ps
   ```

2. Check database logs:
   ```bash
   docker-compose logs database
   ```

3. Verify environment variables in `.env`

### Hot Reload Not Working

If file changes aren't being detected:

1. For Windows/WSL users, ensure environment variables are set:
   - `CHOKIDAR_USEPOLLING=true`
   - `WATCHPACK_POLLING=true`

2. Restart the services:
   ```bash
   docker-compose restart frontend backend
   ```

### Permission Issues with Uploads Folder

```bash
# Create uploads directory with proper permissions
mkdir -p backend/uploads
chmod 755 backend/uploads
```

## Scripts

### Backend Scripts

```bash
# Inside backend container
npm run dev          # Start development server with nodemon
npm run start        # Start production server
npm run test         # Run tests
npm run migrate      # Run database migrations
npm run seed         # Seed database with initial data
```

### Frontend Scripts

```bash
# Inside frontend container
npm start            # Start development server
npm run build        # Create production build
npm run test         # Run tests
```

## Environment Variables

See `.env.example` for all available configuration options.

### Required Variables

- `DB_USER`: PostgreSQL username
- `DB_PASSWORD`: PostgreSQL password
- `DB_NAME`: Database name
- `JWT_SECRET`: Secret key for JWT tokens (change in production!)

### Optional Variables

- `BACKEND_PORT`: Backend port (default: 5000)
- `FRONTEND_PORT`: Frontend port (default: 3000)
- `DB_PORT`: Database port (default: 5433)

## Next Steps

After setup, proceed with:

1. **HER-3**: Backend project scaffolding
2. **HER-4**: Frontend project scaffolding
3. **HER-5**: Database schema design
4. **HER-6**: Database migrations

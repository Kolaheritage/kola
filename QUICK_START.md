# Quick Start Guide

Get the Heritage Platform running in 5 minutes!

## Step 1: Prerequisites

Install these if you haven't already:
- Docker: https://docs.docker.com/get-docker/
- Docker Compose: Usually comes with Docker Desktop

Verify installation:
```bash
docker --version
docker-compose --version
```

## Step 2: Initial Setup

```bash
# Clone the repository
git clone https://github.com/Kolaheritage/kola
cd kola

# Copy environment file
cp .env.example .env

# Make setup script executable (Linux/Mac)
chmod +x setup.sh

# Run setup script
./setup.sh
```

## Step 3: Start Everything

```bash
docker-compose up
```

Wait for all services to start. You'll see:
- ✅ Database ready
- ✅ Backend running on port 5000
- ✅ Frontend running on port 3000

## Step 4: Verify

Open your browser:
- Frontend: http://localhost:3000
- Backend Health: http://localhost:5000/health

## Common Commands

```bash
# Start services
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after changes
docker-compose up --build

# Access backend shell
docker exec -it heritage_backend sh

# Access database
docker exec -it heritage_db psql -U heritage_user -d heritage_db
```

## Troubleshooting

### Port conflicts
If ports are already in use, change them in `.env`:
```
FRONTEND_PORT=3001
BACKEND_PORT=5001
DB_PORT=5433
```

### Services won't start
```bash
# Clean everything and rebuild
docker-compose down -v
docker-compose up --build
```

### Hot reload not working
For Windows/WSL, environment variables are already set in docker-compose.yml.
Just restart:
```bash
docker-compose restart frontend backend
```

## File Structure

```
heritage-platform/
├── docker-compose.yml       # Docker orchestration
├── .env                     # Environment variables (create from .env.example)
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── src/
│   │   └── server.js       # Main backend file
│   └── uploads/            # Media storage
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── public/
│   └── src/
│       ├── App.js          # Main React component
│       └── index.js        # React entry point
└── database/
    └── init.sql            # Database initialization
```

## Next Steps

Now that Docker is running:

1. **HER-3**: Set up backend structure (routes, controllers, models)
2. **HER-4**: Set up frontend structure (components, pages)
3. **HER-5**: Design database schema
4. **HER-6**: Create database migrations

## Need Help?

- Check README.md for detailed documentation
- Review docker-compose logs: `docker-compose logs -f`
- Verify environment variables in .env
- Ensure Docker is running properly

Happy coding! 🏛️
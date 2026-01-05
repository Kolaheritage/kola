# CI/CD Setup Documentation

## Overview

This document describes the CI/CD pipeline for the Heritage Platform, which implements independent deployment for frontend and backend services.

## Architecture

The CI/CD pipeline is designed with the following principles:

1. **Service Independence** - Backend and frontend can be built, tested, and deployed independently
2. **Path-Based Optimization** - CI jobs only run when relevant files change
3. **Multi-Environment Support** - Separate staging and production deployments
4. **Production-Ready Builds** - Optimized Docker images for production

---

## CI Pipeline (.github/workflows/ci.yml)

### Workflow Triggers

- **Pull Requests** to `main` branch
- **Pushes** to `main` branch

### Jobs Overview

#### 1. Change Detection (`changes`)

**Purpose**: Detect which services have changes to optimize CI runs

**Outputs**:
- `backend`: true if backend files changed
- `frontend`: true if frontend files changed

**Paths Monitored**:
```yaml
backend:
  - 'backend/**'
  - '.github/workflows/ci.yml'
  - '.github/workflows/deploy-backend.yml'

frontend:
  - 'frontend/**'
  - '.github/workflows/ci.yml'
  - '.github/workflows/deploy-frontend.yml'
```

**Benefits**:
- Saves CI minutes (typically ~50% reduction)
- Faster feedback for developers
- Reduced resource consumption

#### 2. Frontend Jobs

All frontend jobs run **only if** frontend files changed:

**frontend** (Lint & Test)
- Runs ESLint
- Runs Jest tests
- Working directory: `./frontend`

**frontend-docker** (Docker Build)
- Builds development image (`Dockerfile.dev`)
- Builds production image (`Dockerfile.prod`)
- Validates both images build successfully

**frontend-security** (Security Audit)
- Runs `npm audit` with moderate severity threshold
- Continues on error (non-blocking)

#### 3. Backend Jobs

All backend jobs run **only if** backend files changed:

**backend** (Lint & Test)
- Spins up PostgreSQL test database
- Runs ESLint
- Runs Prettier check
- Runs Vitest tests with coverage
- Uploads coverage to Codecov
- Working directory: `./backend`

**backend-build** (Build Check)
- Compiles TypeScript
- Validates production build

**backend-docker** (Docker Build)
- Builds development image (`Dockerfile.dev`)
- Builds production image (`Dockerfile.prod`)
- Validates both images build successfully

**backend-security** (Security Audit)
- Runs `npm audit` with moderate severity threshold
- Continues on error (non-blocking)

#### 4. CI Success

Final job that reports overall CI status.

---

## Deployment Pipelines

### Backend Deployment (.github/workflows/deploy-backend.yml)

**Triggers**:
1. **Automatic**: Push to `main` branch (deploys to staging)
2. **Manual**: `workflow_dispatch` with environment selection

**Environments**:
- `staging` - Automatic deployments from main
- `production` - Manual deployment only

**Deployment Steps**:
1. Checkout code
2. Setup Node.js 18
3. Install dependencies
4. Run tests (blocks deployment on failure)
5. Build TypeScript
6. Deploy to Render (or Railway)
7. Health check validation
8. Success/failure notification

**Required Secrets**:
```
RENDER_API_KEY              # Render API token
RENDER_BACKEND_SERVICE_ID   # Render service ID
```

**Health Check**:
- Endpoint: `/health`
- Timeout: 100 seconds (10 attempts × 10s)
- Expected: HTTP 200 with `"status": "healthy"`

### Frontend Deployment (.github/workflows/deploy-frontend.yml)

**Triggers**:
1. **Automatic**: Push to `main` branch (deploys to staging)
2. **Manual**: `workflow_dispatch` with environment selection

**Environments**:
- `staging` - Automatic deployments from main
- `production` - Manual deployment only

**Deployment Steps**:
1. Checkout code
2. Setup Node.js 18
3. Install dependencies
4. Run tests (blocks deployment on failure)
5. Build React app with environment-specific API URL
6. Deploy to Vercel (or Netlify)
7. Health check validation
8. Success/failure notification

**Required Secrets**:
```
VERCEL_TOKEN           # Vercel API token
VERCEL_ORG_ID          # Vercel organization ID
VERCEL_PROJECT_ID      # Vercel project ID
REACT_APP_API_URL      # Backend API URL (environment-specific)
```

---

## Docker Images

### Backend Images

#### Development (`Dockerfile.dev`)
- Based on `node:18-alpine`
- Includes all dependencies (dev + prod)
- Uses `nodemon` for hot-reload
- Volume mounts for live code changes
- Port: 5002

#### Production (`Dockerfile.prod`)
- Multi-stage build
- Stage 1: Build TypeScript
- Stage 2: Production runtime with only prod dependencies
- Non-root user for security
- Built-in health check
- Optimized for size and performance
- Port: 5002

### Frontend Images

#### Development (`Dockerfile.dev`)
- Based on `node:18-alpine`
- Includes all dependencies
- Uses React dev server
- Hot module replacement enabled
- Port: 3000

#### Production (`Dockerfile.prod`)
- Multi-stage build
- Stage 1: Build React app
- Stage 2: Nginx to serve static files
- Includes custom nginx config
- Gzip compression enabled
- Security headers configured
- Built-in health check
- Port: 80

---

## Environment Variables

### Backend

**Development** (`.env`):
```bash
DB_HOST=localhost
DB_PORT=5433
DB_USER=heritage_user
DB_PASSWORD=heritage_password
DB_NAME=heritage_db
NODE_ENV=development
BACKEND_PORT=5002
JWT_SECRET=dev-secret-key
JWT_EXPIRES_IN=7d
```

**Production** (`.env.production`):
```bash
DB_HOST=db.xxx.supabase.co
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=<secure-password>
DB_NAME=postgres
NODE_ENV=production
BACKEND_PORT=5002
JWT_SECRET=<secure-random-string>
JWT_EXPIRES_IN=7d
```

### Frontend

**Development**:
```bash
REACT_APP_API_URL=http://localhost:5002/api
```

**Production**:
```bash
REACT_APP_API_URL=https://your-backend.onrender.com/api
```

---

## Deployment Platforms

### Backend Options

#### Option 1: Render (Recommended)

**Pros**:
- Easy setup with Git integration
- Built-in SSL/TLS
- Automatic deployments
- Free tier available
- Health checks included

**Setup**:
1. Create account at render.com
2. New Web Service → Connect repository
3. Configure:
   - Build Command: `cd backend && npm install && npm run build`
   - Start Command: `cd backend && npm start`
   - Environment: Add all production env vars
4. Note Service ID and generate API key

#### Option 2: Railway

**Pros**:
- Simple configuration
- Generous free tier
- PostgreSQL included
- Automatic SSL

**Setup**:
1. Create account at railway.app
2. New Project → Deploy from GitHub
3. Add PostgreSQL service
4. Configure environment variables
5. Deploy

### Frontend Options

#### Option 1: Vercel (Recommended)

**Pros**:
- Optimized for React apps
- Edge network (CDN)
- Automatic preview deployments
- Free tier generous
- Built-in analytics

**Setup**:
1. Create account at vercel.com
2. Import Git repository
3. Configure:
   - Framework Preset: Create React App
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Environment Variables: `REACT_APP_API_URL`
4. Deploy

#### Option 2: Netlify

**Pros**:
- Easy drag-and-drop option
- Form handling built-in
- Split testing features
- Serverless functions

**Setup**:
1. Create account at netlify.com
2. New site from Git
3. Configure:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/build`
4. Set environment variables
5. Deploy

---

## Local Development

### Using Docker Compose

```bash
# Start all services (database, backend, frontend)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after Dockerfile changes
docker-compose up -d --build
```

### Manual Setup

**Backend**:
```bash
cd backend
npm install
npm run dev
```

**Frontend**:
```bash
cd frontend
npm install
npm start
```

---

## CI/CD Best Practices

### 1. Independent Service Deployment

✅ **DO**:
- Deploy backend and frontend separately
- Use path filtering to avoid unnecessary builds
- Maintain separate deployment workflows

❌ **DON'T**:
- Couple frontend and backend deployments
- Deploy both services for every change
- Use monolithic deployment scripts

### 2. Environment Management

✅ **DO**:
- Use environment-specific configurations
- Store secrets in platform secret managers
- Validate environment variables before deployment

❌ **DON'T**:
- Commit `.env.production` to version control
- Hardcode credentials in code
- Use same env vars for dev and prod

### 3. Testing Before Deployment

✅ **DO**:
- Run tests before every deployment
- Block deployment on test failures
- Include health checks after deployment

❌ **DON'T**:
- Skip tests to deploy faster
- Deploy without validation
- Ignore failing health checks

### 4. Rollback Strategy

✅ **DO**:
- Keep previous Docker images
- Document rollback procedures
- Test rollback process

❌ **DON'T**:
- Delete old deployments immediately
- Assume rollback will work
- Deploy without backup plan

---

## Monitoring and Alerts

### Health Check Endpoints

**Backend**: `GET /health`
```json
{
  "status": "healthy",
  "message": "Heritage Platform API",
  "timestamp": "2026-01-02T10:30:00.000Z",
  "environment": "production",
  "database": {
    "status": "connected",
    "message": "Database connection healthy"
  }
}
```

**Frontend**: `GET /health`
```
healthy
```

### Recommended Monitoring

1. **Uptime Monitoring**:
   - Use UptimeRobot or Pingdom
   - Monitor `/health` endpoints
   - Alert on downtime

2. **Error Tracking**:
   - Integrate Sentry for backend
   - Track frontend errors
   - Set up alert thresholds

3. **Performance Monitoring**:
   - Response time tracking
   - Database query performance
   - Frontend load times

---

## Troubleshooting

### CI Failures

**Issue**: Backend tests failing
```bash
# Run tests locally
cd backend
npm test

# Check database connection
docker-compose up -d database
npm run migrate
```

**Issue**: Frontend build failing
```bash
# Check for missing env vars
cd frontend
npm run build

# Verify API URL is set
echo $REACT_APP_API_URL
```

### Deployment Failures

**Issue**: Render deployment timeout
- Check build logs in Render dashboard
- Verify all dependencies are in `package.json`
- Check for missing environment variables

**Issue**: Vercel build failed
- Verify `REACT_APP_API_URL` is set
- Check build command in Vercel settings
- Review build logs for errors

### Docker Issues

**Issue**: Build context too large
- Check `.dockerignore` files
- Remove `node_modules` before build
- Verify large files aren't committed

**Issue**: Image won't start
- Check logs: `docker logs <container-name>`
- Verify environment variables
- Test locally: `docker run -it <image> sh`

---

## Security Considerations

### Secrets Management

1. **Never commit**:
   - `.env.production`
   - Database credentials
   - API keys
   - JWT secrets

2. **Use platform secret managers**:
   - GitHub Secrets for workflows
   - Render/Railway environment variables
   - Vercel environment variables

3. **Rotate secrets regularly**:
   - Database passwords (quarterly)
   - API keys (on compromise)
   - JWT secrets (yearly)

### Docker Security

1. **Use non-root users**:
   ```dockerfile
   USER node
   ```

2. **Scan images**:
   ```bash
   docker scan heritage-backend:prod
   ```

3. **Keep base images updated**:
   - Use specific versions (not `latest`)
   - Update regularly for security patches

### Network Security

1. **Enable HTTPS**:
   - Use platform SSL/TLS (Render, Vercel)
   - Force HTTPS redirects

2. **CORS Configuration**:
   - Restrict to known origins
   - Don't use `*` in production

3. **Rate Limiting**:
   - Enable in backend (already configured)
   - Use platform DDoS protection

---

## Next Steps

1. **Complete HER-81**: Deploy backend to Render/Railway
2. **Complete HER-82**: Deploy frontend to Vercel/Netlify
3. **Set up monitoring**: Configure uptime monitoring and error tracking
4. **Configure alerts**: Set up Slack/email notifications for deployments
5. **Document runbooks**: Create incident response procedures

---

## References

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Production Database Setup](./PRODUCTION_DATABASE_SETUP.md)

---

**Last Updated**: 2026-01-02
**Version**: 1.0
**Related Tasks**: HER-80, HER-81, HER-82

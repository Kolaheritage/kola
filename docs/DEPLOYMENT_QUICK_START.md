# Deployment Quick Start Guide

Quick reference for deploying the Heritage Platform to production.

## 🚀 Quick Overview

```
┌─────────────────┐         ┌──────────────────┐
│   PostgreSQL    │◄────────│   Backend API    │
│   (Supabase)    │         │   (Render)       │
└─────────────────┘         └────────┬─────────┘
                                     │
                                     │ REST API
                                     │
                            ┌────────▼─────────┐
                            │   Frontend SPA   │
                            │   (Vercel)       │
                            └──────────────────┘
```

## 📋 Prerequisites Checklist

- [ ] GitHub repository access
- [ ] Supabase account (database)
- [ ] Render account (backend)
- [ ] Vercel account (frontend)
- [ ] Production environment variables ready

## 🗄️ Step 1: Database Setup (HER-80)

**Platform**: Supabase

1. **Create Project**:
   ```
   - Go to https://supabase.com
   - Sign up with GitHub
   - Create new project
   - Choose region (e.g., us-east-1)
   - Set strong database password
   ```

2. **Get Credentials**:
   ```
   Settings → Database → Connection Info

   Host: db.xxx.supabase.co
   Port: 5432
   Database: postgres
   User: postgres
   Password: <your-password>
   ```

3. **Run Migrations**:
   ```bash
   # Set environment variables
   export DB_HOST=db.xxx.supabase.co
   export DB_PORT=5432
   export DB_USER=postgres
   export DB_PASSWORD=your-password
   export DB_NAME=postgres
   export NODE_ENV=production

   # Run migrations
   cd backend
   npm run migrate
   ```

4. **Verify**:
   ```sql
   -- In Supabase SQL Editor
   SELECT * FROM migrations;
   ```

✅ **Done**: Database is ready!

---

## 🔧 Step 2: Backend Deployment (HER-81)

**Platform**: Render

### Option A: Using Render Dashboard (Easier)

1. **Create Service**:
   ```
   - Go to https://render.com
   - New → Web Service
   - Connect GitHub repository
   - Select repository: Kolaheritage/kola
   ```

2. **Configure Service**:
   ```
   Name: heritage-backend
   Region: Oregon (US West)
   Branch: main
   Root Directory: backend
   Runtime: Node
   Build Command: npm install && npm run build
   Start Command: npm start
   Instance Type: Free
   ```

3. **Set Environment Variables**:
   ```
   NODE_ENV=production
   BACKEND_PORT=5002

   # Database (from Supabase)
   DB_HOST=db.xxx.supabase.co
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=<supabase-password>
   DB_NAME=postgres

   # JWT (generate with: openssl rand -base64 32)
   JWT_SECRET=<your-secure-secret>
   JWT_EXPIRES_IN=7d

   # File Upload
   MAX_FILE_SIZE=104857600
   UPLOAD_PATH=./uploads
   ```

4. **Deploy**:
   ```
   - Click "Create Web Service"
   - Wait for deployment (~3-5 minutes)
   - Note your service URL: https://heritage-backend.onrender.com
   ```

5. **Verify**:
   ```bash
   curl https://heritage-backend.onrender.com/health
   ```
   Expected: `{"status":"healthy", ...}`

### Option B: Using GitHub Actions (Automated)

1. **Get Render API Key**:
   ```
   Render Dashboard → Account Settings → API Keys
   Create New API Key → Copy
   ```

2. **Get Service ID**:
   ```
   Service → Settings → Service ID
   ```

3. **Set GitHub Secrets**:
   ```
   GitHub → Settings → Secrets and variables → Actions

   RENDER_API_KEY: <your-api-key>
   RENDER_BACKEND_SERVICE_ID: srv-xxx
   ```

4. **Deploy**:
   ```bash
   # Automatic: Push to main
   git push origin main

   # Manual: Use GitHub Actions UI
   Actions → Deploy Backend → Run workflow
   ```

✅ **Done**: Backend is live!

---

## 🎨 Step 3: Frontend Deployment (HER-82)

**Platform**: Vercel

### Option A: Using Vercel Dashboard (Easier)

1. **Import Project**:
   ```
   - Go to https://vercel.com
   - New Project
   - Import Git Repository
   - Select: Kolaheritage/kola
   ```

2. **Configure Project**:
   ```
   Framework Preset: Create React App
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: build
   Install Command: npm install
   ```

3. **Set Environment Variables**:
   ```
   REACT_APP_API_URL=https://heritage-backend.onrender.com/api
   ```

4. **Deploy**:
   ```
   - Click "Deploy"
   - Wait for build (~2-3 minutes)
   - Note your URL: https://heritage-platform.vercel.app
   ```

5. **Verify**:
   ```
   Open: https://heritage-platform.vercel.app
   Should see: Heritage Platform landing page
   ```

### Option B: Using GitHub Actions (Automated)

1. **Get Vercel Tokens**:
   ```bash
   # Install Vercel CLI
   npm install -g vercel

   # Login
   vercel login

   # Link project
   cd frontend
   vercel link

   # Get tokens from .vercel/project.json
   cat .vercel/project.json
   ```

2. **Set GitHub Secrets**:
   ```
   GitHub → Settings → Secrets and variables → Actions

   VERCEL_TOKEN: <from vercel CLI>
   VERCEL_ORG_ID: <from project.json>
   VERCEL_PROJECT_ID: <from project.json>
   REACT_APP_API_URL: https://heritage-backend.onrender.com/api
   ```

3. **Deploy**:
   ```bash
   # Automatic: Push to main
   git push origin main

   # Manual: Use GitHub Actions UI
   Actions → Deploy Frontend → Run workflow
   ```

✅ **Done**: Frontend is live!

---

## 🔍 Verification Checklist

### Backend Health Check
```bash
# Test backend
curl https://heritage-backend.onrender.com/health

# Expected response
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

### API Endpoints Test
```bash
# Test API info
curl https://heritage-backend.onrender.com/api

# Test categories (should return empty array initially)
curl https://heritage-backend.onrender.com/api/categories
```

### Frontend Test
```bash
# Test frontend
curl https://heritage-platform.vercel.app

# Should return HTML with "Heritage Platform" in title
```

### Integration Test
1. Open frontend URL in browser
2. Navigate to login/register page
3. Create a test account
4. Verify backend receives request (check Render logs)
5. Test file upload functionality

---

## 📊 Monitoring Setup

### 1. Health Monitoring

**UptimeRobot** (Free):
```
1. Go to https://uptimerobot.com
2. Add Monitor:
   - Type: HTTP(s)
   - URL: https://heritage-backend.onrender.com/health
   - Interval: 5 minutes

3. Add Monitor:
   - Type: HTTP(s)
   - URL: https://heritage-platform.vercel.app
   - Interval: 5 minutes

4. Set up alerts (email/Slack)
```

### 2. Error Tracking

**Sentry** (Free tier):
```bash
# Backend
npm install @sentry/node

# Frontend
npm install @sentry/react
```

Configure in both services (see Sentry docs)

### 3. Platform Dashboards

- **Render**: https://dashboard.render.com → Check metrics, logs
- **Vercel**: https://vercel.com/dashboard → Check analytics
- **Supabase**: https://app.supabase.com → Check database usage

---

## 🚨 Troubleshooting

### Backend Issues

**Problem**: Health check returns 503
```bash
# Check Render logs
Render Dashboard → Service → Logs

# Common fixes:
1. Verify DATABASE credentials
2. Check if Supabase project is paused (free tier)
3. Restart service in Render
```

**Problem**: Database connection timeout
```bash
# Verify Supabase is accessible
curl https://db.xxx.supabase.co

# Check firewall/IP restrictions in Supabase
Supabase → Settings → Database → Connection pooling
```

### Frontend Issues

**Problem**: API calls failing (CORS)
```
# Verify REACT_APP_API_URL in Vercel
Vercel → Project → Settings → Environment Variables

# Should be: https://heritage-backend.onrender.com/api
# NOT: http://localhost:5002/api
```

**Problem**: Build failing
```bash
# Check build logs in Vercel
# Common issues:
1. Missing environment variables
2. npm install errors
3. TypeScript errors

# Test locally
cd frontend
REACT_APP_API_URL=https://heritage-backend.onrender.com/api npm run build
```

### Database Issues

**Problem**: Migrations not running
```bash
# Manual migration
export $(cat .env.production | xargs)
cd backend
npm run migrate

# Check migration status in Supabase SQL Editor
SELECT * FROM migrations ORDER BY executed_at DESC;
```

---

## 🔄 CI/CD Workflow

### Automatic Deployments

```
Push to main branch:
  ├── Backend changes → Triggers backend-only CI + Deploy
  ├── Frontend changes → Triggers frontend-only CI + Deploy
  └── Both changed → Triggers both independently
```

### Manual Deployments

```bash
# Via GitHub Actions
GitHub → Actions → Deploy Backend → Run workflow
GitHub → Actions → Deploy Frontend → Run workflow

# Via Platform Dashboards
Render → Service → Manual Deploy
Vercel → Project → Redeploy
```

---

## 📝 Post-Deployment Tasks

1. **Update Documentation**:
   - [ ] Update README with production URLs
   - [ ] Document environment-specific configurations
   - [ ] Create runbook for common operations

2. **Security Hardening**:
   - [ ] Enable Supabase Row Level Security (RLS)
   - [ ] Configure CORS properly in backend
   - [ ] Set up rate limiting (already configured)
   - [ ] Enable 2FA on all platform accounts

3. **Performance Optimization**:
   - [ ] Enable Cloudinary (HER-83)
   - [ ] Configure CDN caching
   - [ ] Optimize database indexes
   - [ ] Monitor query performance

4. **Backup Strategy**:
   - [ ] Schedule automated backups (Supabase)
   - [ ] Test restore procedure
   - [ ] Document backup retention policy

---

## 🎉 Success Criteria

- ✅ Backend deployed and responding to `/health`
- ✅ Frontend deployed and accessible
- ✅ Database connected and migrations applied
- ✅ User registration/login working
- ✅ File upload functional
- ✅ API integration working
- ✅ Monitoring set up
- ✅ Automated deployments configured

---

## 📚 Additional Resources

- [Production Database Setup](./PRODUCTION_DATABASE_SETUP.md)
- [CI/CD Setup](./CI_CD_SETUP.md)
- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)

---

## 🆘 Getting Help

**Issues**:
- GitHub Issues: https://github.com/Kolaheritage/kola/issues
- Check platform status pages

**Platform Support**:
- Render: https://render.com/docs/support
- Vercel: https://vercel.com/support
- Supabase: https://supabase.com/docs/guides/platform

---

**Last Updated**: 2026-01-02
**Version**: 1.0

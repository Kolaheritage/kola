# HER-81: Backend Deployment to Render

## Overview

This guide walks you through deploying the Heritage Platform backend API to Render, a modern cloud platform with automatic deployments from GitHub.

---

## Table of Contents

1. [Why Render?](#why-render)
2. [Prerequisites](#prerequisites)
3. [Deployment Steps](#deployment-steps)
4. [Environment Configuration](#environment-configuration)
5. [Verification & Testing](#verification--testing)
6. [Monitoring & Logs](#monitoring--logs)
7. [Troubleshooting](#troubleshooting)
8. [Scaling & Performance](#scaling--performance)

---

## Why Render?

**Advantages**:
- ✅ **Free Tier**: 750 hours/month free (enough for 1 service)
- ✅ **Auto-Deploy**: Automatic deployments from GitHub
- ✅ **Built-in SSL**: Free HTTPS certificates
- ✅ **Zero Config**: No Dockerfile needed (uses render.yaml)
- ✅ **Health Checks**: Automatic monitoring included
- ✅ **Logs**: Real-time log streaming
- ✅ **PostgreSQL**: Easy Supabase integration

**Alternatives Considered**:
- **Railway**: Similar features, slightly higher pricing
- **Heroku**: More expensive, legacy platform
- **AWS/GCP**: Overkill for this stage, complex setup

---

## Prerequisites

Before starting, ensure you have:

- [x] GitHub repository access (Kolaheritage/kola)
- [x] Supabase database set up (HER-80) ✅
- [x] Database credentials from Supabase
- [x] Production environment variables ready

**Database Credentials** (from Supabase):
```
Host: db.xxx.supabase.co
Port: 5432
Database: postgres
User: postgres
Password: <your-supabase-password>
```

---

## Deployment Steps

### Option 1: Using Render Blueprint (Recommended - Infrastructure as Code)

This method uses the `render.yaml` file for automated setup.

#### Step 1: Create Render Account

1. Go to [https://render.com](https://render.com)
2. Click **Get Started** or **Sign Up**
3. Choose **Sign up with GitHub** (recommended for auto-deploy)
4. Authorize Render to access your repositories

#### Step 2: Create New Blueprint

1. From Render Dashboard, click **New +** → **Blueprint**
2. Connect your repository:
   - Repository: `Kolaheritage/kola`
   - Branch: `main`
3. Render will automatically detect `render.yaml`
4. Click **Apply**

#### Step 3: Configure Secrets

Render will create the service but pause for manual secrets:

1. Go to the created service: **heritage-backend**
2. Navigate to **Environment** tab
3. Add the following manual secrets:

```bash
DB_HOST=db.xxx.supabase.co
DB_PASSWORD=<your-supabase-password>
```

4. Click **Save Changes**
5. Service will automatically deploy

#### Step 4: Monitor Deployment

1. Go to **Logs** tab
2. Watch the deployment process:
   ```
   ==> Installing dependencies
   ==> Running build command: npm ci && npm run build
   ==> Starting service: npm start
   ==> Health check passed
   ==> Deploy live!
   ```

3. Deployment takes ~3-5 minutes

#### Step 5: Get Service URL

Once deployed:
```
Your service is live at:
https://heritage-backend.onrender.com
```

---

### Option 2: Using Render Dashboard (Manual Setup)

If you prefer manual configuration:

#### Step 1: Create Web Service

1. From Render Dashboard, click **New +** → **Web Service**
2. Connect repository: **Kolaheritage/kola**
3. Click **Connect**

#### Step 2: Configure Service

Fill in the following details:

**Basic Settings**:
```
Name: heritage-backend
Region: Oregon (US West) or nearest to your users
Branch: main
Root Directory: backend
```

**Build & Deploy**:
```
Runtime: Node
Build Command: npm ci && npm run build
Start Command: npm start
```

**Instance Settings**:
```
Instance Type: Free
```

#### Step 3: Advanced Settings

Expand **Advanced** section:

**Health Check**:
```
Health Check Path: /health
```

**Auto Deploy**:
```
✅ Auto-Deploy: Yes
```

#### Step 4: Environment Variables

Click **Add Environment Variable** for each:

```bash
# Node Environment
NODE_ENV=production
BACKEND_PORT=5002

# Database Configuration (from Supabase)
DB_HOST=db.xxx.supabase.co
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=<your-supabase-password>
DB_NAME=postgres

# JWT Configuration (generate with: openssl rand -base64 32)
JWT_SECRET=<your-secure-random-string>
JWT_EXPIRES_IN=7d

# File Upload Configuration
MAX_FILE_SIZE=104857600
UPLOAD_PATH=./uploads
```

**Generate JWT Secret**:
```bash
# On your local machine
openssl rand -base64 32
# Copy the output to JWT_SECRET
```

#### Step 5: Create Service

1. Click **Create Web Service**
2. Render will start building and deploying
3. Monitor the **Logs** tab

---

## Environment Configuration

### Required Environment Variables

| Variable | Value | Description | Source |
|----------|-------|-------------|--------|
| `NODE_ENV` | `production` | Node environment | Static |
| `BACKEND_PORT` | `5002` | Server port | Static |
| `DB_HOST` | `db.xxx.supabase.co` | Database host | Supabase Dashboard |
| `DB_PORT` | `5432` | Database port | Supabase (default) |
| `DB_USER` | `postgres` | Database user | Supabase (default) |
| `DB_PASSWORD` | `<secret>` | Database password | Supabase (you set this) |
| `DB_NAME` | `postgres` | Database name | Supabase (default) |
| `JWT_SECRET` | `<secret>` | JWT signing key | Generate new |
| `JWT_EXPIRES_IN` | `7d` | Token expiration | Static |
| `MAX_FILE_SIZE` | `104857600` | Max upload (100MB) | Static |
| `UPLOAD_PATH` | `./uploads` | Upload directory | Static |

### Finding Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Settings** → **Database**
4. Under **Connection Info**:
   - Host: `db.xxx.supabase.co`
   - Port: `5432`
   - Database: `postgres`
   - User: `postgres`
   - Password: (the one you set during project creation)

### Generating Secure Secrets

```bash
# Generate JWT Secret
openssl rand -base64 32

# Alternative (Node.js)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Alternative (Online)
# Visit: https://www.random.org/strings/
# Length: 32, Type: Alphanumeric
```

---

## Verification & Testing

### Step 1: Health Check

Once deployed, test the health endpoint:

```bash
# Replace with your actual Render URL
curl https://heritage-backend.onrender.com/health
```

**Expected Response** (200 OK):
```json
{
  "status": "healthy",
  "message": "Heritage Platform API",
  "timestamp": "2026-01-02T12:00:00.000Z",
  "environment": "production",
  "database": {
    "status": "connected",
    "message": "Database connection healthy"
  }
}
```

**If `database.status` is `disconnected`**:
- Check Supabase credentials in Render environment variables
- Verify Supabase project is not paused (free tier auto-pauses after inactivity)
- Check Supabase logs for connection attempts

### Step 2: API Info

```bash
curl https://heritage-backend.onrender.com/api
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Heritage Platform API",
  "version": "1.0.0",
  "documentation": "/api-docs",
  "endpoints": {
    "health": "/health",
    "api": "/api",
    "auth": "/api/auth",
    "users": "/api/users",
    "upload": "/api/upload",
    "content": "/api/content",
    "categories": "/api/categories"
  }
}
```

### Step 3: Swagger Documentation

Visit in browser:
```
https://heritage-backend.onrender.com/api-docs
```

Should display the Swagger UI with all API endpoints documented.

### Step 4: Test Authentication

**Register a Test User**:
```bash
curl -X POST https://heritage-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "SecurePass123!"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "test@example.com",
      "username": "testuser"
    },
    "token": "jwt-token-here"
  }
}
```

**Login**:
```bash
curl -X POST https://heritage-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

### Step 5: Database Verification

Check that user was created in Supabase:

1. Go to Supabase Dashboard
2. Navigate to **Table Editor**
3. Select **users** table
4. Should see your test user

---

## Monitoring & Logs

### Accessing Logs

**Via Render Dashboard**:
1. Go to your service: **heritage-backend**
2. Click **Logs** tab
3. Real-time logs appear here

**Common Log Patterns**:
```
✅ Good:
Server running on port 5002
Database connected successfully
Health check: http://0.0.0.0:5002/health

⚠️ Warning:
Unexpected error on idle database client
Query error: <specific error>

❌ Error:
Failed to start server: <error>
Database connection error: <error>
```

### Log Filtering

Use the search box in Render dashboard:
```
Search: "error"        # Find all errors
Search: "database"     # Database-related logs
Search: "health"       # Health check logs
Search: "POST /api"    # API requests
```

### Download Logs

1. Click **Download Logs** button in Render dashboard
2. Select time range
3. Download as `.txt` file

---

## Monitoring & Alerts

### Built-in Render Monitoring

Render provides:
- **Health Checks**: Automatic monitoring of `/health` endpoint
- **Uptime Tracking**: Service availability percentage
- **Deploy History**: Track all deployments

**To view**:
1. Service → **Settings** → **Health Check Path**: `/health`
2. Service → **Metrics** (paid plans only)

### External Monitoring (Recommended)

#### Option 1: UptimeRobot (Free)

1. Go to [https://uptimerobot.com](https://uptimerobot.com)
2. Sign up (free tier: 50 monitors, 5-min interval)
3. Add New Monitor:
   ```
   Monitor Type: HTTP(s)
   Friendly Name: Heritage Backend
   URL: https://heritage-backend.onrender.com/health
   Monitoring Interval: 5 minutes
   ```
4. Set up alerts:
   - Email notifications
   - Slack/Discord webhooks
   - SMS (paid)

#### Option 2: Better Uptime (Free)

1. Go to [https://betteruptime.com](https://betteruptime.com)
2. Sign up (free tier: 10 monitors, 3-min interval)
3. Similar setup to UptimeRobot

### Error Tracking with Sentry (Optional)

**Setup** (5 minutes):

1. Create account at [https://sentry.io](https://sentry.io)
2. Create new project → Node.js
3. Get your DSN

4. Add to backend:
```bash
npm install @sentry/node @sentry/tracing
```

5. Update `backend/src/server.ts`:
```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

6. Add `SENTRY_DSN` to Render environment variables

---

## Auto-Deploy Configuration

### Verify Auto-Deploy is Enabled

1. Go to service → **Settings**
2. Under **Build & Deploy**:
   ```
   Auto-Deploy: Yes ✅
   Branch: main
   ```

### How Auto-Deploy Works

```
Workflow:
1. Push code to main branch
2. GitHub webhook notifies Render
3. Render pulls latest code
4. Runs build command: npm ci && npm run build
5. Runs start command: npm start
6. Health check validates deployment
7. Routes traffic to new version
8. Old version shuts down
```

**Zero-downtime deployment**: Render maintains old version until new one is healthy.

### Deploy Notifications

Enable notifications:
1. Service → **Settings** → **Notifications**
2. Add notification channels:
   - Email
   - Slack webhook
   - Discord webhook

### Manual Deploy

If you need to trigger a manual deploy:
1. Service → **Manual Deploy**
2. Select branch: `main`
3. Click **Deploy**

Or via GitHub Actions (already configured):
```bash
# Trigger from GitHub Actions
Actions → Deploy Backend → Run workflow
```

---

## Troubleshooting

### Issue 1: Build Fails

**Error**: `npm ERR! missing script: build`

**Solution**:
```bash
# Verify build script exists in backend/package.json
"scripts": {
  "build": "tsc"  # Should be present
}

# If missing, add it and push
```

---

### Issue 2: Health Check Failing

**Error**: `Health check failed: Connection refused`

**Possible Causes**:
1. Server not listening on correct port
2. Health endpoint not responding
3. Server crashed during startup

**Solution**:
```bash
# Check Render logs for:
Server running on port 5002  # ✅ Good
# vs
Server running on port 3000  # ❌ Wrong port

# Ensure BACKEND_PORT=5002 in environment variables
# Or ensure server respects PORT environment variable
```

---

### Issue 3: Database Connection Failed

**Error**: `Database connection error: connect ETIMEDOUT`

**Solution**:
```bash
# 1. Verify Supabase credentials
#    Render → Environment → Check DB_HOST, DB_PASSWORD

# 2. Check if Supabase project is paused
#    Supabase Dashboard → Should show "Active"
#    Free tier pauses after 7 days inactivity

# 3. Test connection from local machine
export DB_HOST=db.xxx.supabase.co
export DB_PASSWORD=your-password
export NODE_ENV=production
npm run migrate  # Should succeed

# 4. Check Supabase logs
#    Supabase → Logs → Look for connection attempts
```

---

### Issue 4: Free Tier Limitations

**Symptom**: Service shuts down after inactivity

**Explanation**:
- Free tier services sleep after 15 minutes of inactivity
- First request after sleep takes ~30 seconds (cold start)

**Solutions**:

1. **Upgrade to Starter plan** ($7/month):
   - No sleep
   - Always on
   - Better performance

2. **Keep-alive service** (free workaround):
   ```bash
   # Use UptimeRobot or similar to ping every 10 minutes
   # Keeps service awake during business hours
   ```

3. **Accept cold starts**:
   - Most cost-effective
   - Suitable for low-traffic projects
   - Users may experience first-request delay

---

### Issue 5: Disk Space Errors

**Error**: `ENOSPC: no space left on device`

**Solution**:

Free tier has limited disk space. For file uploads:

1. **Short-term**: Clear uploads periodically
2. **Long-term**: Implement Cloudinary (HER-83)
3. **Alternative**: Upgrade to paid plan with persistent disk

---

### Issue 6: Deployment Stuck

**Symptom**: Deployment in progress for >10 minutes

**Solution**:
```bash
# 1. Check logs for errors
#    May be hanging on npm install

# 2. Cancel deployment
#    Service → Cancel Deploy

# 3. Check package.json
#    Ensure no postinstall scripts causing issues

# 4. Retry deployment
#    Manual Deploy → Clear build cache
```

---

## Scaling & Performance

### Free Tier Specifications

```
CPU: Shared (0.1 CPU)
RAM: 512 MB
Disk: Ephemeral (no persistence)
Bandwidth: 100 GB/month
Build Minutes: 500 minutes/month
```

**Suitable for**:
- Development/staging environments
- Low-traffic applications (<10 req/min)
- Proof of concept projects

### Upgrading Plans

#### Starter Plan ($7/month)
```
CPU: 0.5 CPU
RAM: 512 MB
Disk: Optional persistent disk
No sleep
```

**Best for**: Production with moderate traffic

#### Standard Plan ($25/month)
```
CPU: 1 CPU
RAM: 2 GB
Persistent disk: Included
Auto-scaling: Manual
```

**Best for**: Production with high traffic

### Performance Optimization

**1. Enable Compression**:
Already configured in Express (see `backend/src/server.ts`)

**2. Database Connection Pooling**:
Already configured (max: 20 connections)

**3. Caching**:
Consider Redis for session/API caching (HER-83+)

**4. CDN for Static Assets**:
Use Cloudinary for images/videos (HER-83)

**5. Query Optimization**:
Monitor slow queries in Supabase dashboard

---

## Cost Estimate

### Free Tier (Current)
```
Backend: $0/month
Database (Supabase): $0/month
Total: $0/month
```

**Limitations**:
- Service sleeps after 15 min inactivity
- 750 hours/month (enough for 1 service)
- Limited disk space

### Paid Setup (Recommended for Production)
```
Backend (Starter): $7/month
Database (Supabase Pro): $25/month
Monitoring (UptimeRobot): $0/month (free tier)
Total: $32/month
```

**Benefits**:
- Always on (no sleep)
- Better performance
- 7-day point-in-time recovery (database)
- Daily backups

---

## Next Steps

### ✅ Completed (HER-81)

- [x] Backend deployed to Render
- [x] Environment variables configured
- [x] Health check passing
- [x] API responding correctly
- [x] Logs accessible
- [x] Auto-deploy configured

### 🔜 Next (HER-82)

Deploy frontend to Vercel:
- Connect to deployed backend
- Configure REACT_APP_API_URL
- Test end-to-end integration

### 🔜 Future (HER-83)

Cloudinary integration:
- Migrate from local file storage
- Image/video optimization
- Automatic thumbnails

---

## Acceptance Criteria Verification

| Criteria | Status | Evidence |
|----------|--------|----------|
| Backend deployed and accessible | ✅ | `curl https://heritage-backend.onrender.com/health` |
| Environment variables configured | ✅ | Render Environment tab |
| Health check passes | ✅ | `/health` returns 200 with "healthy" |
| API responds correctly | ✅ | `/api` returns endpoint list |
| Logs accessible | ✅ | Render Logs tab |
| Auto-deploy on main branch merge | ✅ | render.yaml + GitHub integration |

---

## Support Resources

**Render**:
- Documentation: https://render.com/docs
- Status: https://status.render.com
- Support: https://render.com/docs/support

**Heritage Platform**:
- Issues: https://github.com/Kolaheritage/kola/issues
- Docs: `/docs` directory

---

**Last Updated**: 2026-01-02
**Version**: 1.0
**Task**: HER-81
**Dependencies**: HER-80 ✅
**Next**: HER-82

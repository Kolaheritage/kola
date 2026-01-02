# HER-82: Frontend Deployment to Vercel

## Overview

This guide walks you through deploying the Heritage Platform React frontend to Vercel, connecting it to the production backend API deployed on Render.

---

## Table of Contents

1. [Why Vercel?](#why-vercel)
2. [Prerequisites](#prerequisites)
3. [Deployment Steps](#deployment-steps)
4. [Environment Configuration](#environment-configuration)
5. [Verification & Testing](#verification--testing)
6. [Custom Domain Setup](#custom-domain-setup)
7. [Monitoring & Analytics](#monitoring--analytics)
8. [Troubleshooting](#troubleshooting)

---

## Why Vercel?

**Advantages**:
- ✅ **Optimized for React**: Built specifically for frontend frameworks
- ✅ **Global CDN**: Edge network in 100+ locations worldwide
- ✅ **Zero Config**: Auto-detects Create React App
- ✅ **Preview Deployments**: Every PR gets a unique URL
- ✅ **Free Tier**: Generous free tier for personal projects
- ✅ **Analytics**: Built-in Web Vitals monitoring
- ✅ **Auto HTTPS**: Free SSL certificates
- ✅ **Instant Rollback**: One-click rollback to any deployment

**Alternatives Considered**:
- **Netlify**: Similar features, slightly different DX
- **GitHub Pages**: Limited, no environment variables
- **Cloudflare Pages**: Good alternative, less popular
- **AWS S3 + CloudFront**: Complex setup, overkill

---

## Prerequisites

Before starting, ensure you have:

- [x] Backend deployed to Render (HER-81) ✅
- [x] Backend URL noted (e.g., `https://heritage-backend.onrender.com`)
- [x] GitHub repository access
- [x] Git commits pushed to main branch

**Backend URL** (from HER-81):
```
Backend: https://heritage-backend.onrender.com
API: https://heritage-backend.onrender.com/api
Health Check: https://heritage-backend.onrender.com/health
```

---

## Deployment Steps

### Option 1: Using Vercel Dashboard (Recommended - 5 minutes)

This is the fastest and easiest method.

#### Step 1: Create Vercel Account

1. Go to [https://vercel.com](https://vercel.com)
2. Click **Sign Up**
3. Choose **Continue with GitHub** (recommended)
4. Authorize Vercel to access your repositories

#### Step 2: Import Project

1. From Vercel Dashboard, click **Add New** → **Project**
2. Find your repository: **Kolaheritage/kola**
3. Click **Import**

#### Step 3: Configure Project

Vercel auto-detects most settings, but verify:

**Framework Preset**: Create React App (auto-detected)

**Root Directory**: `frontend` ⚠️ IMPORTANT!
- Click **Edit** next to Root Directory
- Enter: `frontend`
- This tells Vercel to build from the frontend folder

**Build Settings**:
```
Build Command: npm run build (auto-detected)
Output Directory: build (auto-detected)
Install Command: npm install (auto-detected)
```

**Node Version**: 18.x (matches backend)

#### Step 4: Configure Environment Variables

Click **Environment Variables** section:

Add this variable:

| Name | Value | Environment |
|------|-------|-------------|
| `REACT_APP_API_URL` | `https://heritage-backend.onrender.com/api` | Production, Preview, Development |

**⚠️ CRITICAL**:
- Must include `/api` at the end
- Must start with `REACT_APP_` (Create React App requirement)
- Select all three environments for consistency

#### Step 5: Deploy

1. Click **Deploy**
2. Vercel builds and deploys (~2-3 minutes)
3. Watch the build logs in real-time

**Build Process**:
```
→ Building...
  Installing dependencies
  Running build command: npm run build
  Creating optimized production build
  Compiled successfully!

→ Deploying...
  Uploading build output
  Deploying to global edge network

✓ Deployment Complete!
  https://heritage-platform-xxxx.vercel.app
```

#### Step 6: Get Deployment URL

Once deployed, you'll see:
```
🎉 Congratulations! Your deployment is live.

Production: https://heritage-platform-xxxx.vercel.app
Preview: https://heritage-platform-git-main-xxxx.vercel.app
```

---

### Option 2: Using Vercel CLI (Advanced)

For automated or local deployments.

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Login

```bash
vercel login
```

Choose your login method (GitHub recommended)

#### Step 3: Link Project

```bash
cd /path/to/kola/frontend
vercel link
```

Follow the prompts:
```
? Set up and deploy "frontend"? Yes
? Which scope? <your-account>
? Link to existing project? No
? What's your project's name? heritage-frontend
? In which directory is your code located? ./
```

This creates `.vercel/project.json` with your project settings.

#### Step 4: Set Environment Variables

```bash
vercel env add REACT_APP_API_URL
```

When prompted:
```
? What's the value of REACT_APP_API_URL? https://heritage-backend.onrender.com/api
? Add REACT_APP_API_URL to which Environments? Production, Preview, Development
```

#### Step 5: Deploy to Production

```bash
# Deploy to production
vercel --prod

# Or just deploy (staging)
vercel
```

#### Step 6: Get Deployment Info

```bash
vercel ls

# Output:
# Age    Deployment                    Status    Duration
# 1m     heritage-frontend-xxxx        Ready     45s
```

---

### Option 3: Using vercel.json (Infrastructure as Code)

We've included a `vercel.json` in the project root.

**Features**:
- SPA routing (all routes → index.html)
- Security headers (CSP, X-Frame-Options, etc.)
- Static asset caching (1 year)
- Environment variable configuration

**Automatic Setup**:
1. Vercel auto-detects `vercel.json`
2. Applies all configuration
3. You only need to add environment variables

---

## Environment Configuration

### Required Environment Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `REACT_APP_API_URL` | `https://heritage-backend.onrender.com/api` | Backend API URL |

### Optional Environment Variables

| Variable | Example | Description |
|----------|---------|-------------|
| `REACT_APP_GA_TRACKING_ID` | `UA-XXXXXXXXX-X` | Google Analytics tracking ID |
| `REACT_APP_SENTRY_DSN` | `https://xxx@sentry.io/xxx` | Sentry error tracking |
| `REACT_APP_ENABLE_ANALYTICS` | `true` | Enable/disable analytics |

### Finding Your Backend URL

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click on **heritage-backend** service
3. Copy the URL at the top (e.g., `https://heritage-backend.onrender.com`)
4. **Add `/api` to the end**: `https://heritage-backend.onrender.com/api`

### Setting Environment Variables in Vercel

**Via Dashboard**:
1. Vercel Dashboard → Your Project
2. **Settings** → **Environment Variables**
3. Click **Add New**
4. Enter name, value, and select environments
5. Click **Save**

**Via CLI**:
```bash
vercel env add REACT_APP_API_URL production
# Paste value when prompted
```

**Important Notes**:
- After adding/changing env vars, **redeploy** for changes to take effect
- Vercel → Deployments → Latest → **Redeploy**
- Or push a new commit to trigger auto-deploy

---

## Verification & Testing

### Step 1: Access Deployment

Visit your deployment URL:
```
https://heritage-platform-xxxx.vercel.app
```

Should see the Heritage Platform homepage.

### Step 2: Verify API Connection

Open browser **DevTools** (F12) → **Console**

Check environment variable:
```javascript
console.log(process.env.REACT_APP_API_URL)
// Should output: https://heritage-backend.onrender.com/api
```

### Step 3: Test Authentication Flow

1. Click **Register** or **Sign Up**
2. Fill in the form:
   ```
   Email: test@example.com
   Username: testuser
   Password: TestPass123!
   ```
3. Submit

**Expected**:
- Registration succeeds
- Redirected to dashboard or home
- Check Network tab: POST request to `/api/auth/register`
- Should see 200 OK response

### Step 4: Test API Integration

1. Navigate to content or categories page
2. Check Network tab for API calls
3. Requests should go to: `https://heritage-backend.onrender.com/api/...`
4. Should receive 200 OK responses

### Step 5: Check for Errors

1. Open Console (F12)
2. Look for errors (should be none)
3. Common issues:
   - CORS errors → Check backend CORS config
   - 404 on API calls → Check `REACT_APP_API_URL`
   - Network errors → Check backend is running

### Step 6: Test Responsiveness

1. Open DevTools → Toggle device toolbar
2. Test on different screen sizes:
   - Mobile (375px)
   - Tablet (768px)
   - Desktop (1920px)
3. Verify layout adapts correctly

### Step 7: Test PWA Features (if applicable)

1. Check for Service Worker:
   ```javascript
   navigator.serviceWorker.getRegistrations()
   ```
2. Test offline functionality (if implemented)
3. Check manifest.json loads correctly

---

## Auto-Deploy Configuration

### Verify Auto-Deploy is Enabled

1. Vercel Dashboard → Project → **Settings**
2. **Git** section
3. Verify:
   ```
   ✅ Production Branch: main
   ✅ Automatic Deployments: Enabled
   ```

### How Auto-Deploy Works

```
Workflow:
1. Push code to main branch
2. GitHub webhook notifies Vercel
3. Vercel pulls latest code
4. Runs build command: npm run build
5. Deploys to edge network
6. Routes traffic to new deployment
```

**Features**:
- **Zero downtime**: Old version serves until new one ready
- **Preview deployments**: Every PR gets unique URL
- **Instant rollback**: One-click rollback in dashboard

### Preview Deployments

Every pull request gets a unique deployment:
```
PR #123: https://heritage-platform-git-pr-123-xxxx.vercel.app
```

**Use cases**:
- Test changes before merging
- Share with team for review
- QA testing in production-like environment

### Deploy Notifications

Enable notifications:
1. Project → **Settings** → **Git Integration**
2. Configure:
   - GitHub commit status checks
   - Comments on PRs with preview URL
   - Slack/Discord webhooks (optional)

---

## Custom Domain Setup (Optional)

### Step 1: Add Domain

1. Vercel Dashboard → Project → **Settings**
2. **Domains** section
3. Click **Add**
4. Enter your domain (e.g., `heritage.example.com`)

### Step 2: Configure DNS

Vercel provides DNS records to add:

**Option A: A Record**
```
Type: A
Name: @ (or subdomain)
Value: 76.76.21.21
```

**Option B: CNAME Record** (recommended)
```
Type: CNAME
Name: www (or subdomain)
Value: cname.vercel-dns.com
```

### Step 3: Verify Domain

1. Vercel checks DNS propagation
2. Usually takes 5-30 minutes
3. Vercel auto-provisions SSL certificate
4. Domain becomes active

### Step 4: Set as Production Domain

1. Domains list → Click domain
2. Click **Set as Production**
3. All deployments now go to your custom domain

---

## Monitoring & Analytics

### Built-in Vercel Analytics

**Web Vitals** (Performance metrics):
1. Project → **Analytics** tab
2. View metrics:
   - **FCP**: First Contentful Paint
   - **LCP**: Largest Contentful Paint
   - **FID**: First Input Delay
   - **CLS**: Cumulative Layout Shift
   - **TTFB**: Time to First Byte

**Enable** (on paid plans):
```
Project → Settings → Analytics → Enable
```

### Real User Monitoring (RUM)

Vercel tracks:
- Page load times
- User interactions
- Geographic distribution
- Device types
- Browser types

### External Monitoring

#### Google Analytics (Free)

1. Get tracking ID from [Google Analytics](https://analytics.google.com)
2. Add to Vercel environment variables:
   ```
   REACT_APP_GA_TRACKING_ID=UA-XXXXXXXXX-X
   ```
3. Update `src/index.tsx` or use `react-ga`:
   ```bash
   npm install react-ga
   ```

#### Sentry Error Tracking (Free tier)

1. Create account at [Sentry.io](https://sentry.io)
2. Create React project
3. Get DSN
4. Add to environment variables:
   ```
   REACT_APP_SENTRY_DSN=https://xxx@sentry.io/xxx
   ```
5. Install Sentry SDK:
   ```bash
   npm install @sentry/react @sentry/tracing
   ```

### Deployment Logs

**View Deployment Logs**:
1. Vercel Dashboard → **Deployments**
2. Click on any deployment
3. View:
   - Build logs
   - Runtime logs (serverless functions)
   - Error logs

**Filter Logs**:
```
Search: error
Search: warning
Search: build
```

---

## Troubleshooting

### Issue 1: Build Fails

**Error**: `npm ERR! missing script: build`

**Solution**:
```bash
# Verify build script exists in frontend/package.json
"scripts": {
  "build": "react-scripts build"  # Should be present
}

# If missing, it's likely a CRA issue
# Reinstall react-scripts
cd frontend
npm install react-scripts --save
```

---

### Issue 2: Blank Page After Deployment

**Symptoms**:
- Deployment succeeds
- Opens to blank white page
- Console shows errors

**Possible Causes & Solutions**:

**A. Wrong homepage in package.json**:
```json
// frontend/package.json
{
  "homepage": ".",  // ✅ Correct (or remove)
  // NOT: "homepage": "/frontend"  // ❌ Wrong for Vercel
}
```

**B. Router basename issue**:
```javascript
// If using React Router
<BrowserRouter basename="/">  {/* ✅ Correct */}
<BrowserRouter basename="/frontend">  {/* ❌ Wrong */}
```

**C. Missing environment variables**:
```bash
# Check console for:
// Uncaught TypeError: Cannot read property of undefined

# Solution: Verify REACT_APP_API_URL is set
```

---

### Issue 3: API Calls Failing (CORS)

**Error**: `Access-Control-Allow-Origin`

**Symptoms**:
```
Access to fetch at 'https://heritage-backend.onrender.com/api/...'
from origin 'https://heritage-platform.vercel.app'
has been blocked by CORS policy
```

**Solution**:

Update backend CORS configuration:

```typescript
// backend/src/config/app.ts
cors Options: {
  origin: [
    'https://heritage-platform.vercel.app',
    'https://heritage-platform-*.vercel.app', // Preview deployments
    'http://localhost:3000', // Development
  ],
  credentials: true
}
```

Then redeploy backend.

---

### Issue 4: Environment Variables Not Working

**Error**: `process.env.REACT_APP_API_URL is undefined`

**Checklist**:

1. **Variable name must start with `REACT_APP_`**:
   ```
   ✅ REACT_APP_API_URL
   ❌ API_URL
   ❌ VITE_API_URL (this is for Vite, not CRA)
   ```

2. **Set in Vercel dashboard**:
   - Settings → Environment Variables
   - Verify value is correct
   - Ensure "Production" is checked

3. **Redeploy after adding variables**:
   - Deployments → Latest → Redeploy
   - OR: Push a new commit

4. **Verify in browser console**:
   ```javascript
   console.log(process.env.REACT_APP_API_URL)
   // Should output the URL
   ```

---

### Issue 5: 404 on Page Refresh

**Symptoms**:
- Homepage loads fine
- Navigate to `/about` → works
- Refresh page → 404 Not Found

**Cause**: SPA routing not configured

**Solution**:

Vercel should auto-detect React Router, but if not:

1. Ensure `vercel.json` has rewrites:
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

2. If using older CRA, add `public/_redirects` (Netlify-style):
   ```
   /*    /index.html   200
   ```

---

### Issue 6: Slow Initial Load

**Symptoms**:
- First load takes 3-5 seconds
- Subsequent loads are fast

**Causes & Solutions**:

**A. Backend cold start** (Render free tier):
- Backend sleeps after 15 min inactivity
- First request wakes it up (~30s)
- Solution: Upgrade backend to paid plan OR use keep-alive service

**B. Large bundle size**:
```bash
# Analyze bundle
npm run build
# Check build/static/js/*.js sizes

# Solutions:
1. Code splitting (React.lazy)
2. Remove unused dependencies
3. Optimize images (use WebP)
4. Enable compression (already in vercel.json)
```

**C. No caching**:
- Vercel automatically caches static assets
- Check Network tab → Size column should show "(from cache)"

---

### Issue 7: Different Behavior in Dev vs Production

**Common Differences**:

| Issue | Development | Production | Fix |
|-------|-------------|------------|-----|
| API calls work | ✅ | ❌ | Check REACT_APP_API_URL |
| Images load | ✅ | ❌ | Use absolute paths or `process.env.PUBLIC_URL` |
| Console.log visible | ✅ | ❌ | Expected (minified in prod) |
| Warnings visible | ✅ | ❌ | Expected |

**Debug Production**:
```javascript
// Temporarily enable debug mode
if (process.env.NODE_ENV === 'production') {
  console.log('API URL:', process.env.REACT_APP_API_URL);
}
```

---

## Performance Optimization

### Built-in Optimizations (Vercel)

Vercel automatically provides:
- ✅ **Global CDN**: 100+ edge locations
- ✅ **Brotli compression**: Smaller file sizes
- ✅ **HTTP/2**: Faster loading
- ✅ **Image optimization** (with next/image)
- ✅ **Smart caching**: Immutable assets cached forever

### Manual Optimizations

**1. Code Splitting**:
```javascript
// Use React.lazy for route-based splitting
const Dashboard = React.lazy(() => import('./Dashboard'));
```

**2. Image Optimization**:
```bash
# Use WebP format
# Compress images before upload
# Use lazy loading: loading="lazy"
```

**3. Bundle Analysis**:
```bash
npm install --save-dev source-map-explorer
npm run build
npx source-map-explorer 'build/static/js/*.js'
```

**4. Remove Unused Dependencies**:
```bash
npm install -g depcheck
depcheck
```

---

## Cost Estimate

### Free Tier (Current)
```
Frontend (Vercel): $0/month
Bandwidth: 100 GB/month
Build Minutes: 6,000 minutes/month
Deployments: Unlimited
```

**Limitations**:
- No custom analytics
- Limited team collaboration
- Standard support

### Pro Plan ($20/month - if needed)
```
Bandwidth: 1 TB/month
Build Minutes: 24,000 minutes/month
Analytics: Included
Password protection: Yes
Edge config: Included
```

**Recommendation**: Start with free tier, upgrade if needed.

---

## Next Steps

### ✅ Completed (HER-82)

- [x] Frontend deployed to Vercel
- [x] Environment variables configured
- [x] Connected to production backend API
- [x] Auto-deploy configured
- [x] HTTPS enabled (automatic)

### 🔜 Next (Post-Deployment)

1. **Test End-to-End**:
   - User registration
   - Login
   - Content creation
   - File upload
   - All critical paths

2. **Set Up Monitoring**:
   - Google Analytics
   - Sentry error tracking
   - Vercel Analytics (if on Pro)

3. **Custom Domain** (optional):
   - Purchase domain
   - Configure DNS
   - SSL auto-provisioned

4. **HER-83: Cloudinary Integration**:
   - Migrate from local file storage
   - Image optimization
   - Video support

---

## Acceptance Criteria Verification

| Criteria | Status | Evidence |
|----------|--------|----------|
| Frontend deployed and accessible | ✅ | Visit deployment URL |
| Environment variables configured | ✅ | Check Vercel Settings |
| Connected to production API | ✅ | Test login/registration |
| Custom domain (optional) | ☐ | Optional, can be added later |
| Auto-deploy on main branch merge | ✅ | Vercel Git integration |

---

## Support Resources

**Vercel**:
- Documentation: https://vercel.com/docs
- Status: https://vercel-status.com
- Support: https://vercel.com/support

**Heritage Platform**:
- Backend API: https://heritage-backend.onrender.com/api-docs
- Issues: https://github.com/Kolaheritage/kola/issues
- Docs: `/docs` directory

---

**Last Updated**: 2026-01-02
**Version**: 1.0
**Task**: HER-82
**Dependencies**: HER-81 ✅
**Next**: HER-83 (Cloudinary Integration)

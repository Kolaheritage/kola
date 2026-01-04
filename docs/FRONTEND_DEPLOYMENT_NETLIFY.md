# Frontend Deployment to Netlify

**HER-82**: Frontend Deployment Setup

This guide covers deploying the Heritage Platform frontend (React application) to **Netlify**.

---

## Table of Contents

1. [Overview](#overview)
2. [Why Netlify?](#why-netlify)
3. [Prerequisites](#prerequisites)
4. [Deployment Methods](#deployment-methods)
   - [Method 1: Netlify UI (Quickest)](#method-1-netlify-ui-quickest)
   - [Method 2: Netlify CLI](#method-2-netlify-cli)
   - [Method 3: GitHub Actions CI/CD](#method-3-github-actions-cicd)
5. [Configuration Files](#configuration-files)
6. [Environment Variables](#environment-variables)
7. [Custom Domain Setup](#custom-domain-setup)
8. [HTTPS & Security](#https--security)
9. [Performance Optimization](#performance-optimization)
10. [Monitoring & Analytics](#monitoring--analytics)
11. [Troubleshooting](#troubleshooting)
12. [Cost Optimization](#cost-optimization)

---

## Overview

**What is Netlify?**

Netlify is a modern cloud platform for deploying and hosting web applications with:
- **Global CDN**: Fast content delivery worldwide
- **Automatic deployments**: Deploy on every git push
- **Built-in CI/CD**: Build and deploy without additional setup
- **Preview deployments**: Test changes before merging
- **Forms & Functions**: Serverless capabilities
- **Free SSL**: Automatic HTTPS certificates

**Architecture**:
```
┌─────────────────┐
│   GitHub Repo   │
│  (main branch)  │
└────────┬────────┘
         │ Push
         ▼
┌─────────────────┐
│  Netlify Build  │
│   (CI/CD)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Global CDN     │
│  (Edge Network) │
└────────┬────────┘
         │
         ▼
     Users 🌍
```

---

## Why Netlify?

### Advantages

✅ **Free Tier**:
- 100 GB bandwidth/month
- 300 build minutes/month
- Unlimited sites
- Free SSL certificates

✅ **Easy Setup**:
- Deploy in 3 clicks from GitHub
- No configuration required
- Automatic builds

✅ **Developer Experience**:
- Deploy previews for every PR
- Branch deploys
- Instant rollbacks
- Build notifications

✅ **Performance**:
- Global CDN with edge caching
- Automatic asset optimization
- HTTP/2 and HTTP/3
- Brotli compression

✅ **Built-in Features**:
- Forms handling
- Serverless functions
- Split testing
- Analytics

### Comparison with Alternatives

| Feature | Netlify | Vercel | AWS S3 + CloudFront |
|---------|---------|--------|---------------------|
| Setup Difficulty | ⭐ Easy | ⭐ Easy | ⭐⭐⭐ Complex |
| Free Tier | ✅ Generous | ✅ Good | ⚠️ Limited |
| Build Minutes | 300/month | 6000/month | N/A |
| CDN | ✅ Global | ✅ Global | ✅ Global |
| Deploy Previews | ✅ Yes | ✅ Yes | ❌ No |
| Forms | ✅ Built-in | ❌ No | ❌ No |
| Functions | ✅ Yes | ✅ Yes | ⚠️ Lambda |
| Learning Curve | Low | Low | High |

---

## Prerequisites

### 1. Accounts & Access

- **GitHub Account**: Repository access
- **Netlify Account**: Sign up at [netlify.com](https://www.netlify.com/)
- **Backend URL**: Deployed backend API (from HER-81)

### 2. Frontend Requirements

Ensure your frontend builds successfully:
```bash
cd frontend
npm install
npm run build
```

Expected output:
```
Creating an optimized production build...
Compiled successfully!

File sizes after gzip:
  XX.XX kB  build/static/js/main.xxxxxxxx.js
  XX.XX kB  build/static/css/main.xxxxxxxx.css
```

### 3. Required Files

- ✅ `netlify.toml` (in project root)
- ✅ `frontend/.env.production.example`
- ✅ `frontend/.env.netlify.example`

---

## Deployment Methods

### Method 1: Netlify UI (Quickest)

**Best for**: First-time setup, quick deployments

#### Step 1: Import from GitHub

1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **"Deploy with GitHub"**
4. Authorize Netlify to access your GitHub account
5. Select repository: `Kolaheritage/kola`

#### Step 2: Configure Build Settings

Netlify will auto-detect settings from `netlify.toml`, but verify:

- **Base directory**: `/`
- **Build command**: `cd frontend && npm install && npm run build`
- **Publish directory**: `frontend/build`
- **Production branch**: `main`

Click **"Deploy site"**

#### Step 3: Set Environment Variables

1. In Netlify Dashboard → **Site Settings** → **Environment Variables**
2. Add variables:

```
REACT_APP_API_URL = https://heritage-backend.onrender.com
REACT_APP_ENV = production
NODE_VERSION = 18
```

3. Click **"Save"**

#### Step 4: Trigger Redeploy

Since environment variables changed:
1. Go to **Deploys** tab
2. Click **"Trigger deploy"** → **"Deploy site"**

✅ **Done!** Your site will be live at: `https://random-name-123456.netlify.app`

---

### Method 2: Netlify CLI

**Best for**: Local testing, automation, scripting

#### Step 1: Install Netlify CLI

```bash
npm install -g netlify-cli
```

#### Step 2: Login

```bash
netlify login
```

This opens a browser for authentication.

#### Step 3: Initialize Site

```bash
# From project root
netlify init
```

Choose options:
- **Create & configure a new site**
- **Team**: Your Netlify team
- **Site name**: `heritage-platform` (or custom)
- **Build command**: `cd frontend && npm ci && npm run build`
- **Directory to deploy**: `frontend/build`

#### Step 4: Set Environment Variables

```bash
# Set API URL
netlify env:set REACT_APP_API_URL "https://heritage-backend.onrender.com"

# Set environment
netlify env:set REACT_APP_ENV "production"

# Set Node version
netlify env:set NODE_VERSION "18"
```

#### Step 5: Deploy

```bash
# Deploy to production
netlify deploy --prod

# Or deploy for preview first
netlify deploy
# (Review the preview URL, then run --prod to publish)
```

#### Useful CLI Commands

```bash
# Check build locally
netlify build

# Run dev server with Netlify functions
netlify dev

# View site info
netlify status

# Open site in browser
netlify open

# View environment variables
netlify env:list

# Link existing site
netlify link
```

---

### Method 3: GitHub Actions CI/CD

**Best for**: Production deployments, automated workflows

The repository already includes `.github/workflows/deploy-frontend.yml` configured for Netlify.

#### Step 1: Get Netlify Credentials

1. **Personal Access Token**:
   - Go to [Netlify User Settings → Applications](https://app.netlify.com/user/applications)
   - Click **"New access token"**
   - Name: `GitHub Actions`
   - Copy the token

2. **Site ID**:
   - Go to Site Settings → General → Site details
   - Copy **Site ID** (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

#### Step 2: Add GitHub Secrets

1. Go to GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Add secrets:

```
NETLIFY_AUTH_TOKEN = <your-personal-access-token>
NETLIFY_SITE_ID = <your-site-id>
REACT_APP_API_URL = https://heritage-backend.onrender.com
```

#### Step 3: Configure Workflow (Already Done)

The workflow in `.github/workflows/deploy-frontend.yml` will:

- ✅ Trigger on push to `main` branch (frontend changes only)
- ✅ Allow manual deployment via workflow dispatch
- ✅ Build frontend
- ✅ Run tests
- ✅ Deploy to Netlify
- ✅ Run health checks

#### Step 4: Deploy

**Automatic deployment**:
```bash
# Make changes to frontend
git add frontend/
git commit -m "Update frontend"
git push origin main

# Workflow triggers automatically
```

**Manual deployment**:
1. Go to GitHub → **Actions**
2. Select **"Deploy Frontend"** workflow
3. Click **"Run workflow"**
4. Choose environment: `staging` or `production`
5. Click **"Run workflow"**

#### Step 5: Monitor Deployment

- **GitHub Actions**: Check workflow progress
- **Netlify Dashboard**: View deploy logs
- **Deploy URL**: Posted in workflow output

---

## Configuration Files

### netlify.toml

Located in project root. Defines build settings, redirects, headers.

```toml
[build]
  command = "cd frontend && npm install && npm run build"
  publish = "frontend/build"

  [build.environment]
    NODE_VERSION = "18"

# SPA routing
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Security headers
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"

# Cache static assets
[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

**Key sections**:

1. **Build Settings**: Commands and environment
2. **Redirects**: SPA routing support (all routes → `index.html`)
3. **Headers**: Security and caching
4. **Context**: Different settings for production/preview/branch deploys

### package.json (frontend)

Ensure these scripts exist:

```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test --passWithNoTests",
    "eject": "react-scripts eject"
  }
}
```

---

## Environment Variables

### Required Variables

| Variable | Description | Example | Where to Set |
|----------|-------------|---------|--------------|
| `REACT_APP_API_URL` | Backend API URL | `https://heritage-backend.onrender.com` | Netlify UI |
| `REACT_APP_ENV` | Environment name | `production`, `staging` | Netlify UI |
| `NODE_VERSION` | Node.js version | `18` | netlify.toml |

### Optional Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_GA_TRACKING_ID` | Google Analytics | `UA-XXXXXXXXX-X` |
| `REACT_APP_SENTRY_DSN` | Sentry error tracking | `https://xxx@sentry.io/xxx` |
| `REACT_APP_ENABLE_ANALYTICS` | Feature flag | `true` |

### Setting Environment Variables

#### Via Netlify UI (Recommended)

1. **Site Settings** → **Environment Variables**
2. Click **"Add a variable"**
3. Enter key and value
4. Choose scope:
   - **All deploys**: All environments
   - **Production**: Only production (main branch)
   - **Deploy previews**: Only PR deploys
   - **Branch deploys**: Specific branches

#### Via Netlify CLI

```bash
netlify env:set VAR_NAME "value"

# Set for specific context
netlify env:set VAR_NAME "value" --context production
netlify env:set VAR_NAME "value" --context deploy-preview
```

#### Via netlify.toml (Non-Sensitive Only)

```toml
[build.environment]
  NODE_VERSION = "18"
  REACT_APP_ENV = "production"

# Context-specific
[context.production.environment]
  REACT_APP_API_URL = "https://api.heritage.com"

[context.deploy-preview.environment]
  REACT_APP_API_URL = "https://staging-api.heritage.com"
```

⚠️ **Warning**: Don't put secrets in `netlify.toml` (it's committed to git!)

### Environment Variable Scopes

Netlify supports **deploy contexts**:

1. **Production**: `main` branch
2. **Deploy Previews**: Pull request builds
3. **Branch Deploys**: Other branches

Example setup:
```
Production:          REACT_APP_API_URL = https://api.heritage.com
Deploy Previews:     REACT_APP_API_URL = https://staging-api.heritage.com
Branch Deploys:      REACT_APP_API_URL = https://dev-api.heritage.com
```

---

## Custom Domain Setup

### Step 1: Add Custom Domain

1. **Site Settings** → **Domain management**
2. Click **"Add custom domain"**
3. Enter domain: `heritage.com` or `www.heritage.com`
4. Click **"Verify"**

### Step 2: Configure DNS

Netlify will provide DNS records. Add them to your domain provider:

**Option A: Netlify DNS (Recommended)**

1. Click **"Use Netlify DNS"**
2. Get nameservers (e.g., `dns1.p03.nsone.net`)
3. Update nameservers at domain registrar
4. Wait for propagation (up to 24 hours)

**Option B: External DNS**

Add these records to your DNS provider:

```
# For apex domain (heritage.com)
Type: A
Name: @
Value: 75.2.60.5

# For www subdomain
Type: CNAME
Name: www
Value: random-name-123456.netlify.app

# For SSL (optional)
Type: CAA
Name: @
Value: 0 issue "letsencrypt.org"
```

### Step 3: Enable HTTPS

1. Wait for DNS propagation
2. Netlify auto-provisions SSL (Let's Encrypt)
3. **Site Settings** → **Domain management** → **HTTPS**
4. Enable **"Force HTTPS"** (redirects HTTP → HTTPS)

### Step 4: Verify

```bash
curl -I https://heritage.com
# Should return 200 OK with Netlify headers
```

---

## HTTPS & Security

### Automatic SSL

Netlify provides free SSL certificates via **Let's Encrypt**:

- ✅ Auto-renewal (every 90 days)
- ✅ Wildcard certificates for subdomains
- ✅ No configuration needed

### Security Headers

Already configured in `netlify.toml`:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    # Prevent clickjacking
    X-Frame-Options = "SAMEORIGIN"

    # Prevent MIME sniffing
    X-Content-Type-Options = "nosniff"

    # Enable XSS protection
    X-XSS-Protection = "1; mode=block"

    # Referrer policy
    Referrer-Policy = "strict-origin-when-cross-origin"

    # Content Security Policy (optional, customize as needed)
    # Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline';"
```

### Test Security

Use [securityheaders.com](https://securityheaders.com):

```bash
# Should get A or A+ rating
https://securityheaders.com/?q=heritage.com
```

### Additional Security

**Enable in Netlify UI**:

1. **Site Settings** → **Build & deploy** → **Post processing**
2. Enable:
   - ✅ **Asset optimization**: Minify CSS/JS
   - ✅ **Pretty URLs**: Remove `.html` extensions
   - ✅ **Bundle optimization**: Compress assets

---

## Performance Optimization

### 1. Asset Optimization

**Netlify automatically**:
- ✅ Minifies CSS and JavaScript
- ✅ Compresses images
- ✅ Serves Brotli/Gzip compression
- ✅ Uses HTTP/2

**Enable in UI**:
- **Site Settings** → **Build & deploy** → **Post processing**
- Enable all optimizations

### 2. Caching Strategy

Configured in `netlify.toml`:

```toml
# Cache static assets forever (they have content hashes)
[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# Don't cache HTML (for updates)
[[headers]]
  for = "/*.html"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
```

### 3. CDN Edge Caching

Netlify's global CDN automatically caches static assets at edge locations:

- **North America**: 15+ locations
- **Europe**: 10+ locations
- **Asia**: 8+ locations
- **Australia**: 2+ locations

### 4. Code Splitting

React automatically code-splits with dynamic imports:

```javascript
// Lazy load components
const Dashboard = React.lazy(() => import('./Dashboard'));

<Suspense fallback={<Loading />}>
  <Dashboard />
</Suspense>
```

### 5. Prerendering (Optional)

For better SEO, enable prerendering:

```toml
# netlify.toml
[[plugins]]
  package = "@netlify/plugin-lighthouse"

[[plugins]]
  package = "netlify-plugin-prerender-spa"
  [plugins.inputs]
    publicPath = "/"
```

Install:
```bash
npm install --save-dev netlify-plugin-prerender-spa
```

### 6. Performance Monitoring

Use **Netlify Analytics** (paid) or integrate:

- **Google Analytics**
- **Lighthouse CI**
- **Web Vitals**

---

## Monitoring & Analytics

### 1. Netlify Analytics (Paid)

Built-in analytics without client-side JavaScript:

- **Pricing**: $9/month per site
- **Features**:
  - Page views
  - Unique visitors
  - Top pages
  - Bandwidth usage
  - No performance impact

**Enable**:
- **Site Settings** → **Analytics** → **Enable analytics**

### 2. Google Analytics (Free)

Add to `frontend/public/index.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=UA-XXXXXXXXX-X"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'UA-XXXXXXXXX-X');
</script>
```

Or use environment variable approach:

```javascript
// src/index.js
if (process.env.REACT_APP_GA_TRACKING_ID) {
  ReactGA.initialize(process.env.REACT_APP_GA_TRACKING_ID);
  ReactGA.pageview(window.location.pathname);
}
```

### 3. Deploy Notifications

Get notified on deploy success/failure:

**Slack Integration**:
1. **Site Settings** → **Build & deploy** → **Deploy notifications**
2. Click **"Add notification"** → **Slack**
3. Configure webhook URL

**Email Notifications**:
- Automatic for deploy failures
- Configure in **Team Settings**

### 4. Uptime Monitoring

Use external services:

- **UptimeRobot** (free): Basic uptime monitoring
- **Pingdom**: Advanced monitoring
- **StatusCake**: Free tier available

Setup:
```bash
# Monitor URL
https://heritage.com

# Check interval: 5 minutes
# Alert on: Down, SSL errors
```

---

## Troubleshooting

### Common Issues

#### 1. Build Fails: "Command not found: npm"

**Error**:
```
build.command failed
npm: command not found
```

**Solution**:
Set Node version in `netlify.toml`:
```toml
[build.environment]
  NODE_VERSION = "18"
```

#### 2. Build Fails: "Module not found"

**Error**:
```
Module not found: Can't resolve './Component'
```

**Solution**:
- Check import paths (case-sensitive)
- Ensure all dependencies in `package.json`
- Try clean build:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  npm run build
  ```

#### 3. 404 on Page Refresh (SPA Routing)

**Error**:
- Initial load works
- Page refresh returns 404

**Solution**:
Add redirect in `netlify.toml`:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### 4. Environment Variables Not Working

**Error**:
```
process.env.REACT_APP_API_URL is undefined
```

**Solution**:
- ✅ Variables must start with `REACT_APP_`
- ✅ Set in Netlify UI (not just locally)
- ✅ Redeploy after setting (env vars embedded at build time)

Verify:
```bash
# In build logs, check
echo $REACT_APP_API_URL
```

#### 5. API Calls Fail (CORS)

**Error**:
```
Access to fetch at 'https://backend.com/api' from origin 'https://heritage.netlify.app'
has been blocked by CORS policy
```

**Solution**:
Update backend CORS config:
```javascript
// backend/src/index.js
app.use(cors({
  origin: [
    'https://heritage.netlify.app',
    'https://heritage.com',
    'https://deploy-preview-*--heritage.netlify.app'  // For PR previews
  ]
}));
```

#### 6. Slow Build Times

**Symptoms**:
- Build takes >5 minutes
- Timeout errors

**Solution**:

1. **Use npm ci instead of npm install**:
   ```toml
   [build]
     command = "cd frontend && npm ci && npm run build"
   ```

2. **Clear cache**:
   - Netlify UI → **Deploys** → **Trigger deploy** → **Clear cache and deploy site**

3. **Optimize dependencies**:
   ```bash
   # Remove unused packages
   npm prune

   # Check bundle size
   npm run build -- --stats
   ```

#### 7. Deploy Preview Not Created

**Symptoms**:
- PR opened but no deploy preview

**Solution**:
1. Check **Site Settings** → **Build & deploy** → **Deploy contexts**
2. Enable **"Deploy previews"**
3. Ensure branch is not in ignore list

### Debugging Tools

#### 1. Build Logs

View detailed logs:
```bash
# Via CLI
netlify watch

# Via UI
Deploys → [Select deploy] → Deploy log
```

#### 2. Netlify Dev (Local Testing)

Test locally with Netlify environment:
```bash
netlify dev
# Runs on http://localhost:8888 with Netlify features
```

#### 3. Deploy Previews

Test changes before merging:
1. Open PR
2. Wait for deploy preview
3. Click preview link in PR
4. Test thoroughly

#### 4. Function Logs

If using Netlify Functions:
```bash
netlify functions:log <function-name>
```

### Getting Help

- **Netlify Support**: https://www.netlify.com/support/
- **Community Forums**: https://answers.netlify.com/
- **Documentation**: https://docs.netlify.com/
- **Status Page**: https://www.netlifystatus.com/

---

## Cost Optimization

### Free Tier Limits

| Resource | Free Tier | Overages |
|----------|-----------|----------|
| **Bandwidth** | 100 GB/month | $55/TB |
| **Build Minutes** | 300/month | $7/500 min |
| **Sites** | Unlimited | - |
| **Team Members** | 1 | Paid plans |
| **Functions** | 125k calls/month | $25/2M |

### Optimization Tips

#### 1. Reduce Build Minutes

```toml
# Use npm ci (faster)
[build]
  command = "cd frontend && npm ci && npm run build"

# Skip unnecessary builds
[build]
  ignore = "git diff --quiet HEAD^ HEAD frontend/"
```

#### 2. Optimize Assets

- ✅ Use WebP images (smaller than PNG/JPEG)
- ✅ Lazy load images
- ✅ Code splitting
- ✅ Tree shaking (remove unused code)

#### 3. Monitor Usage

Check **Team Overview** → **Usage**:
- Bandwidth usage
- Build minutes used
- Function calls

#### 4. Use Branch Deploys Wisely

Disable branch deploys for feature branches:
```toml
[build]
  # Only deploy main and develop branches
  ignore = "git branch --show-current | grep -E '^(main|develop)$'"
```

---

## Next Steps

After successful deployment:

✅ **1. Update Backend CORS**:
   - Add Netlify URL to allowed origins

✅ **2. Set Up Custom Domain**:
   - Follow [Custom Domain Setup](#custom-domain-setup)

✅ **3. Enable Monitoring**:
   - Set up Google Analytics
   - Configure deploy notifications

✅ **4. Test Thoroughly**:
   - Run through [HER-82 Checklist](./HER-82_CHECKLIST.md)

✅ **5. Document URLs**:
   - Update `frontend/README.md` with production URL

---

## Related Documentation

- [HER-82 Checklist](./HER-82_CHECKLIST.md) - Deployment verification
- [Backend Deployment (HER-81)](./BACKEND_DEPLOYMENT_RENDER.md) - Backend setup
- [CI/CD Setup](./CI_CD_SETUP.md) - GitHub Actions workflows
- [Netlify Documentation](https://docs.netlify.com/) - Official docs

---

## Summary

**Netlify Deployment Checklist**:

- [ ] Sign up for Netlify account
- [ ] Connect GitHub repository
- [ ] Configure build settings (auto-detected from `netlify.toml`)
- [ ] Set environment variables (`REACT_APP_API_URL`)
- [ ] Deploy to production
- [ ] Set up custom domain (optional)
- [ ] Enable HTTPS
- [ ] Configure deploy notifications
- [ ] Update backend CORS
- [ ] Test deployment

**Resources**:

- **Netlify Dashboard**: https://app.netlify.com/
- **Deploy URL**: `https://<your-site>.netlify.app`
- **Documentation**: This file + [Netlify Docs](https://docs.netlify.com/)

---

**Version**: 1.0
**Last Updated**: 2026-01-02
**Status**: Production Ready ✅

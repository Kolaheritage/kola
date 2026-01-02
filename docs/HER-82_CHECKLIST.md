# HER-82: Frontend Deployment Checklist

Use this checklist to ensure complete and successful frontend deployment to Vercel.

---

## Pre-Deployment Checklist

### Backend Verification (HER-81)
- [ ] Backend deployed to Render
- [ ] Backend URL accessible: `https://heritage-backend.onrender.com`
- [ ] Backend health check passing: `/health`
- [ ] Backend API responding: `/api`
- [ ] Backend CORS configured for frontend domain

### Code Readiness
- [ ] All tests passing locally (`npm test`)
- [ ] Build succeeds locally (`npm run build`)
- [ ] No console errors in development
- [ ] Environment variables documented
- [ ] Production API URL ready

### Accounts & Access
- [ ] GitHub account with repository access
- [ ] Vercel account created
- [ ] GitHub connected to Vercel

---

## Deployment Steps

### 1. Vercel Project Setup
- [ ] New Project created in Vercel
- [ ] Repository connected: `Kolaheritage/kola`
- [ ] Framework detected: Create React App
- [ ] Root directory set to: `frontend` ⚠️ CRITICAL!

### 2. Build Configuration
- [ ] Build command: `npm run build` (auto-detected)
- [ ] Output directory: `build` (auto-detected)
- [ ] Install command: `npm install` (auto-detected)
- [ ] Node version: 18.x

### 3. Environment Variables

**Required Variables**:
- [ ] `REACT_APP_API_URL` = `https://heritage-backend.onrender.com/api`
  - ⚠️ Must include `/api` at the end
  - ⚠️ Must start with `REACT_APP_`
  - Applied to: Production, Preview, Development

**Optional Variables** (add as needed):
- [ ] `REACT_APP_GA_TRACKING_ID` (if using Google Analytics)
- [ ] `REACT_APP_SENTRY_DSN` (if using Sentry)

### 4. Deployment Settings
- [ ] Auto-deploy enabled for `main` branch
- [ ] Preview deployments enabled
- [ ] Build & Development Settings configured

### 5. Initial Deployment
- [ ] Click "Deploy" button
- [ ] Wait for build (~2-3 minutes)
- [ ] Build completes successfully
- [ ] Deployment URL received

---

## Post-Deployment Verification

### Automatic Checks
- [ ] Build completed without errors
- [ ] No build warnings (or acceptable)
- [ ] Deployment status: Ready
- [ ] Deployment URL accessible

### Manual Testing

**Frontend Accessibility**:
```bash
curl https://your-frontend.vercel.app
```
- [ ] Returns 200 status code
- [ ] HTML contains `<div id="root">`
- [ ] No 404 or 500 errors

**Static Assets**:
```bash
curl https://your-frontend.vercel.app/favicon.ico
curl https://your-frontend.vercel.app/manifest.json
```
- [ ] Favicon loads (200)
- [ ] Manifest loads (200)

**SPA Routing**:
- [ ] Visit: `https://your-frontend.vercel.app/about`
- [ ] Should load (not 404)
- [ ] React app renders correctly

**Environment Variables (Browser)**:
```javascript
// Open DevTools Console
console.log(process.env.REACT_APP_API_URL)
```
- [ ] Outputs correct backend URL
- [ ] Includes `/api` at the end
- [ ] No `undefined` values

**Backend Connection**:
1. Open Network tab in DevTools
2. Navigate around the app
3. Check API calls:
   - [ ] Requests go to correct backend URL
   - [ ] No CORS errors
   - [ ] Responses are 200 OK (or expected)

**Authentication Flow**:
1. Navigate to Register page
2. Fill in registration form:
   ```
   Email: test@example.com
   Username: testuser
   Password: TestPass123!
   ```
3. Submit
   - [ ] Registration successful
   - [ ] POST to `/api/auth/register` succeeds
   - [ ] Redirected correctly
   - [ ] Token stored (check localStorage/cookies)

**Login Flow**:
1. Navigate to Login page
2. Use credentials from registration
3. Submit
   - [ ] Login successful
   - [ ] POST to `/api/auth/login` succeeds
   - [ ] Redirected to dashboard
   - [ ] User state updated

**Content Display**:
- [ ] Categories load (if any exist)
- [ ] Content loads (if any exists)
- [ ] Images display correctly
- [ ] Pagination works (if applicable)

**Run Verification Script**:
```bash
./scripts/verify-frontend.sh https://your-frontend.vercel.app https://heritage-backend.onrender.com
```
- [ ] All tests pass
- [ ] Success rate: 100%

---

## Auto-Deploy Verification

### Test Auto-Deploy
1. Make minor change to frontend (e.g., update README)
2. Commit and push to main branch
3. Check Vercel dashboard:
   - [ ] New deployment triggered automatically
   - [ ] Build starts within 1 minute
   - [ ] Build completes successfully
   - [ ] New deployment goes live

### Preview Deployments
1. Create a new branch: `test-preview`
2. Make changes and push
3. Create Pull Request
4. Check PR:
   - [ ] Vercel bot comments with preview URL
   - [ ] Preview deployment builds successfully
   - [ ] Preview URL accessible
   - [ ] Changes visible in preview

---

## Monitoring Setup (Optional but Recommended)

### Vercel Analytics (Paid feature)
- [ ] Enabled in Vercel dashboard
- [ ] Web Vitals tracking active
- [ ] Real User Monitoring data collecting

### Google Analytics (Free)
- [ ] GA account created
- [ ] Tracking ID obtained
- [ ] Added to environment variables
- [ ] Integrated in app (react-ga or gtag.js)
- [ ] Test event tracked successfully

### Sentry Error Tracking (Free tier)
- [ ] Sentry project created
- [ ] DSN obtained
- [ ] Added to environment variables
- [ ] SDK installed: `@sentry/react`
- [ ] Test error sent to Sentry
- [ ] Alerts configured

### External Uptime Monitoring
- [ ] UptimeRobot monitor created
- [ ] Check interval: 5 minutes
- [ ] Alert email configured
- [ ] Test alert works

---

## Performance Checks

### Lighthouse Audit
1. Open DevTools → Lighthouse tab
2. Run audit for:
   - [ ] Performance: ≥90
   - [ ] Accessibility: ≥90
   - [ ] Best Practices: ≥90
   - [ ] SEO: ≥80

### Page Load Speed
- [ ] Initial load: <3 seconds
- [ ] Subsequent loads: <1 second
- [ ] API calls: <2 seconds response

### Bundle Size
```bash
npm run build
# Check build output
```
- [ ] Main chunk: <500 KB
- [ ] Vendor chunk: <1 MB
- [ ] Total size reasonable

### Network Analysis
1. Open Network tab
2. Reload page
3. Check:
   - [ ] No failed requests (404, 500)
   - [ ] Static assets cached (from disk cache)
   - [ ] Gzip/Brotli compression active
   - [ ] No excessive requests (< 50 initial)

---

## Security Checks

### HTTPS
- [ ] Deployment uses HTTPS
- [ ] Valid SSL certificate (Vercel auto-provisioned)
- [ ] No mixed content warnings

### Security Headers
Check in Network tab → Response Headers:
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Frame-Options: SAMEORIGIN`
- [ ] `X-XSS-Protection: 1; mode=block`
- [ ] `Referrer-Policy` present

### Environment Variables
- [ ] No secrets in frontend code
- [ ] API URL not hardcoded
- [ ] No console.log with sensitive data
- [ ] .env files not committed to git

### API Security
- [ ] Backend validates all requests
- [ ] CORS properly configured
- [ ] Authentication tokens stored securely
- [ ] No API keys exposed in frontend

---

## Documentation

- [ ] Deployment URL documented
- [ ] Environment variables documented
- [ ] Deployment procedure documented
- [ ] Troubleshooting steps documented
- [ ] Rollback procedure documented

---

## Custom Domain (Optional)

If setting up custom domain:
- [ ] Domain purchased/available
- [ ] Domain added in Vercel
- [ ] DNS records configured
- [ ] SSL certificate provisioned
- [ ] Domain verified
- [ ] Set as production domain

---

## Acceptance Criteria (HER-82)

Final verification that all acceptance criteria are met:

| Criteria | Status | Evidence |
|----------|--------|----------|
| Frontend deployed and accessible | ☐ | Visit deployment URL, loads correctly |
| Environment variables configured | ☐ | Check Vercel dashboard & console.log |
| Connected to production API | ☐ | Login/register works, API calls succeed |
| Custom domain (optional) | ☐ | N/A or configured |
| Auto-deploy on main branch merge | ☐ | Push to main triggers deployment |

---

## Browser Compatibility

Test in multiple browsers:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

---

## Responsive Design

Test on different screen sizes:
- [ ] Mobile (375px): iPhone SE
- [ ] Mobile (414px): iPhone Pro Max
- [ ] Tablet (768px): iPad
- [ ] Tablet (1024px): iPad Pro
- [ ] Desktop (1920px): Standard monitor
- [ ] Desktop (2560px): Large monitor

---

## Next Steps (Post-HER-82)

After frontend deployment is complete:

### Immediate
- [ ] Share deployment URL with team
- [ ] Test all critical user flows
- [ ] Monitor error logs for first 24 hours

### Short-term (Week 1)
- [ ] Set up monitoring and alerts
- [ ] Configure custom domain (if needed)
- [ ] Run performance optimizations
- [ ] Fix any bugs discovered in production

### Medium-term (Month 1)
- [ ] Proceed with HER-83: Cloudinary Integration
- [ ] Implement analytics and tracking
- [ ] Set up A/B testing (if needed)
- [ ] Plan performance improvements

---

## Troubleshooting Reference

If any checks fail, refer to:
- **Deployment Guide**: `docs/FRONTEND_DEPLOYMENT_VERCEL.md`
- **CI/CD Setup**: `docs/CI_CD_SETUP.md`
- **Quick Start**: `docs/DEPLOYMENT_QUICK_START.md`
- **Backend Deployment**: `docs/BACKEND_DEPLOYMENT_RENDER.md`

Common issues:
- **Build fails**: Check package.json scripts, dependencies
- **Blank page**: Check homepage in package.json, router basename
- **API calls fail**: Verify REACT_APP_API_URL, check CORS
- **404 on refresh**: Ensure SPA rewrites configured (vercel.json)
- **Env vars not working**: Must start with REACT_APP_, redeploy after adding

---

## Sign-Off

Deployment completed by: ________________

Date: ________________

Frontend URL: ________________

Backend URL: ________________

All checks passed: ☐ Yes  ☐ No (see notes)

Notes:
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

---

**Last Updated**: 2026-01-02
**Task**: HER-82
**Status**: Ready for deployment
**Dependencies**: HER-81 ✅

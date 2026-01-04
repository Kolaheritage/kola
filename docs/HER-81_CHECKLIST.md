# HER-81: Backend Deployment Checklist

Use this checklist to ensure complete and successful backend deployment to Render.

---

## Pre-Deployment Checklist

### Database Setup (HER-80)
- [ ] Supabase project created
- [ ] Database credentials saved securely
- [ ] Migrations run on production database
- [ ] Database connection tested from local machine
- [ ] Backup strategy documented

### Code Readiness
- [ ] All tests passing locally (`npm test`)
- [ ] TypeScript compiles without errors (`npm run build`)
- [ ] Environment variables documented
- [ ] Health check endpoint working (`/health`)
- [ ] API documentation accessible (`/api-docs`)

### Accounts & Access
- [ ] GitHub account with repository access
- [ ] Render account created
- [ ] GitHub connected to Render

---

## Deployment Steps

### 1. Render Setup
- [ ] New Blueprint or Web Service created
- [ ] Repository connected: `Kolaheritage/kola`
- [ ] Branch set to: `main`
- [ ] Root directory set to: `backend`

### 2. Build Configuration
- [ ] Runtime: Node
- [ ] Build command: `npm ci && npm run build`
- [ ] Start command: `npm start`
- [ ] Health check path: `/health`

### 3. Environment Variables

**Node Configuration**:
- [ ] `NODE_ENV` = `production`
- [ ] `BACKEND_PORT` = `5002`

**Database (Supabase)**:
- [ ] `DB_HOST` = `db.xxx.supabase.co`
- [ ] `DB_PORT` = `5432`
- [ ] `DB_USER` = `postgres`
- [ ] `DB_PASSWORD` = `<secure-password>` (mark as secret)
- [ ] `DB_NAME` = `postgres`

**JWT Configuration**:
- [ ] `JWT_SECRET` = `<generated-secure-string>` (mark as secret)
- [ ] `JWT_EXPIRES_IN` = `7d`

**File Upload**:
- [ ] `MAX_FILE_SIZE` = `104857600`
- [ ] `UPLOAD_PATH` = `./uploads`

### 4. Deployment Settings
- [ ] Auto-deploy enabled
- [ ] Branch: `main`
- [ ] Region selected (e.g., Oregon)
- [ ] Instance type: Free (or paid plan)

---

## Post-Deployment Verification

### Automatic Checks
- [ ] Build completed successfully (check logs)
- [ ] Service started without errors
- [ ] Health check passing (green status)
- [ ] Service URL accessible

### Manual Testing

**Health Check**:
```bash
curl https://your-backend.onrender.com/health
```
- [ ] Returns 200 status code
- [ ] Response contains `"status": "healthy"`
- [ ] Database status is `"connected"`

**API Info**:
```bash
curl https://your-backend.onrender.com/api
```
- [ ] Returns 200 status code
- [ ] Shows API version and endpoints

**Swagger Documentation**:
- [ ] Visit `https://your-backend.onrender.com/api-docs`
- [ ] Swagger UI loads correctly
- [ ] All endpoints documented

**Authentication Test**:
```bash
# Register test user
curl -X POST https://your-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"TestPass123!"}'
```
- [ ] User registration successful
- [ ] Returns JWT token
- [ ] User appears in Supabase database

**Categories Endpoint**:
```bash
curl https://your-backend.onrender.com/api/categories
```
- [ ] Returns 200 status code
- [ ] Returns array (may be empty)

**Run Verification Script**:
```bash
./scripts/verify-deployment.sh https://your-backend.onrender.com
```
- [ ] All tests pass
- [ ] Success rate: 100%

---

## Monitoring Setup

### Render Dashboard
- [ ] Logs accessible and readable
- [ ] Metrics visible (if on paid plan)
- [ ] Health check status green
- [ ] No error alerts

### External Monitoring (Optional but Recommended)
- [ ] UptimeRobot monitor created
- [ ] Monitor interval: 5 minutes
- [ ] Email alerts configured
- [ ] Test alert works (trigger manual downtime)

### Error Tracking (Optional)
- [ ] Sentry project created (if using)
- [ ] SENTRY_DSN environment variable set
- [ ] Test error sent to Sentry
- [ ] Alerts configured

---

## Auto-Deploy Verification

### Test Auto-Deploy
- [ ] Make minor change to backend (e.g., add comment)
- [ ] Commit and push to main branch
- [ ] Check Render dashboard for new deployment
- [ ] Deployment completes successfully
- [ ] Service remains healthy after deployment

### GitHub Actions (if using)
- [ ] `RENDER_API_KEY` secret set in GitHub
- [ ] `RENDER_BACKEND_SERVICE_ID` secret set in GitHub
- [ ] Manual workflow dispatch works
- [ ] Automatic deployment on push works

---

## Documentation

- [ ] Production URL documented
- [ ] Environment variables documented
- [ ] Deployment procedure documented
- [ ] Troubleshooting steps documented
- [ ] Rollback procedure documented

---

## Security

- [ ] No secrets committed to repository
- [ ] `.env.production` in `.gitignore`
- [ ] Strong JWT secret used (32+ characters)
- [ ] Database password is strong
- [ ] Sensitive env vars marked as "Secret" in Render
- [ ] CORS configured properly (if needed)
- [ ] Rate limiting enabled (check backend config)

---

## Performance

- [ ] Health check response time < 1s
- [ ] API response time < 2s
- [ ] Database queries optimized
- [ ] No memory leaks detected (check logs after 24h)
- [ ] Logs showing reasonable activity

---

## Acceptance Criteria (HER-81)

Final verification that all acceptance criteria are met:

| Criteria | Status | Evidence |
|----------|--------|----------|
| Backend deployed and accessible | ☐ | `curl https://backend.onrender.com/health` returns 200 |
| Environment variables configured | ☐ | All vars set in Render dashboard |
| Health check passes | ☐ | `/health` returns `"status": "healthy"` |
| API responds correctly | ☐ | `/api` returns endpoint list |
| Logs accessible | ☐ | Render Logs tab shows activity |
| Auto-deploy on main branch merge | ☐ | Push to main triggers deployment |

---

## Next Steps (HER-82)

After backend deployment is complete:

- [ ] Note backend URL for frontend configuration
- [ ] Update frontend `REACT_APP_API_URL` to production URL
- [ ] Proceed with HER-82: Frontend Deployment

---

## Troubleshooting Reference

If any checks fail, refer to:
- **Deployment Guide**: `docs/BACKEND_DEPLOYMENT_RENDER.md`
- **CI/CD Setup**: `docs/CI_CD_SETUP.md`
- **Quick Start**: `docs/DEPLOYMENT_QUICK_START.md`

Common issues:
- **Build fails**: Check `package.json` scripts
- **Health check fails**: Check logs for startup errors
- **Database connection fails**: Verify Supabase credentials
- **503 errors**: Service may still be starting (wait 2 min)

---

## Sign-Off

Deployment completed by: ________________

Date: ________________

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
**Task**: HER-81
**Status**: Ready for deployment

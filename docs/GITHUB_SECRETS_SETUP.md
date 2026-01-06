# GitHub Secrets Setup Guide

## Overview

This guide explains how to configure GitHub Secrets required for automated deployments and database migrations.

## Required Secrets

The following secrets must be configured in your GitHub repository:

### Backend Deployment Secrets

| Secret Name | Description | Example Value |
|------------|-------------|---------------|
| `RENDER_API_KEY` | Render API token for deployments | `rnd_xxx...` |
| `RENDER_BACKEND_SERVICE_ID` | Render service ID for backend | `srv-xxx...` |

### Database Secrets (for Migrations)

| Secret Name | Description | Example Value |
|------------|-------------|---------------|
| `DB_HOST` | Database hostname | `db.abcdefghijk.supabase.co` |
| `DB_PORT` | Database port | `5432` |
| `DB_USER` | Database username | `postgres` |
| `DB_PASSWORD` | Database password | `your-secure-password` |
| `DB_NAME` | Database name | `postgres` |

### Frontend Deployment Secrets (Optional)

| Secret Name | Description | Example Value |
|------------|-------------|---------------|
| `NETLIFY_AUTH_TOKEN` | Netlify authentication token | `xxx...` |
| `NETLIFY_SITE_ID` | Netlify site ID | `xxx-xxx-xxx` |

## How to Add Secrets

### Step 1: Navigate to Repository Settings

1. Go to your GitHub repository: `https://github.com/Kolaheritage/kola`
2. Click on **Settings** (tab at the top)
3. In the left sidebar, navigate to **Secrets and variables** → **Actions**

### Step 2: Add Each Secret

For each secret listed above:

1. Click **New repository secret**
2. Enter the **Name** (exactly as shown above, case-sensitive)
3. Enter the **Value** (your actual credential)
4. Click **Add secret**

## Where to Find the Values

### Render Credentials

1. **RENDER_API_KEY**:
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click on your profile (top right) → **Account Settings**
   - Navigate to **API Keys** tab
   - Click **Create API Key**
   - Copy the generated key

2. **RENDER_BACKEND_SERVICE_ID**:
   - Go to your backend service in Render
   - The Service ID is in the URL: `https://dashboard.render.com/web/srv-XXXXX`
   - Or find it under **Settings** → **Service ID**

### Database Credentials (Supabase)

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **Database**
4. Find the connection details:
   - **DB_HOST**: Listed as "Host"
   - **DB_PORT**: Listed as "Port" (usually `5432`)
   - **DB_USER**: Listed as "User" (usually `postgres`)
   - **DB_PASSWORD**: The password you set when creating the project
   - **DB_NAME**: Listed as "Database" (usually `postgres`)

### Netlify Credentials (if using Netlify)

1. **NETLIFY_AUTH_TOKEN**:
   - Go to [Netlify](https://app.netlify.com/)
   - Click on your avatar → **User settings**
   - Navigate to **Applications** → **Personal access tokens**
   - Click **New access token**
   - Copy the token

2. **NETLIFY_SITE_ID**:
   - Go to your site in Netlify
   - Navigate to **Site settings** → **General**
   - Find **Site ID** (under "Site details")

## Security Best Practices

### ✅ DO:
- Use strong, unique passwords for database credentials
- Rotate API keys regularly (quarterly)
- Limit API key permissions to minimum required
- Use environment-specific secrets for staging vs production

### ❌ DON'T:
- Share secrets in Slack, email, or other communication channels
- Commit secrets to version control
- Use the same credentials across multiple environments
- Give unnecessary people access to repository settings

## Verifying Secrets

After adding secrets, you can verify they're configured:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. You should see all secrets listed (values are hidden)
3. Secrets show when they were last updated

## Testing the Setup

### Option 1: Trigger a Workflow Manually

1. Go to **Actions** tab in your repository
2. Select **Deploy Backend** workflow
3. Click **Run workflow**
4. Select `staging` environment
5. Click **Run workflow**

If secrets are configured correctly:
- Deployment should succeed
- Migrations should run automatically
- Health check should pass

### Option 2: Check Workflow Run Logs

1. After a push to `main`, check the workflow run
2. Look for the "Run database migrations" step
3. It should show:
   ```
   Running database migrations...
   🔄 Starting database migrations...
   ✅ Completed: 001_create_users_table.sql
   ...
   🎉 All migrations completed successfully!
   ```

## Troubleshooting

### Secret Not Found Error

**Error**: `Error: Input required and not supplied: DB_HOST`

**Solution**:
- Verify secret name matches exactly (case-sensitive)
- Secret should be `DB_HOST`, not `db_host` or `DB-HOST`

### Database Connection Failed

**Error**: `Migration failed: connection timeout`

**Solution**:
- Verify `DB_HOST` is correct and accessible
- Check `DB_PORT` is correct (usually `5432`)
- Verify `DB_PASSWORD` is correct
- Check if database requires SSL (Supabase does)

### Render Deployment Failed

**Error**: `401 Unauthorized`

**Solution**:
- Verify `RENDER_API_KEY` is valid
- Check if API key has correct permissions
- Try regenerating the API key

## Environment-Specific Secrets

For production vs staging environments, you can use **Environment Secrets**:

1. Go to **Settings** → **Environments**
2. Create environments: `staging` and `production`
3. Add environment-specific secrets to each
4. The workflow will use the appropriate secrets based on the environment

Example:
- `staging` environment: Use staging database
- `production` environment: Use production database

## Updates and Rotation

### When to Update Secrets

Update secrets when:
- Credentials are compromised
- Regular rotation schedule (quarterly for API keys)
- Migrating to new services
- Team member with access leaves

### How to Update Secrets

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click on the secret name
3. Click **Update secret**
4. Enter new value
5. Click **Update secret**
6. Re-run any failed workflows if needed

## Contact

For issues with secrets setup, contact:
- Repository administrators
- DevOps team
- Check the CI/CD documentation: `docs/CI_CD_SETUP.md`

---

**Last Updated**: 2026-01-06
**Version**: 1.0
**Related**: CI_CD_SETUP.md, PRODUCTION_DATABASE_SETUP.md

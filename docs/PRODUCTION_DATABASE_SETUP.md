# Production Database Setup Guide

## HER-80: Production Database Setup on Supabase

This guide walks through setting up a production PostgreSQL database using Supabase for the Heritage Content Platform.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Supabase Project Setup](#supabase-project-setup)
3. [Database Configuration](#database-configuration)
4. [Running Migrations](#running-migrations)
5. [Testing Connection](#testing-connection)
6. [Backup Strategy](#backup-strategy)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- GitHub account (for Supabase login)
- Access to the Heritage Platform codebase
- Node.js and npm installed

---

## Supabase Project Setup

### Step 1: Create Supabase Account

1. Visit [https://supabase.com](https://supabase.com)
2. Click **Start your project**
3. Sign up using your GitHub account (recommended) or email
4. Verify your email if required

### Step 2: Create a New Project

1. From the Supabase dashboard, click **New Project**
2. Select your organization or create a new one
3. Fill in project details:
   - **Name**: `heritage-platform-prod` (or your preferred name)
   - **Database Password**: Generate a strong password (save this securely!)
   - **Region**: Choose closest to your primary users (e.g., `us-east-1` for US East Coast)
   - **Pricing Plan**: Start with **Free tier** (includes 500MB database, 1GB file storage, 2GB bandwidth)

4. Click **Create new project**
5. Wait 2-3 minutes for the project to be provisioned

### Step 3: Locate Database Credentials

Once your project is ready:

1. Go to **Project Settings** (gear icon in sidebar)
2. Navigate to **Database** section
3. You'll find the connection details:
   - **Host**: `db.[your-project-ref].supabase.co`
   - **Database name**: `postgres`
   - **Port**: `5432`
   - **User**: `postgres`
   - **Password**: (the one you set during project creation)

4. **Connection String** is also provided in multiple formats:
   - URI format: `postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres`
   - Transaction pooler (recommended for serverless): Port `6543`
   - Session pooler: Port `5432`

---

## Database Configuration

### Step 4: Configure Production Environment Variables

You have two options for configuring production credentials:

#### Option A: Using Individual Environment Variables (Recommended for most deployments)

Create a `.env.production` file in your backend directory:

```bash
# Production Database Configuration
DB_HOST=db.[your-project-ref].supabase.co
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your-secure-password
DB_NAME=postgres

# Backend Configuration
BACKEND_PORT=5002
NODE_ENV=production

# JWT Configuration (IMPORTANT: Change this!)
JWT_SECRET=your-production-jwt-secret-min-32-chars
JWT_EXPIRES_IN=7d

# File Upload Configuration
MAX_FILE_SIZE=104857600
UPLOAD_PATH=./uploads

# Cloudinary Configuration (for HER-83)
# CLOUDINARY_CLOUD_NAME=
# CLOUDINARY_API_KEY=
# CLOUDINARY_API_SECRET=
```

**Important Notes:**
- Replace `[your-project-ref]` with your actual Supabase project reference
- Use the password you set during Supabase project creation
- Generate a new, secure JWT secret (minimum 32 characters)
- **Never commit `.env.production` to version control** (it's in `.gitignore`)

#### Option B: Using Connection URI (Alternative)

If your deployment platform supports a single `DATABASE_URL` variable:

1. Update `backend/src/config/database.ts` to support `DATABASE_URL`
2. Set: `DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres`

### Step 5: SSL Configuration

Supabase requires SSL for production connections. Update `backend/src/config/database.ts`:

```typescript
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433'),
  user: process.env.DB_USER || 'heritage_user',
  password: process.env.DB_PASSWORD || 'heritage_password',
  database: process.env.DB_NAME || 'heritage_db',
  // Add SSL configuration for production
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

---

## Running Migrations

### Step 6: Initialize Database Extensions

Supabase comes with many extensions pre-installed, but we need to ensure our required extensions are enabled:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Run the initialization script:

```sql
-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';
```

5. Click **Run** or press `Ctrl+Enter`

### Step 7: Run Application Migrations

From your local machine or CI/CD pipeline:

1. Ensure `.env.production` is configured (or set environment variables)

2. Run migrations:

```bash
cd backend

# Load production environment variables
export $(cat .env.production | xargs)

# Run migrations
npm run migrate
```

**Expected output:**
```
🔄 Starting database migrations...
📁 Migrations directory: /path/to/database/migrations
📝 Found 7 migration file(s)
▶️  Running migration: 001_create_users_table.sql
✅ Completed: 001_create_users_table.sql
▶️  Running migration: 002_create_categories_table.sql
✅ Completed: 002_create_categories_table.sql
...
🎉 All migrations completed successfully!
```

### Step 8: Verify Tables in Supabase

1. Go to **Table Editor** in Supabase dashboard
2. You should see the following tables:
   - `migrations` (migration tracking)
   - `users`
   - `categories`
   - `content`
   - `likes`
   - `content_views`

---

## Testing Connection

### Step 9: Test Database Connection

Create a test script or use the existing test function:

```bash
# From backend directory with production env vars loaded
node -e "
import('dotenv/config').then(() => {
  import('./dist/config/database.js').then(async (db) => {
    try {
      const result = await db.testConnection();
      console.log('✅ Database connection successful!');
      console.log('Current time from database:', result.now);
      process.exit(0);
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      process.exit(1);
    }
  });
});
"
```

**Alternative: Manual Test via Supabase SQL Editor**

1. Go to **SQL Editor** in Supabase dashboard
2. Run: `SELECT NOW(), version();`
3. You should see current timestamp and PostgreSQL version

### Step 10: Health Check Endpoint

Once deployed, your backend should have a health check endpoint that tests DB connectivity:

```bash
curl https://your-backend-url.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-01-02T10:30:00.000Z"
}
```

---

## Backup Strategy

### Automated Backups (Supabase)

Supabase provides automated backups based on your plan:

- **Free Tier**:
  - Daily backups retained for 7 days
  - Point-in-time recovery: Not available

- **Pro Tier** ($25/month):
  - Daily backups retained for 7 days
  - Point-in-time recovery: Last 7 days

- **Team/Enterprise**:
  - Customizable retention periods
  - Point-in-time recovery up to 30 days

### Manual Backup Procedures

#### Option 1: Database Dump via pg_dump

```bash
# Set credentials
export PGPASSWORD='your-password'

# Create backup
pg_dump \
  -h db.[your-project-ref].supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  -F c \
  -f "backup_$(date +%Y%m%d_%H%M%S).dump"

# Unset password
unset PGPASSWORD
```

**Schedule via cron (Linux/Mac):**
```bash
# Daily backup at 2 AM
0 2 * * * /path/to/backup-script.sh
```

#### Option 2: Supabase CLI Backup

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref [your-project-ref]

# Create backup
supabase db dump -f backup.sql
```

### Backup Best Practices

1. **Frequency**:
   - Daily automated backups (provided by Supabase)
   - Weekly manual backups (recommended for critical data)
   - Before major migrations or updates

2. **Retention**:
   - Keep 7 daily backups
   - Keep 4 weekly backups
   - Keep 3 monthly backups

3. **Storage**:
   - Store backups in a different location than primary database
   - Use cloud storage (AWS S3, Google Cloud Storage, etc.)
   - Consider encrypted storage for sensitive data

4. **Testing**:
   - Monthly restore tests to verify backup integrity
   - Document restore procedures

### Restore Procedures

#### Restore from Supabase Dashboard

1. Go to **Database** → **Backups** in Supabase dashboard
2. Select the backup to restore
3. Click **Restore**
4. Confirm the action

#### Restore from Manual Backup

```bash
# Using pg_restore
export PGPASSWORD='your-password'

pg_restore \
  -h db.[your-project-ref].supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  -c \
  backup_20260102_120000.dump

unset PGPASSWORD
```

---

## Security Best Practices

### Database Security Checklist

- [ ] Strong database password (min 16 characters, mixed case, numbers, symbols)
- [ ] JWT secret is unique and secure (min 32 characters)
- [ ] SSL/TLS enabled for all connections
- [ ] Database credentials stored securely (environment variables, secrets manager)
- [ ] Row Level Security (RLS) policies configured (via Supabase dashboard)
- [ ] Regular security audits of database access logs
- [ ] IP allowlisting configured (if required)

### Supabase Row Level Security (RLS)

Consider enabling RLS for additional security:

1. Go to **Authentication** → **Policies** in Supabase dashboard
2. Enable RLS on tables that need user-level access control
3. Create policies for SELECT, INSERT, UPDATE, DELETE operations

Example policy for `content` table:
```sql
-- Users can only update their own content
CREATE POLICY "Users can update own content"
ON content
FOR UPDATE
USING (auth.uid() = user_id);
```

---

## Monitoring and Alerts

### Supabase Dashboard Monitoring

1. **Database Health**: Monitor via **Database** → **Usage** section
   - Database size
   - Connection count
   - CPU usage
   - Query performance

2. **Set Up Alerts** (Pro tier):
   - Database size exceeding threshold
   - High CPU usage
   - Connection pool exhaustion

### Application-Level Monitoring

Implement in your backend:

```typescript
// Log slow queries
pool.on('connect', (client) => {
  console.log('Database connection established');
});

pool.on('error', (err) => {
  console.error('Database pool error:', err);
  // Send alert to monitoring service (e.g., Sentry, LogRocket)
});
```

---

## Troubleshooting

### Common Issues

#### Connection Timeout

**Error**: `timeout expired`

**Solutions**:
- Check if Supabase project is paused (free tier auto-pauses after 1 week inactivity)
- Verify firewall/network settings
- Check SSL configuration
- Increase `connectionTimeoutMillis` in pool config

#### SSL/TLS Errors

**Error**: `self signed certificate`

**Solution**: Ensure SSL config includes `rejectUnauthorized: false` for Supabase

#### Migration Failures

**Error**: `relation "xxx" already exists`

**Solution**:
- Check `migrations` table to see what's been executed
- Manually mark migration as executed if it partially ran:
  ```sql
  INSERT INTO migrations (filename) VALUES ('xxx.sql');
  ```

#### Connection Pool Exhausted

**Error**: `sorry, too many clients already`

**Solutions**:
- Reduce `max` pool size
- Use Supabase transaction pooler (port 6543) for serverless deployments
- Check for connection leaks in your code

---

## Next Steps

After completing the production database setup:

1. **HER-81**: Deploy backend to Render/Railway with production DB credentials
2. **HER-82**: Deploy frontend to Vercel/Netlify
3. **HER-83**: Set up Cloudinary for media storage

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Database Migration Best Practices](https://supabase.com/docs/guides/database/migrations)

---

## Credential Storage (Deployment Platforms)

### Render
Set environment variables in **Dashboard** → **Environment** tab

### Railway
Set environment variables in **Variables** tab

### Vercel (for frontend)
Set environment variables in **Project Settings** → **Environment Variables**

### GitHub Secrets (for CI/CD)
Store as repository secrets: **Settings** → **Secrets and variables** → **Actions**

---

**Last Updated**: 2026-01-02
**Version**: 1.0
**Related Tasks**: HER-80, HER-81, HER-82

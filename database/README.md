# Database Documentation

## Overview

This directory contains database initialization scripts, migrations, and documentation for the Heritage Platform.

## Structure

```
database/
├── init.sql           # Initial database setup (extensions, functions)
├── migrations/        # SQL migration files
│   ├── 001_create_users_table.sql
│   ├── 002_create_categories_table.sql
│   ├── 003_create_content_table.sql
│   ├── 004_add_engagement_to_content.sql
│   ├── 005_create_likes_table.sql
│   ├── 006_create_content_views_table.sql
│   └── 007_add_soft_delete_to_content.sql
└── README.md          # This file
```

## Migrations

### Running Migrations

Migrations are run automatically using the migration runner:

```bash
# Development
cd backend
npm run migrate

# Production (with .env.production)
export NODE_ENV=production
export $(cat .env.production | xargs)
npm run migrate
```

### Migration Naming Convention

Migrations follow a sequential naming pattern:

```
<number>_<description>.sql

Examples:
001_create_users_table.sql
002_create_categories_table.sql
```

### Creating New Migrations

1. Create a new file in `database/migrations/` with the next sequential number
2. Write your SQL DDL statements
3. Include comments for context
4. Test locally before running in production

Example template:

```sql
-- Migration: <description>
-- Ticket: HER-XXX
-- Created: YYYY-MM-DD

-- Your DDL statements here
CREATE TABLE IF NOT EXISTS example (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_example_created ON example(created_at);
```

### Migration Tracking

- Migrations are tracked in the `migrations` table
- Each migration is run exactly once
- Failed migrations are rolled back automatically
- Check migration status:

```sql
SELECT * FROM migrations ORDER BY executed_at DESC;
```

## Database Schema

### Current Tables

1. **users** - User accounts and profiles
2. **categories** - Content categories
3. **content** - Media content (images, videos, text)
4. **likes** - User likes on content
5. **content_views** - View tracking for analytics
6. **migrations** - Migration tracking (auto-created)

### Key Features

- **UUID primary keys** for all user-facing tables
- **Soft deletes** on content table
- **Timestamps** (created_at, updated_at) on all tables
- **Automatic updated_at** via triggers
- **Indexes** on frequently queried columns

## Production Setup

See [docs/PRODUCTION_DATABASE_SETUP.md](../docs/PRODUCTION_DATABASE_SETUP.md) for complete production setup instructions including:

- Supabase project creation
- SSL configuration
- Migration deployment
- Backup strategies

## Backup and Restore

### Creating Backups

```bash
# Backup production
./scripts/backup-db.sh production

# Backup development
./scripts/backup-db.sh development
```

### Restoring Backups

```bash
# Restore to development (safe)
./scripts/restore-db.sh backups/backup_production_20260102_120000.dump development

# Restore to production (dangerous!)
./scripts/restore-db.sh backups/backup_production_20260102_120000.dump production
```

## Common Operations

### Resetting Development Database

```bash
# Drop all tables and re-run migrations
docker-compose down -v
docker-compose up -d
cd backend
npm run migrate
npm run seed  # Optional: add test data
```

### Checking Database Status

```bash
# Via health endpoint
curl http://localhost:5002/health

# Direct connection test
cd backend
node -e "import('./dist/config/database.js').then(db => db.testConnection())"
```

### Viewing Database Logs

```bash
# Docker development
docker-compose logs -f db

# Production (Supabase)
# View logs in Supabase Dashboard > Database > Logs
```

## Troubleshooting

### Migration Fails with "relation already exists"

This usually means:
1. Migration was partially executed
2. Table was created manually

**Solution:**
```sql
-- Mark migration as executed
INSERT INTO migrations (filename) VALUES ('XXX_migration_name.sql');
```

### Connection Timeout

**Possible causes:**
- Database container not running (development)
- Wrong credentials
- Network/firewall issues
- Supabase project paused (production free tier)

**Solutions:**
```bash
# Development
docker-compose ps  # Check if db is running
docker-compose up -d db

# Production
# Check Supabase dashboard for project status
# Verify credentials in .env.production
```

### SSL/TLS Errors in Production

**Error:** `self signed certificate`

**Solution:** Ensure SSL is configured in database pool:
```typescript
ssl: process.env.NODE_ENV === 'production'
  ? { rejectUnauthorized: false }
  : false
```

## Related Documentation

- [Production Database Setup](../docs/PRODUCTION_DATABASE_SETUP.md)
- [Backend README](../backend/README.md)
- [API Documentation](http://localhost:5002/api-docs) (when running)

## Support

For issues or questions:
- Check existing migrations for examples
- Review Supabase documentation: https://supabase.com/docs
- Review PostgreSQL documentation: https://www.postgresql.org/docs/

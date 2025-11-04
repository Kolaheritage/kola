# Database Migrations

This directory contains all database migrations for the Heritage Platform.

## Directory Structure

```
database/
├── migrations/          # Migration files (numbered sequentially)
│   ├── 001_enable_extensions.js
│   ├── 002_create_trigger_function.js
│   ├── 003_create_users_table.js
│   ├── 004_create_categories_table.js
│   ├── 005_create_content_table.js
│   ├── 006_create_tags_tables.js
│   ├── 007_create_likes_table.js
│   ├── 008_create_comments_table.js
│   ├── 009_create_follows_table.js
│   ├── 010_create_remixes_table.js
│   ├── 011_create_collaborations_table.js
│   └── 012_create_fulltext_search_index.js
├── seeds/              # Seed data scripts
│   └── seed.js
└── README.md           # This file
```

## Migration Tool

We use **node-pg-migrate** for database migrations.

- **Documentation**: https://salsita.github.io/node-pg-migrate/
- **Advantages**: Simple, JS-based, supports rollbacks, no ORM required

## Prerequisites

1. PostgreSQL database running
2. Environment variables set in `.env`:
   ```
   DB_USER=heritage_user
   DB_PASSWORD=heritage_password
   DB_NAME=heritage_db
   DB_HOST=localhost
   DB_PORT=5432
   DATABASE_URL=postgres://heritage_user:heritage_password@localhost:5432/heritage_db
   ```

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Run Migrations

```bash
# Run all pending migrations
npm run migrate

# Or with full database URL
DATABASE_URL=postgres://user:pass@host:5432/dbname npm run migrate
```

### 3. Seed Database

```bash
# Seed initial data (categories and tags)
npm run seed
```

### 4. Verify

```bash
# Connect to database
docker exec -it heritage_db psql -U heritage_user -d heritage_db

# List tables
\dt

# Check categories
SELECT * FROM categories;
```

## Migration Commands

### Run Migrations (Up)

```bash
# Run all pending migrations
npm run migrate

# Run specific number of migrations
npm run migrate -- --count 5

# Dry run (show SQL without executing)
npm run migrate -- --dry-run
```

### Rollback Migrations (Down)

```bash
# Rollback last migration
npm run migrate:down

# Rollback specific number of migrations
npm run migrate:down -- --count 3

# Dry run rollback
npm run migrate:down -- --dry-run
```

### Create New Migration

```bash
# Create new migration file
npm run migrate:create -- add_new_feature

# This creates: migrations/TIMESTAMP_add_new_feature.js
```

## Migration Files

### Order of Migrations

Migrations must be run in order due to dependencies:

1. **001_enable_extensions** - Enable UUID extension
2. **002_create_trigger_function** - Create reusable trigger function
3. **003_create_users_table** - User accounts (no dependencies)
4. **004_create_categories_table** - Content categories (no dependencies)
5. **005_create_content_table** - Content posts (depends on users, categories)
6. **006_create_tags_tables** - Tags and content_tags (depends on categories, content)
7. **007_create_likes_table** - Likes (depends on content, users)
8. **008_create_comments_table** - Comments (depends on content, users)
9. **009_create_follows_table** - User follows (depends on users)
10. **010_create_remixes_table** - Content remixes (depends on content)
11. **011_create_collaborations_table** - Collaborations (depends on content, users)
12. **012_create_fulltext_search_index** - Search index (depends on content)

### Migration File Structure

Each migration has `up` and `down` functions:

```javascript
exports.up = (pgm) => {
  // Changes to apply (forward migration)
  pgm.createTable('table_name', {
    // columns
  });
};

exports.down = (pgm) => {
  // Changes to rollback (reverse migration)
  pgm.dropTable('table_name');
};
```

## Seed Data

### Categories

The seed script creates 6 categories:
1. Rituals 🕯️
2. Dance 💃
3. Music 🎵
4. Recipes 🍲
5. Stories 📖
6. Crafts 🎨

### Tags

Creates 34 tags across categories:
- General: traditional, contemporary, festive, educational, family
- Category-specific: ceremonial, folk-dance, guitar, vegetarian, legend, pottery, etc.

## Common Tasks

### Fresh Database Setup

```bash
# 1. Ensure database exists
docker exec -it heritage_db psql -U heritage_user -c "CREATE DATABASE heritage_db;"

# 2. Run all migrations
npm run migrate

# 3. Seed data
npm run seed

# 4. Verify
docker exec -it heritage_db psql -U heritage_user -d heritage_db -c "\dt"
```

### Reset Database

```bash
# WARNING: This deletes all data!

# Method 1: Rollback all migrations
npm run migrate:down -- --count 999

# Method 2: Drop and recreate database
docker exec -it heritage_db psql -U heritage_user -c "DROP DATABASE IF EXISTS heritage_db;"
docker exec -it heritage_db psql -U heritage_user -c "CREATE DATABASE heritage_db;"

# Then run migrations and seed
npm run migrate
npm run seed
```

### Check Migration Status

```bash
# View migration history
docker exec -it heritage_db psql -U heritage_user -d heritage_db -c "SELECT * FROM pgmigrations ORDER BY run_on;"
```

### Test Rollback

```bash
# Test rollback of last migration
npm run migrate:down

# Verify it worked
docker exec -it heritage_db psql -U heritage_user -d heritage_db -c "\dt"

# Re-run migration
npm run migrate
```

## Database Schema

### Core Tables

| Table | Description | Key Features |
|-------|-------------|--------------|
| **users** | User accounts | UUID, email/username unique |
| **categories** | Content categories | 6 predefined categories |
| **content** | User content | Media URLs, counts, soft delete |
| **tags** | Content tags | Flexible tagging system |
| **content_tags** | Content-tag junction | Many-to-many relationship |

### Engagement Tables

| Table | Description | Key Features |
|-------|-------------|--------------|
| **likes** | Content likes | Unique per user+content, triggers count |
| **comments** | Content comments | Soft delete, triggers count |

### Social Tables

| Table | Description | Key Features |
|-------|-------------|--------------|
| **follows** | User follows | Self-reference check |
| **remixes** | Content remixes | Tracks original, triggers count |
| **collaborations** | Content collaborators | Invite workflow |

## Troubleshooting

### Migration Fails

```bash
# Check database connection
docker exec -it heritage_db psql -U heritage_user -d heritage_db -c "SELECT 1;"

# Check migration table
docker exec -it heritage_db psql -U heritage_user -d heritage_db -c "SELECT * FROM pgmigrations;"

# Check PostgreSQL logs
docker logs heritage_db
```

### Rollback Fails

If rollback fails:
1. Check the error message
2. Manually inspect the database state
3. May need to manually fix before retry
4. Last resort: drop and recreate database

### Seed Fails

```bash
# Check if migrations ran first
docker exec -it heritage_db psql -U heritage_user -d heritage_db -c "\dt"

# Check if categories already exist
docker exec -it heritage_db psql -U heritage_user -d heritage_db -c "SELECT * FROM categories;"

# Clear and re-seed
docker exec -it heritage_db psql -U heritage_user -d heritage_db -c "DELETE FROM tags; DELETE FROM categories;"
npm run seed
```

### Permission Errors

```bash
# Ensure user has correct permissions
docker exec -it heritage_db psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE heritage_db TO heritage_user;"
```

## Best Practices

### DO's ✅

1. **Always test migrations locally first**
2. **Keep migrations small and focused**
3. **Write both up and down migrations**
4. **Test rollback before deploying**
5. **Back up production before migrating**
6. **Use transactions for multiple changes**
7. **Version control all migrations**

### DON'Ts ❌

1. **Don't modify existing migrations** (create new ones instead)
2. **Don't skip migrations** (run in order)
3. **Don't delete migrations** (they're part of history)
4. **Don't run migrations in production without testing**
5. **Don't forget to update seed data**

## Production Deployment

### Pre-Deployment Checklist

- [ ] All migrations tested locally
- [ ] Rollback tested locally
- [ ] Database backup created
- [ ] Migrations reviewed by team
- [ ] Downtime scheduled (if needed)

### Deployment Steps

1. **Backup production database**
   ```bash
   pg_dump production_db > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Run migrations**
   ```bash
   DATABASE_URL=$PRODUCTION_DB_URL npm run migrate
   ```

3. **Verify**
   ```bash
   # Check tables exist
   # Run smoke tests
   # Monitor logs
   ```

4. **Rollback if needed**
   ```bash
   DATABASE_URL=$PRODUCTION_DB_URL npm run migrate:down
   ```

## Migration History

| Migration | Date | Description |
|-----------|------|-------------|
| 001 | Sprint 1 | Enable UUID extension |
| 002 | Sprint 1 | Create trigger function |
| 003 | Sprint 1 | Create users table |
| 004 | Sprint 1 | Create categories table |
| 005 | Sprint 1 | Create content table |
| 006 | Sprint 1 | Create tags tables |
| 007 | Sprint 1 | Create likes table |
| 008 | Sprint 1 | Create comments table |
| 009 | Sprint 1 | Create follows table |
| 010 | Sprint 1 | Create remixes table |
| 011 | Sprint 1 | Create collaborations table |
| 012 | Sprint 1 | Create full-text search index |

## Resources

- [node-pg-migrate Documentation](https://salsita.github.io/node-pg-migrate/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Database Schema Documentation](../docs/database-schema.md)

## Support

For issues with migrations:
1. Check this README
2. Review migration files
3. Check database logs
4. Consult the team
# Quick Start: Running Database Migrations

## Option 1: With Docker Compose (Recommended)

### Step 1: Start Services
```bash
# From project root
docker-compose up -d
```

### Step 2: Run Migrations
```bash
# Run migrations inside backend container
docker-compose exec backend npm run migrate
```

### Step 3: Seed Database
```bash
# Seed initial data
docker-compose exec backend npm run seed
```

### Step 4: Verify
```bash
# Connect to database
docker exec -it heritage_db psql -U heritage_user -d heritage_db

# List tables
\dt

# View categories
SELECT * FROM categories;

# View migration history
SELECT * FROM pgmigrations ORDER BY run_on;

# Exit
\q
```

---

## Option 2: Local Setup (Without Docker)

### Prerequisites
- PostgreSQL installed and running
- Node.js 18+ installed

### Step 1: Create Database
```bash
psql -U postgres -c "CREATE DATABASE heritage_db;"
psql -U postgres -c "CREATE USER heritage_user WITH PASSWORD 'heritage_password';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE heritage_db TO heritage_user;"
```

### Step 2: Configure Environment
```bash
# In backend/.env
DATABASE_URL=postgres://heritage_user:heritage_password@localhost:5432/heritage_db
```

### Step 3: Install Dependencies
```bash
cd backend
npm install
```

### Step 4: Run Migrations
```bash
npm run migrate
```

### Step 5: Seed Database
```bash
npm run seed
```

### Step 6: Verify
```bash
psql -U heritage_user -d heritage_db -c "\dt"
psql -U heritage_user -d heritage_db -c "SELECT * FROM categories;"
```

---

## Option 3: Automated Setup Script

### Make Script Executable
```bash
chmod +x backend/scripts/setup-database.sh
```

### Run Setup
```bash
# With Docker
docker-compose exec backend ./scripts/setup-database.sh

# Or locally
cd backend
./scripts/setup-database.sh
```

---

## Verify Setup

After running migrations, you should have:

### ✅ 10 Tables Created
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

Expected tables:
- categories
- collaborations
- comments
- content
- content_tags
- follows
- likes
- remixes
- tags
- users

### ✅ 6 Categories Created
```sql
SELECT id, name, icon FROM categories ORDER BY display_order;
```

Expected output:
```
 id |   name   | icon
----+----------+------
  1 | Rituals  | 🕯️
  2 | Dance    | 💃
  3 | Music    | 🎵
  4 | Recipes  | 🍲
  5 | Stories  | 📖
  6 | Crafts   | 🎨
```

### ✅ 34 Tags Created
```sql
SELECT COUNT(*) FROM tags;
```

Expected output: `34`

### ✅ Migrations Table
```sql
SELECT name, run_on FROM pgmigrations ORDER BY run_on;
```

Should show all 12 migrations with timestamps.

---

## Troubleshooting

### Problem: "Cannot connect to database"

**Solution 1**: Ensure PostgreSQL is running
```bash
# With Docker
docker-compose ps database

# Should show status: Up
```

**Solution 2**: Check DATABASE_URL
```bash
echo $DATABASE_URL

# Should be: postgres://heritage_user:heritage_password@database:5432/heritage_db
```

**Solution 3**: Check logs
```bash
docker-compose logs database
```

---

### Problem: "Migration already applied"

This is normal if you've run migrations before.

**To check status**:
```bash
docker exec -it heritage_db psql -U heritage_user -d heritage_db -c "SELECT * FROM pgmigrations;"
```

**To reset** (⚠️ deletes all data):
```bash
# Rollback all migrations
docker-compose exec backend npm run migrate:down -- --count 999

# Re-run migrations
docker-compose exec backend npm run migrate
```

---

### Problem: "Seed data already exists"

The seed script is idempotent (safe to run multiple times). It will skip existing records.

**To clear and re-seed**:
```bash
# Clear data
docker exec -it heritage_db psql -U heritage_user -d heritage_db -c "DELETE FROM content_tags; DELETE FROM tags; DELETE FROM categories;"

# Re-seed
docker-compose exec backend npm run seed
```

---

### Problem: Permission denied on script

```bash
chmod +x backend/scripts/setup-database.sh
```

---

## Next Steps

Once migrations are complete, you can:

1. **Start the backend**:
   ```bash
   docker-compose up backend
   ```

2. **Start the frontend**:
   ```bash
   docker-compose up frontend
   ```

3. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000
   - Health check: http://localhost:5000/health

4. **Begin implementing features**:
   - HER-10: User Registration Backend
   - HER-11: User Login Backend
   - HER-13: Registration Frontend
   - HER-14: Login Frontend

---

## Useful Commands

```bash
# View all tables
docker exec -it heritage_db psql -U heritage_user -d heritage_db -c "\dt"

# View table structure
docker exec -it heritage_db psql -U heritage_user -d heritage_db -c "\d users"

# Count records in each table
docker exec -it heritage_db psql -U heritage_user -d heritage_db -c "
SELECT 
    'users' as table_name, COUNT(*) as count FROM users
UNION ALL SELECT 'categories', COUNT(*) FROM categories
UNION ALL SELECT 'content', COUNT(*) FROM content
UNION ALL SELECT 'tags', COUNT(*) FROM tags
UNION ALL SELECT 'likes', COUNT(*) FROM likes
UNION ALL SELECT 'comments', COUNT(*) FROM comments;
"

# Rollback last migration
docker-compose exec backend npm run migrate:down

# Run specific migration
docker-compose exec backend npm run migrate -- --count 1

# Create new migration
docker-compose exec backend npm run migrate:create -- add_new_feature
```

---

## Success! 🎉

If you see:
- ✅ 10 tables created
- ✅ 6 categories seeded
- ✅ 34 tags seeded
- ✅ 12 migrations in pgmigrations table

**Your database is ready for development!**
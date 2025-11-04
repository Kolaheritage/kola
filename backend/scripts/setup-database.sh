#!/bin/bash

# Heritage Platform Database Setup Script
# Sets up the database with migrations and seed data

set -e

echo "🏛️  Heritage Platform - Database Setup"
echo "======================================"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL not set, using environment variables..."
    export DATABASE_URL="postgres://${DB_USER:-heritage_user}:${DB_PASSWORD:-heritage_password}@${DB_HOST:-localhost}:${DB_PORT:-5432}/${DB_NAME:-heritage_db}"
fi

echo "📊 Database URL: $DATABASE_URL"
echo ""

# Test database connection
echo "🔍 Testing database connection..."
if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "❌ Cannot connect to database"
    echo "   Please ensure PostgreSQL is running and DATABASE_URL is correct"
    exit 1
fi

echo ""

# Run migrations
echo "🔄 Running migrations..."
npm run migrate

if [ $? -eq 0 ]; then
    echo "✅ Migrations completed successfully"
else
    echo "❌ Migration failed"
    exit 1
fi

echo ""

# Seed database
echo "🌱 Seeding database..."
npm run seed

if [ $? -eq 0 ]; then
    echo "✅ Database seeded successfully"
else
    echo "❌ Seeding failed"
    exit 1
fi

echo ""
echo "======================================"
echo "✅ Database setup complete!"
echo ""
echo "📊 Summary:"
psql "$DATABASE_URL" -c "
SELECT 
    'Tables' as type, 
    COUNT(*)::text as count 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
UNION ALL
SELECT 
    'Categories' as type,
    COUNT(*)::text as count
FROM categories
UNION ALL
SELECT 
    'Tags' as type,
    COUNT(*)::text as count
FROM tags;
"

echo ""
echo "🚀 Ready to start development!"
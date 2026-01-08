import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Pool, PoolClient } from 'pg';

/**
 * Database Migration Runner
 * HER-11: User Login Backend
 * Runs SQL migration files in order
 */

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433'),
  user: process.env.DB_USER || 'heritage_user',
  password: process.env.DB_PASSWORD || 'heritage_password',
  database: process.env.DB_NAME || 'heritage_db',
  // SSL configuration for production (required for Supabase and most cloud providers)
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

/**
 * Run all migrations in the migrations directory
 */
async function runMigrations(): Promise<void> {
  const migrationsDir = path.join(__dirname, '../../..', 'database', 'migrations');

  try {
    console.log('🔄 Starting database migrations...');
    console.log(`📁 Migrations directory: ${migrationsDir}`);

    // Check if migrations directory exists
    if (!fs.existsSync(migrationsDir)) {
      console.log('⚠️  No migrations directory found. Creating...');
      fs.mkdirSync(migrationsDir, { recursive: true });
      console.log('✅ Migrations directory created');
      return;
    }

    // Read all migration files
    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort(); // Sort to ensure migrations run in order

    if (files.length === 0) {
      console.log('⚠️  No migration files found');
      return;
    }

    console.log(`📝 Found ${files.length} migration file(s)`);

    // Create migrations tracking table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Get already executed migrations
    const { rows: executedMigrations } = await pool.query<{ filename: string }>(
      'SELECT filename FROM migrations'
    );
    const executedFiles = executedMigrations.map((row) => row.filename);

    // Run each migration
    for (const file of files) {
      if (executedFiles.includes(file)) {
        console.log(`⏭️  Skipping ${file} (already executed)`);
        continue;
      }

      console.log(`▶️  Running migration: ${file}`);

      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      // Execute migration in a transaction
      const client: PoolClient = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`✅ Completed: ${file}`);
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ Error in ${file}:`, (error as Error).message);
        throw error;
      } finally {
        client.release();
      }
    }

    console.log('🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations if this script is executed directly
if (process.argv[1] === __filename) {
  runMigrations();
}

export { runMigrations };

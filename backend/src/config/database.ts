import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433'),
  user: process.env.DB_USER || 'heritage_user',
  password: process.env.DB_PASSWORD || 'heritage_password',
  database: process.env.DB_NAME || 'heritage_db',
  // SSL configuration for production (required for Supabase and most cloud providers)
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Handle pool errors
pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle database client', err);
  process.exit(-1);
});

// Test database connection
const testConnection = async (): Promise<QueryResultRow> => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    return result.rows[0];
  } catch (error) {
    console.error('Database connection error:', (error as Error).message);
    throw error;
  }
};

// Query helper function
const query = async <T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> => {
  const start = Date.now();
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Query error:', (error as Error).message);
    throw error;
  }
};

// Transaction helper
const transaction = async <T>(callback: (client: PoolClient) => Promise<T>): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Get a client from the pool for manual transaction handling
const getClient = async (): Promise<PoolClient> => {
  return pool.connect();
};

export { pool, query, transaction, testConnection, getClient };

// Default export for convenient import
export default {
  pool,
  query,
  transaction,
  testConnection,
  getClient,
};

const { Pool } = require('pg');
require('dotenv').config(); // Load environment variables from .env file

// Check if DATABASE_URL is set, otherwise throw an error
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set.');
}

// Configure the connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // SSL configuration for cloud databases like Render Postgres
  ssl: {
    rejectUnauthorized: false, // Necessary for cloud database connections
  },
});

// Optional: Log when a client connects (useful for debugging)
pool.on('connect', () => {
  console.log('Database pool connected');
});

// Helper to run a callback within a single-client transaction
const withTransaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {
      // ignore rollback errors
    }
    throw err;
  } finally {
    client.release();
  }
};

// Export a query function and helpers
module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  withTransaction,
};

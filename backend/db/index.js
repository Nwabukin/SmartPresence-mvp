const { Pool } = require('pg');
require('dotenv').config(); // Load environment variables from .env file

// Check if DATABASE_URL is set, otherwise throw an error
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set.');
}

// Configure the connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Optional: Add SSL configuration if connecting to a cloud database like Heroku Postgres
  // ssl: {
  //   rejectUnauthorized: false // Necessary for Heroku Hobby tier
  // }
});

// Optional: Log when a client connects (useful for debugging)
pool.on('connect', () => {
  console.log('Database pool connected');
});

// Export a query function that uses the pool
module.exports = {
  query: (text, params) => pool.query(text, params),
  // You can also export the pool directly if needed elsewhere
  // pool: pool,
}; 
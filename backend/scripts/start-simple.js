#!/usr/bin/env node

/**
 * Simple production startup script for Render deployment
 * Starts the server directly without migrations
 */

console.log('🚀 Starting SmartPresence Backend in production mode...');

// Check if DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  console.error('Please set the DATABASE_URL environment variable in your Render dashboard');
  process.exit(1);
}

console.log('📊 Database URL configured:', process.env.DATABASE_URL.replace(/\/\/.*@/, '//***:***@'));

// Start the main application directly
console.log('🌐 Starting server...');

require('../index.js');

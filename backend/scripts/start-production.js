#!/usr/bin/env node

/**
 * Production startup script for Render deployment
 * Handles database migrations before starting the server
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting SmartPresence Backend in production mode...');

// Check if DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  console.error('Please set the DATABASE_URL environment variable in your Render dashboard');
  console.error('Go to your service settings > Environment and add:');
  console.error('DATABASE_URL=postgresql://user:password@host:port/database');
  process.exit(1);
}

console.log('📊 Running database migrations...');

// Run migrations using the robust migration script
const migrateProcess = spawn('node', ['scripts/migrate-production.js'], {
  stdio: 'inherit',
  env: { ...process.env }
});

migrateProcess.on('close', (code) => {
  if (code !== 0) {
    console.error(`❌ Migration failed with code ${code}`);
    process.exit(1);
  }
  
  console.log('✅ Migrations completed successfully');
  console.log('🌐 Starting server...');
  
  // Start the main application
  const appProcess = spawn('node', ['index.js'], {
    stdio: 'inherit',
    env: { ...process.env }
  });
  
  appProcess.on('close', (code) => {
    console.log(`Server exited with code ${code}`);
    process.exit(code);
  });
  
  appProcess.on('error', (err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
});

migrateProcess.on('error', (err) => {
  console.error('Failed to run migrations:', err);
  process.exit(1);
});

#!/usr/bin/env node

/**
 * Deployment test script
 * Verifies that the application can start and connect to the database
 */

const { spawn } = require('child_process');
require('dotenv').config(); // Load environment variables from .env file

console.log('🧪 Testing deployment configuration...');

// Test 1: Check if required environment variables are set
console.log('\n1️⃣ Checking environment variables...');

const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

console.log('✅ All required environment variables are set');

// Test 2: Test database connection
console.log('\n2️⃣ Testing database connection...');

const testDbProcess = spawn('node', ['-e', `
  const db = require('./db');
  db.query('SELECT NOW()')
    .then(result => {
      console.log('✅ Database connection successful');
      console.log('Current time:', result.rows[0].now);
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Database connection failed:', err.message);
      process.exit(1);
    });
`], {
  stdio: 'inherit',
  env: { ...process.env }
});

testDbProcess.on('close', (code) => {
  if (code !== 0) {
    console.error('❌ Database connection test failed');
    process.exit(1);
  }
  
  console.log('\n3️⃣ Testing application startup...');
  
  // Test 3: Test application startup (timeout after 10 seconds)
  const appProcess = spawn('node', ['index.js'], {
    stdio: 'pipe',
    env: { ...process.env }
  });
  
  let appStarted = false;
  const timeout = setTimeout(() => {
    if (!appStarted) {
      console.error('❌ Application startup test timed out');
      appProcess.kill();
      process.exit(1);
    }
  }, 10000);
  
  appProcess.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('SmartPresence backend listening')) {
      appStarted = true;
      clearTimeout(timeout);
      console.log('✅ Application started successfully');
      console.log('🎉 All deployment tests passed!');
      appProcess.kill();
      process.exit(0);
    }
  });
  
  appProcess.stderr.on('data', (data) => {
    console.error('Application error:', data.toString());
  });
  
  appProcess.on('close', (code) => {
    clearTimeout(timeout);
    if (!appStarted) {
      console.error(`❌ Application exited with code ${code} before starting`);
      process.exit(1);
    }
  });
  
  appProcess.on('error', (err) => {
    clearTimeout(timeout);
    console.error('Failed to start application:', err);
    process.exit(1);
  });
});

testDbProcess.on('error', (err) => {
  console.error('Failed to test database connection:', err);
  process.exit(1);
});

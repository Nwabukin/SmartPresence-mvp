#!/usr/bin/env node

/**
 * Production migration script
 * Handles database migrations with proper error handling and retries
 */

const { spawn } = require('child_process');

console.log('🔄 Running database migrations...');

// Function to run migrations with retry logic
async function runMigrations(retries = 3) {
  return new Promise((resolve, reject) => {
    const migrateProcess = spawn('npm', ['run', 'migrate:up'], {
      stdio: 'pipe',
      env: { ...process.env }
    });

    let stdout = '';
    let stderr = '';

    migrateProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log(data.toString().trim());
    });

    migrateProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error(data.toString().trim());
    });

    migrateProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Migrations completed successfully');
        resolve();
      } else {
        console.error(`❌ Migration failed with code ${code}`);
        console.error('STDERR:', stderr);
        reject(new Error(`Migration failed with code ${code}`));
      }
    });

    migrateProcess.on('error', (err) => {
      console.error('Failed to run migrations:', err);
      reject(err);
    });
  });
}

// Main execution
async function main() {
  try {
    // Check if DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL environment variable is not set');
      console.error('Please set the DATABASE_URL environment variable in your Render dashboard');
      console.error('Go to your service settings > Environment and add:');
      console.error('DATABASE_URL=postgresql://user:password@host:port/database');
      process.exit(1);
    }

    console.log('📊 Database URL configured:', process.env.DATABASE_URL.replace(/\/\/.*@/, '//***:***@'));

    // Run migrations with retry logic
    let retries = 3;
    while (retries > 0) {
      try {
        await runMigrations();
        console.log('🎉 All migrations completed successfully');
        process.exit(0);
      } catch (error) {
        retries--;
        if (retries > 0) {
          console.log(`⚠️  Migration failed, retrying... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        } else {
          console.error('❌ All migration attempts failed');
          console.error('Error:', error.message);
          process.exit(1);
        }
      }
    }
  } catch (error) {
    console.error('❌ Migration script failed:', error.message);
    process.exit(1);
  }
}

main();

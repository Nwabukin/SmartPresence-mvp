#!/usr/bin/env node

/**
 * Migration: Add notifications table for student notifications
 * 
 * This migration adds the notifications table to support student notifications
 * including session reminders, attendance confirmations, session cancellations,
 * and class enrollment notifications.
 */

const { Pool } = require('pg');

// Load environment variables
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Starting notifications table migration...');
    
    await client.query('BEGIN');
    
    // Create notifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        notification_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        related_session_id INTEGER REFERENCES sessions(session_id) ON DELETE CASCADE,
        related_class_id INTEGER REFERENCES classes(class_id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP WITH TIME ZONE
      )
    `);
    
    // Create indexes for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at)
    `);
    
    await client.query('COMMIT');
    
    console.log('✅ Migration completed: notifications table and indexes created');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await runMigration();
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { runMigration };

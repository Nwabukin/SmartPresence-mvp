/*
  Migration: Add device_id to attendance_records and unique (session_id, device_id)
  Safe to run multiple times.
*/

const db = require('../../db');

async function run() {
  try {
    await db.query(
      `ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS device_id VARCHAR(200);`
    );
    await db.query(
      `CREATE INDEX IF NOT EXISTS idx_attendance_device_id ON attendance_records(device_id);`
    );
    await db.query(`
      DO $$ BEGIN
        ALTER TABLE attendance_records ADD CONSTRAINT uniq_session_device UNIQUE (session_id, device_id);
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    console.log(
      'Migration completed: attendance_records.device_id and unique(session_id, device_id)'
    );
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();

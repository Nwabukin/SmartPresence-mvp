/* eslint-disable camelcase */
const bcrypt = require('bcryptjs');

/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

// IMPORTANT: Change this password immediately after first login!
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'changeme';
const ADMIN_FIRST_NAME = 'Admin';
const ADMIN_LAST_NAME = 'User';
const ADMIN_ROLE = 'admin'; // Make sure this matches your ROLES definition

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = async (pgm) => {
  // 1. Hash the admin password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, salt);

  // 2. Insert the admin user using direct db query
  const insertSql =
    'INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO NOTHING;';
  await pgm.db.query(insertSql, [
    ADMIN_EMAIL,
    passwordHash,
    ADMIN_FIRST_NAME,
    ADMIN_LAST_NAME,
    ADMIN_ROLE,
  ]);

  console.log(`Admin user ${ADMIN_EMAIL} created or already exists.`);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = async (pgm) => {
  // Delete the admin user using direct db query
  const deleteSql = 'DELETE FROM users WHERE email = $1 AND role = $2;';
  await pgm.db.query(deleteSql, [ADMIN_EMAIL, ADMIN_ROLE]);

  console.log(`Admin user ${ADMIN_EMAIL} deleted.`);
};

const db = require('./db');

async function checkAdmin() {
  try {
    const result = await db.query('SELECT user_id, email, role FROM users WHERE email = $1', ['admin@example.com']);
    console.log('Admin user:', result.rows[0] || 'NOT FOUND');
    
    // Also check all users
    const allUsers = await db.query('SELECT user_id, email, role FROM users ORDER BY user_id');
    console.log('All users:');
    allUsers.rows.forEach(user => {
      console.log(`  ${user.user_id}: ${user.email} (${user.role})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('DB error:', error.message);
    process.exit(1);
  }
}

checkAdmin();

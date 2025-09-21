const db = require('./db');
const bcrypt = require('bcryptjs');

async function checkPassword() {
  try {
    console.log('🔍 Checking password for matric 21/0759...');
    const result = await db.query(
      'SELECT u.password_hash, sp.matric_no FROM users u JOIN student_profiles sp ON sp.user_id = u.user_id WHERE sp.matric_no = $1', 
      ['21/0759']
    );
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('✅ Found user:', user.matric_no);
      console.log('📊 Password hash length:', user.password_hash.length);
      
      // Test different passwords
      const passwords = ['Qweruiop@1', 'password123', 'admin123', '123456'];
      
      for (const password of passwords) {
        const isValid = await bcrypt.compare(password, user.password_hash);
        console.log(`🔐 Password "${password}" matches:`, isValid);
        if (isValid) {
          console.log('✅ CORRECT PASSWORD FOUND:', password);
          break;
        }
      }
    } else {
      console.log('❌ No user found with matric 21/0759');
    }
    
    await db.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkPassword();

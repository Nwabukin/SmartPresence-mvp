const db = require('./db');
const bcrypt = require('bcryptjs');

async function testStudentLogin() {
  try {
    console.log('🔍 Testing student login for matric 21/0759...');
    
    // First, let's check what's in the database
    const result = await db.query(
      'SELECT u.user_id, u.email, u.password_hash, u.first_name, u.last_name, sp.matric_no FROM users u JOIN student_profiles sp ON sp.user_id = u.user_id WHERE sp.matric_no = $1', 
      ['21/0759']
    );
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('✅ Found student:', user.first_name, user.last_name);
      console.log('📧 Email:', user.email);
      console.log('🎓 Matric:', user.matric_no);
      
      // Test the password
      const password = 'Qweruiop@1';
      const isValid = await bcrypt.compare(password, user.password_hash);
      console.log(`🔐 Password "${password}" is valid:`, isValid);
      
      if (isValid) {
        console.log('✅ LOGIN SUCCESSFUL!');
        console.log('🎉 Student can login with these credentials:');
        console.log('   Matric Number: 21/0759');
        console.log('   Password: Qweruiop@1');
      } else {
        console.log('❌ LOGIN FAILED - Password does not match');
        console.log('🔍 Password hash length:', user.password_hash.length);
      }
    } else {
      console.log('❌ No student found with matric 21/0759');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testStudentLogin();

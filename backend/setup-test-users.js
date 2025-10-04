#!/usr/bin/env node

/**
 * Setup test users for SmartPresence
 */

const bcrypt = require('bcryptjs');
const db = require('./db');

async function setupTestUsers() {
  console.log('🔧 Setting up test users...\n');

  try {
    // Check existing users
    const existingUsers = await db.query('SELECT email, role FROM users');
    console.log('Existing users:');
    existingUsers.rows.forEach(user => {
      console.log(`- ${user.email} (${user.role})`);
    });
    console.log('');

    // Create test users if they don't exist
    const testUsers = [
      {
        email: 'admin@smartpresence.com',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin'
      },
      {
        email: 'teacher@smartpresence.com',
        password: 'teacher123',
        firstName: 'John',
        lastName: 'Teacher',
        role: 'teacher'
      },
      {
        email: 'student@smartpresence.com',
        password: 'student123',
        firstName: 'Jane',
        lastName: 'Student',
        role: 'student'
      }
    ];

    for (const user of testUsers) {
      const existing = existingUsers.rows.find(u => u.email === user.email);
      
      if (existing) {
        console.log(`✅ User ${user.email} already exists`);
      } else {
        const passwordHash = await bcrypt.hash(user.password, 10);
        
        const result = await db.query(
          `INSERT INTO users (email, password_hash, first_name, last_name, role) 
           VALUES ($1, $2, $3, $4, $5) RETURNING user_id`,
          [user.email, passwordHash, user.firstName, user.lastName, user.role]
        );
        
        console.log(`✅ Created user ${user.email} (ID: ${result.rows[0].user_id})`);
        
        // Create profile for teacher and student
        if (user.role === 'teacher') {
          await db.query(
            `INSERT INTO teacher_profiles (user_id, lecturer_no, department, office, phone) 
             VALUES ($1, $2, $3, $4, $5)`,
            [result.rows[0].user_id, 'LEC001', 'Computer Science', 'Room 101', '123-456-7890']
          );
          console.log(`  ✅ Created teacher profile for ${user.email}`);
        }
        
        if (user.role === 'student') {
          await db.query(
            `INSERT INTO student_profiles (user_id, matric_no, department, course, level, phone) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [result.rows[0].user_id, 'STU001', 'Computer Science', 'Software Engineering', '300', '123-456-7890']
          );
          console.log(`  ✅ Created student profile for ${user.email}`);
        }
      }
    }

    console.log('\n🎉 Test users setup complete!');
    console.log('\nTest credentials:');
    console.log('Admin: admin@smartpresence.com / admin123');
    console.log('Teacher: teacher@smartpresence.com / teacher123');
    console.log('Student: student@smartpresence.com / student123');
    console.log('Student (Mobile): STU001 / student123');

  } catch (error) {
    console.error('❌ Error setting up test users:', error);
  } finally {
    process.exit(0);
  }
}

setupTestUsers();

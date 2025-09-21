#!/usr/bin/env node

/**
 * Helper script to get Render database URL
 * This script provides instructions for setting up the DATABASE_URL
 */

console.log('🔗 Render Database URL Setup Guide');
console.log('=====================================\n');

console.log('1️⃣ Create a Render Postgres Database:');
console.log('   - Go to https://dashboard.render.com');
console.log('   - Click "New +" → "PostgreSQL"');
console.log('   - Name: smartpresence-db');
console.log('   - Database: smartpresence');
console.log('   - User: smartpresence_user');
console.log('   - Plan: Free (for development)');
console.log('   - Click "Create Database"\n');

console.log('2️⃣ Get the Database URL:');
console.log('   - Go to your database dashboard');
console.log('   - Copy the "External Database URL"');
console.log('   - It should look like: postgresql://user:password@host:port/database\n');

console.log('3️⃣ Set Environment Variables in Render:');
console.log('   - Go to your web service dashboard');
console.log('   - Click "Environment" tab');
console.log('   - Add these variables:');
console.log('     DATABASE_URL=<your-postgres-url>');
console.log('     JWT_SECRET=<generate-a-strong-secret>');
console.log('     NODE_ENV=production');
console.log('     PORT=10000\n');

console.log('4️⃣ Generate JWT Secret:');
console.log('   Run this command to generate a secure JWT secret:');
console.log('   node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
console.log('');

console.log('5️⃣ Redeploy:');
console.log('   - After setting environment variables');
console.log('   - Go to your service dashboard');
console.log('   - Click "Manual Deploy" → "Deploy latest commit"');
console.log('');

console.log('✅ Your application should now start successfully!');

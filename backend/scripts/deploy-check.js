#!/usr/bin/env node

/**
 * Deployment readiness check script
 * Run this before deploying to ensure everything is configured correctly
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 SmartPresence Backend - Deployment Readiness Check\n');

const checks = [
  {
    name: 'Package.json exists',
    check: () => fs.existsSync('package.json'),
    fix: 'Ensure package.json is in the root directory',
  },
  {
    name: 'Main entry point exists',
    check: () => fs.existsSync('index.js'),
    fix: 'Ensure index.js is in the root directory',
  },
  {
    name: 'Database configuration exists',
    check: () => fs.existsSync('db/index.js'),
    fix: 'Ensure db/index.js exists',
  },
  {
    name: 'Environment example exists',
    check: () => fs.existsSync('env.example'),
    fix: 'Create env.example file with required environment variables',
  },
  {
    name: 'Render configuration exists',
    check: () => fs.existsSync('render.yaml'),
    fix: 'Create render.yaml configuration file',
  },
  {
    name: 'Migration files exist',
    check: () => {
      const migrationsDir = 'migrations';
      return (
        fs.existsSync(migrationsDir) && fs.readdirSync(migrationsDir).length > 0
      );
    },
    fix: 'Ensure migration files exist in migrations/ directory',
  },
  {
    name: 'Health check endpoint configured',
    check: () => {
      const indexContent = fs.readFileSync('index.js', 'utf8');
      return (
        indexContent.includes('/health') &&
        indexContent.includes("status: 'healthy'")
      );
    },
    fix: 'Add health check endpoint to index.js',
  },
  {
    name: 'CORS configuration is production-ready',
    check: () => {
      const indexContent = fs.readFileSync('index.js', 'utf8');
      return (
        indexContent.includes('process.env.FRONTEND_URL') &&
        indexContent.includes('corsOptions')
      );
    },
    fix: 'Update CORS configuration to use environment variables',
  },
  {
    name: 'JWT secret validation exists',
    check: () => {
      const authContent = fs.readFileSync('routes/auth.js', 'utf8');
      return (
        authContent.includes('JWT_SECRET') &&
        authContent.includes('process.exit(1)')
      );
    },
    fix: 'Ensure JWT secret validation exists in auth routes',
  },
  {
    name: 'Database URL validation exists',
    check: () => {
      const dbContent = fs.readFileSync('db/index.js', 'utf8');
      return (
        dbContent.includes('DATABASE_URL') &&
        dbContent.includes('throw new Error')
      );
    },
    fix: 'Ensure DATABASE_URL validation exists in db/index.js',
  },
];

let passedChecks = 0;
let failedChecks = [];

console.log('Running deployment readiness checks...\n');

checks.forEach((check, index) => {
  try {
    const result = check.check();
    if (result) {
      console.log(`✅ ${check.name}`);
      passedChecks++;
    } else {
      console.log(`❌ ${check.name}`);
      failedChecks.push({ ...check, index });
    }
  } catch (error) {
    console.log(`❌ ${check.name} (Error: ${error.message})`);
    failedChecks.push({ ...check, index, error: error.message });
  }
});

console.log(`\n📊 Results: ${passedChecks}/${checks.length} checks passed\n`);

if (failedChecks.length > 0) {
  console.log('❌ Failed checks:');
  failedChecks.forEach((check, index) => {
    console.log(`\n${index + 1}. ${check.name}`);
    console.log(`   Fix: ${check.fix}`);
    if (check.error) {
      console.log(`   Error: ${check.error}`);
    }
  });

  console.log('\n🔧 Please fix the above issues before deploying.');
  process.exit(1);
} else {
  console.log(
    '🎉 All checks passed! Your application is ready for deployment.'
  );
  console.log('\n📋 Next steps:');
  console.log('1. Create a Render Postgres database');
  console.log('2. Deploy your web service on Render');
  console.log('3. Set the required environment variables');
  console.log('4. Test your deployment');
  console.log('\n📖 See DEPLOYMENT.md for detailed instructions.');
}

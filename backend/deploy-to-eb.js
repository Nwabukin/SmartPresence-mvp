#!/usr/bin/env node

/**
 * SmartPresence Backend - AWS Elastic Beanstalk Deployment Script
 * 
 * This script prepares your backend for deployment to AWS Elastic Beanstalk
 * and provides instructions for manual deployment.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 SmartPresence Backend - AWS Elastic Beanstalk Deployment');
console.log('========================================================\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Error: package.json not found. Please run this script from the backend directory.');
  process.exit(1);
}

console.log('✅ Backend directory confirmed');

// Check for required files
const requiredFiles = [
  'index.js',
  'package.json',
  '.ebextensions/01-environment.config',
  '.ebextensions/02-healthcheck.config',
  '.ebignore'
];

console.log('\n📋 Checking required files:');
let allFilesExist = true;
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ Some required files are missing. Please ensure all files are created.');
  process.exit(1);
}

console.log('\n✅ All required files present');

// Create deployment package
console.log('\n📦 Creating deployment package...');

try {
  // Create a temporary directory for the deployment package
  const deployDir = 'deploy-package';
  if (fs.existsSync(deployDir)) {
    execSync(`rmdir /s /q ${deployDir}`, { stdio: 'inherit' });
  }
  fs.mkdirSync(deployDir);

  // Copy necessary files
  const filesToCopy = [
    'index.js',
    'package.json',
    'routes/',
    'utils/',
    'db/',
    'middleware/',
    'services/',
    'scripts/',
    '.ebextensions/',
    '.ebignore'
  ];

  filesToCopy.forEach(file => {
    if (fs.existsSync(file)) {
      if (fs.statSync(file).isDirectory()) {
        execSync(`xcopy "${file}" "${deployDir}\\${file}" /E /I /Y`, { stdio: 'inherit' });
      } else {
        execSync(`copy "${file}" "${deployDir}\\${file}"`, { stdio: 'inherit' });
      }
    }
  });

  console.log('✅ Deployment package created in ./deploy-package/');
  
  // Create ZIP file
  console.log('\n🗜️  Creating ZIP file...');
  execSync(`powershell Compress-Archive -Path "${deployDir}\\*" -DestinationPath "smartpresence-backend.zip" -Force`, { stdio: 'inherit' });
  
  console.log('✅ ZIP file created: smartpresence-backend.zip');
  
  // Clean up
  execSync(`rmdir /s /q ${deployDir}`, { stdio: 'inherit' });
  
  console.log('\n🎉 Deployment package ready!');
  console.log('\n📋 Next Steps:');
  console.log('1. Go to AWS Elastic Beanstalk Console');
  console.log('2. Create Application: "SmartPresence"');
  console.log('3. Create Environment: "SmartPresence-Production"');
  console.log('4. Platform: Node.js 18');
  console.log('5. Upload: smartpresence-backend.zip');
  console.log('6. Configure environment variables in EB Console');
  console.log('\n🔧 Environment Variables to set in EB Console:');
  console.log('DATABASE_URL=postgresql://postgres:SmartPresence123@smartpresence.c7co2emswxi6.eu-central-1.rds.amazonaws.com:5432/smartpresence');
  console.log('JWT_SECRET=73c8a46f8ed4a0ea687854076134a1936d8936be7b24dca35805b85c3d2e91ad4deeaa2fd2e55264e3ac381f1ee7c33425c64ce5eee294f70b771fa10be93146');
  console.log('AWS_REGION=us-east-1');
  console.log('S3_BUCKET=smartpresence-biometrics-nwabu-us-east-1-1759414530');
  console.log('REKOG_COLLECTION_ID=smartpresence-students');
  console.log('NODE_ENV=production');
  console.log('PORT=8080');

} catch (error) {
  console.error('❌ Error creating deployment package:', error.message);
  process.exit(1);
}

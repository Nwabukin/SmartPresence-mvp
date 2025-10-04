#!/usr/bin/env node

/**
 * SmartPresence Backend - Create Deployment Package for AWS Elastic Beanstalk
 */

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🚀 Creating SmartPresence Backend Deployment Package');
console.log('==================================================\n');

// Clean up any existing deployment package
if (fs.existsSync('smartpresence-backend.zip')) {
  fs.unlinkSync('smartpresence-backend.zip');
  console.log('✅ Removed existing ZIP file');
}

if (fs.existsSync('deploy-package')) {
  execSync('rmdir /s /q deploy-package', { stdio: 'inherit' });
  console.log('✅ Cleaned up existing deploy-package directory');
}

// Create deployment directory
fs.mkdirSync('deploy-package');
console.log('✅ Created deploy-package directory');

// Copy files manually
const filesToCopy = [
  { src: 'index.js', dest: 'index.js' },
  { src: 'package.json', dest: 'package.json' },
  { src: 'package-lock.json', dest: 'package-lock.json' },
  { src: '.ebignore', dest: '.ebignore' },
  { src: 'routes', dest: 'routes' },
  { src: 'utils', dest: 'utils' },
  { src: 'db', dest: 'db' },
  { src: 'middleware', dest: 'middleware' },
  { src: 'services', dest: 'services' },
  { src: 'scripts', dest: 'scripts' },
  { src: '.ebextensions', dest: '.ebextensions' }
];

console.log('\n📋 Copying files:');
filesToCopy.forEach(({ src, dest }) => {
  if (fs.existsSync(src)) {
    try {
      if (fs.statSync(src).isDirectory()) {
        execSync(`xcopy "${src}" "deploy-package\\${dest}" /E /I /Y`, { stdio: 'pipe' });
        console.log(`✅ ${src}/ -> ${dest}/`);
      } else {
        execSync(`copy "${src}" "deploy-package\\${dest}"`, { stdio: 'pipe' });
        console.log(`✅ ${src} -> ${dest}`);
      }
    } catch (error) {
      console.log(`⚠️  ${src} - ${error.message}`);
    }
  } else {
    console.log(`❌ ${src} - NOT FOUND`);
  }
});

// Create ZIP file
console.log('\n🗜️  Creating ZIP file...');
try {
  execSync('powershell Compress-Archive -Path "deploy-package\\*" -DestinationPath "smartpresence-backend.zip" -Force', { stdio: 'inherit' });
  console.log('✅ ZIP file created: smartpresence-backend.zip');
} catch (error) {
  console.error('❌ Error creating ZIP:', error.message);
  process.exit(1);
}

// Clean up
execSync('rmdir /s /q deploy-package', { stdio: 'inherit' });
console.log('✅ Cleaned up temporary files');

console.log('\n🎉 Deployment package ready!');
console.log('\n📋 Next Steps:');
console.log('1. Go to AWS Elastic Beanstalk Console: https://console.aws.amazon.com/elasticbeanstalk/');
console.log('2. Click "Create Application"');
console.log('3. Application name: "SmartPresence"');
console.log('4. Click "Create Environment"');
console.log('5. Environment tier: Web server environment');
console.log('6. Platform: Node.js 18');
console.log('7. Application code: Upload your code');
console.log('8. Upload: smartpresence-backend.zip');
console.log('9. Click "Create Environment"');
console.log('\n🔧 After deployment, set these environment variables in EB Console:');
console.log('DATABASE_URL=postgresql://postgres:SmartPresence123@smartpresence.c7co2emswxi6.eu-central-1.rds.amazonaws.com:5432/smartpresence');
console.log('JWT_SECRET=73c8a46f8ed4a0ea687854076134a1936d8936be7b24dca35805b85c3d2e91ad4deeaa2fd2e55264e3ac381f1ee7c33425c64ce5eee294f70b771fa10be93146');
console.log('AWS_REGION=us-east-1');
console.log('S3_BUCKET=smartpresence-biometrics-nwabu-us-east-1-1759414530');
console.log('REKOG_COLLECTION_ID=smartpresence-students');
console.log('NODE_ENV=production');
console.log('PORT=8080');
console.log('\n🌐 Your backend will be available at: https://your-app-name.region.elasticbeanstalk.com');

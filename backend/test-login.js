#!/usr/bin/env node

/**
 * SmartPresence Backend - Login Testing Script
 * Tests login functionality for all roles
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'http://SmartPresence-Production.eba-unvwcgqr.us-east-1.elasticbeanstalk.com';

// Test data for different roles
const testUsers = [
  {
    role: 'Admin',
    endpoint: '/api/auth/login',
    data: { email: 'admin@example.com', password: 'changeme' }
  },
  {
    role: 'Teacher',
    endpoint: '/api/auth/login',
    data: { email: 'teacher@example.com', password: 'changeme' }
  },
  {
    role: 'Student (Web)',
    endpoint: '/api/auth/login',
    data: { email: 'student@example.com', password: 'changeme' }
  },
  {
    role: 'Student (Mobile)',
    endpoint: '/api/mobile/students/login',
    data: { matricNo: 'STU001', password: 'changeme' }
  }
];

function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ statusCode: res.statusCode, body: response });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: body });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

async function testLogins() {
  console.log('🧪 SmartPresence Backend - Login Testing');
  console.log('==========================================\n');

  for (const test of testUsers) {
    console.log(`Testing ${test.role} Login...`);
    console.log(`Endpoint: ${test.endpoint}`);
    console.log(`Data: ${JSON.stringify(test.data)}`);
    
    try {
      const response = await makeRequest(`${BASE_URL}${test.endpoint}`, test.data);
      
      if (response.statusCode === 200) {
        console.log('✅ SUCCESS');
        if (response.body.token) {
          console.log(`   Token: ${response.body.token.substring(0, 20)}...`);
        }
        if (response.body.user) {
          console.log(`   User: ${response.body.user.first_name} ${response.body.user.last_name}`);
          console.log(`   Role: ${response.body.user.role}`);
        }
      } else {
        console.log('❌ FAILED');
        console.log(`   Status: ${response.statusCode}`);
        console.log(`   Error: ${JSON.stringify(response.body)}`);
      }
    } catch (error) {
      console.log('❌ ERROR');
      console.log(`   ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
  }

  // Test health endpoint
  console.log('Testing Health Endpoint...');
  try {
    const response = await makeRequest(`${BASE_URL}/health`, {});
    console.log('✅ Health endpoint working');
  } catch (error) {
    console.log('❌ Health endpoint failed');
  }
}

// Run the tests
testLogins().catch(console.error);

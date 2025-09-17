# API Testing Guide

This guide provides examples for testing the SmartPresence API using various tools and methods.

## Prerequisites

1. Backend server running on `http://localhost:3000`
2. Valid user credentials for testing
3. API testing tool (Postman, curl, or similar)

## Authentication Flow

### 1. Login to get JWT token

**Using curl:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

**Using Postman:**
- Method: POST
- URL: `http://localhost:3000/api/auth/login`
- Headers: `Content-Type: application/json`
- Body (raw JSON):
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "admin@example.com",
      "role": "admin"
    }
  },
  "timestamp": "2025-01-17T10:30:00.000Z"
}
```

### 2. Use token in subsequent requests

**Using curl:**
```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Using Postman:**
- Add header: `Authorization: Bearer YOUR_JWT_TOKEN_HERE`

## User Management Testing

### Create a Student

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teststudent@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "Student",
    "role": "student",
    "profileStudent": {
      "matricNo": "STU001",
      "department": "Computer Science",
      "course": "BSc Computer Science",
      "level": "300",
      "phone": "+1234567890"
    }
  }'
```

### Create a Teacher

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testteacher@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "Teacher",
    "role": "teacher",
    "profileTeacher": {
      "lecturerNo": "LEC001",
      "department": "Computer Science",
      "office": "Room 101",
      "phone": "+1234567891"
    }
  }'
```

### Get All Users

```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### Update User

```bash
curl -X PUT http://localhost:3000/api/users/2 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Updated",
    "lastName": "Name",
    "profileStudent": {
      "department": "Updated Department",
      "course": "Updated Course",
      "level": "400",
      "phone": "+1234567899"
    }
  }'
```

## Room Management Testing

### Create Room

```bash
curl -X POST http://localhost:3000/api/rooms \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Room",
    "wifi_ssid": "Test_WiFi",
    "bluetooth_beacon_id": "BEACON_TEST"
  }'
```

### Get All Rooms

```bash
curl -X GET http://localhost:3000/api/rooms \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## Class Management Testing

### Create Class

```bash
curl -X POST http://localhost:3000/api/classes \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Class",
    "course_code": "TEST101",
    "description": "A test class for API testing"
  }'
```

### Get All Classes

```bash
curl -X GET http://localhost:3000/api/classes \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## Session Management Testing

### Create Session

```bash
curl -X POST http://localhost:3000/api/sessions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "class_id": 1,
    "room_id": 1,
    "start_time": "2025-01-18T09:00:00.000Z",
    "end_time": "2025-01-18T11:00:00.000Z"
  }'
```

### Get Session Attendance

```bash
curl -X GET http://localhost:3000/api/sessions/1/attendance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## Attendance Testing

### Mark Attendance

```bash
curl -X POST http://localhost:3000/api/students/attendance/mark \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "class_id": 1,
    "session_id": 1,
    "wifi_ssid": "Test_WiFi",
    "bluetooth_beacon_id": "BEACON_TEST"
  }'
```

### Update Attendance

```bash
curl -X PUT http://localhost:3000/api/attendance/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "late"
  }'
```

## Error Testing

### Test Invalid Authentication

```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer invalid_token"
```

**Expected Response:**
```json
{
  "success": false,
  "error": {
    "message": "Token is not valid",
    "type": "authentication",
    "statusCode": 401
  },
  "timestamp": "2025-01-17T10:30:00.000Z",
  "path": "/api/users",
  "method": "GET",
  "requestId": "req_1642428600000_abc123def"
}
```

### Test Validation Errors

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "123"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "type": "validation",
    "statusCode": 400,
    "details": [
      {
        "field": "email",
        "message": "\"email\" must be a valid email"
      },
      {
        "field": "password",
        "message": "\"password\" length must be at least 6 characters long"
      }
    ]
  },
  "timestamp": "2025-01-17T10:30:00.000Z",
  "path": "/api/users",
  "method": "POST",
  "requestId": "req_1642428600000_abc123def"
}
```

## Postman Collection

You can import the following Postman collection for easier testing:

```json
{
  "info": {
    "name": "SmartPresence API",
    "description": "API collection for SmartPresence",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{jwt_token}}",
        "type": "string"
      }
    ]
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3000/api"
    },
    {
      "key": "jwt_token",
      "value": ""
    }
  ],
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"admin@example.com\",\n  \"password\": \"admin123\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/auth/login",
              "host": ["{{base_url}}"],
              "path": ["auth", "login"]
            }
          }
        }
      ]
    },
    {
      "name": "Users",
      "item": [
        {
          "name": "Get All Users",
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{base_url}}/users",
              "host": ["{{base_url}}"],
              "path": ["users"]
            }
          }
        },
        {
          "name": "Create Student",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"teststudent@example.com\",\n  \"password\": \"password123\",\n  \"firstName\": \"Test\",\n  \"lastName\": \"Student\",\n  \"role\": \"student\",\n  \"profileStudent\": {\n    \"matricNo\": \"STU001\",\n    \"department\": \"Computer Science\",\n    \"course\": \"BSc Computer Science\",\n    \"level\": \"300\",\n    \"phone\": \"+1234567890\"\n  }\n}"
            },
            "url": {
              "raw": "{{base_url}}/users",
              "host": ["{{base_url}}"],
              "path": ["users"]
            }
          }
        }
      ]
    }
  ]
}
```

## Automated Testing

### Using Jest and Supertest

Create a test file `tests/api.test.js`:

```javascript
const request = require('supertest');
const app = require('../index');

describe('API Tests', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    // Login to get token
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'admin123'
      });
    
    authToken = response.body.data.token;
  });

  test('GET /api/users should return users', async () => {
    const response = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('POST /api/users should create a user', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      role: 'student',
      profileStudent: {
        matricNo: 'STU001',
        department: 'CS',
        course: 'BSc CS',
        level: '300'
      }
    };

    const response = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${authToken}`)
      .send(userData);
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    userId = response.body.data.user_id;
  });

  test('PUT /api/users/:id should update a user', async () => {
    const updateData = {
      firstName: 'Updated',
      lastName: 'Name'
    };

    const response = await request(app)
      .put(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateData);
    
    expect(response.status).toBe(200);
    expect(response.body.data.first_name).toBe('Updated');
  });

  test('DELETE /api/users/:id should delete a user', async () => {
    const response = await request(app)
      .delete(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

## Performance Testing

### Using Artillery

Create `artillery-config.yml`:

```yaml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
  variables:
    token: "YOUR_JWT_TOKEN_HERE"

scenarios:
  - name: "API Load Test"
    weight: 100
    flow:
      - get:
          url: "/api/users"
          headers:
            Authorization: "Bearer {{ token }}"
      - post:
          url: "/api/rooms"
          headers:
            Authorization: "Bearer {{ token }}"
            Content-Type: "application/json"
          json:
            name: "Test Room {{ $randomString() }}"
            wifi_ssid: "Test_WiFi_{{ $randomString() }}"
```

Run with: `artillery run artillery-config.yml`

## Security Testing

### Test Authentication Bypass

```bash
# Try to access protected endpoint without token
curl -X GET http://localhost:3000/api/users
```

### Test Authorization

```bash
# Try to access admin endpoint with student token
curl -X GET http://localhost:3000/api/rooms \
  -H "Authorization: Bearer STUDENT_TOKEN_HERE"
```

### Test Input Validation

```bash
# Try SQL injection
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com; DROP TABLE users; --",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User",
    "role": "student"
  }'
```

## Monitoring and Debugging

### Check Logs

```bash
# View error logs
tail -f backend/logs/error.log

# View combined logs (development)
tail -f backend/logs/combined.log
```

### Health Check

```bash
curl -X GET http://localhost:3000/test-db
```

### Request Tracking

All requests include a unique `requestId` in the response headers and error logs for easy tracking and debugging.

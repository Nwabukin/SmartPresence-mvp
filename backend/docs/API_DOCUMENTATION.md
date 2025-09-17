# SmartPresence API Documentation

## Overview

The SmartPresence API provides endpoints for managing users, rooms, classes, sessions, and attendance in an educational institution. The API follows RESTful principles and uses JWT authentication.

**Base URL**: `http://localhost:3000/api`

**Authentication**: Bearer Token (JWT)

## Authentication

All protected endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Login
**POST** `/auth/login`

Authenticate a user and receive a JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "role": "admin"
    }
  },
  "timestamp": "2025-01-17T10:30:00.000Z"
}
```

**Error Responses:**
- `400`: Validation error
- `401`: Invalid credentials

## User Management

### Get All Users
**GET** `/users`

Retrieve all users (Admin/Teacher only).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [
    {
      "user_id": 1,
      "email": "admin@example.com",
      "first_name": "Admin",
      "last_name": "User",
      "role": "admin",
      "created_at": "2025-01-17T10:30:00.000Z",
      "profile": null
    },
    {
      "user_id": 2,
      "email": "student@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "student",
      "created_at": "2025-01-17T10:30:00.000Z",
      "profile": {
        "matric_no": "STU001",
        "department": "Computer Science",
        "course": "BSc Computer Science",
        "level": "300",
        "phone": "+1234567890"
      }
    }
  ],
  "timestamp": "2025-01-17T10:30:00.000Z"
}
```

### Get User by ID
**GET** `/users/:id`

Retrieve a specific user by ID.

**Parameters:**
- `id` (integer, required): User ID

**Response (200):**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "user_id": 2,
    "email": "student@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "student",
    "created_at": "2025-01-17T10:30:00.000Z",
    "profile": {
      "matric_no": "STU001",
      "department": "Computer Science",
      "course": "BSc Computer Science",
      "level": "300",
      "phone": "+1234567890"
    }
  },
  "timestamp": "2025-01-17T10:30:00.000Z"
}
```

### Create User
**POST** `/users`

Create a new user (Admin only).

**Request Body (Student):**
```json
{
  "email": "newstudent@example.com",
  "password": "password123",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "student",
  "profileStudent": {
    "matricNo": "STU002",
    "department": "Mathematics",
    "course": "BSc Mathematics",
    "level": "200",
    "phone": "+1234567891"
  }
}
```

**Request Body (Teacher):**
```json
{
  "email": "newteacher@example.com",
  "password": "password123",
  "firstName": "Dr. John",
  "lastName": "Professor",
  "role": "teacher",
  "profileTeacher": {
    "lecturerNo": "LEC001",
    "department": "Computer Science",
    "office": "Room 101",
    "phone": "+1234567892"
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user_id": 3,
    "email": "newstudent@example.com",
    "first_name": "Jane",
    "last_name": "Smith",
    "role": "student",
    "created_at": "2025-01-17T10:30:00.000Z",
    "profile": {
      "matric_no": "STU002",
      "department": "Mathematics",
      "course": "BSc Mathematics",
      "level": "200",
      "phone": "+1234567891"
    }
  },
  "timestamp": "2025-01-17T10:30:00.000Z"
}
```

### Update User
**PUT** `/users/:id`

Update an existing user.

**Parameters:**
- `id` (integer, required): User ID

**Request Body:**
```json
{
  "firstName": "Jane Updated",
  "lastName": "Smith Updated",
  "profileStudent": {
    "department": "Updated Department",
    "course": "Updated Course",
    "level": "400",
    "phone": "+1234567899"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "user_id": 3,
    "email": "newstudent@example.com",
    "first_name": "Jane Updated",
    "last_name": "Smith Updated",
    "role": "student",
    "created_at": "2025-01-17T10:30:00.000Z",
    "profile": {
      "matric_no": "STU002",
      "department": "Updated Department",
      "course": "Updated Course",
      "level": "400",
      "phone": "+1234567899"
    }
  },
  "timestamp": "2025-01-17T10:30:00.000Z"
}
```

### Delete User
**DELETE** `/users/:id`

Delete a user (Admin only).

**Parameters:**
- `id` (integer, required): User ID

**Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": null,
  "timestamp": "2025-01-17T10:30:00.000Z"
}
```

## Room Management

### Get All Rooms
**GET** `/rooms`

Retrieve all rooms (Admin only).

**Response (200):**
```json
{
  "success": true,
  "message": "Rooms retrieved successfully",
  "data": [
    {
      "room_id": 1,
      "name": "Lecture Hall A",
      "wifi_ssid": "SmartPresence_LectureA",
      "bluetooth_beacon_id": "BEACON_001",
      "created_at": "2025-01-17T10:30:00.000Z"
    }
  ],
  "timestamp": "2025-01-17T10:30:00.000Z"
}
```

### Create Room
**POST** `/rooms`

Create a new room (Admin only).

**Request Body:**
```json
{
  "name": "Computer Lab 1",
  "wifi_ssid": "SmartPresence_Lab1",
  "bluetooth_beacon_id": "BEACON_002"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Room created successfully",
  "data": {
    "room_id": 2,
    "name": "Computer Lab 1",
    "wifi_ssid": "SmartPresence_Lab1",
    "bluetooth_beacon_id": "BEACON_002",
    "created_at": "2025-01-17T10:30:00.000Z"
  },
  "timestamp": "2025-01-17T10:30:00.000Z"
}
```

### Update Room
**PUT** `/rooms/:id`

Update an existing room (Admin only).

**Parameters:**
- `id` (integer, required): Room ID

**Request Body:**
```json
{
  "name": "Updated Computer Lab 1",
  "wifi_ssid": "Updated_SmartPresence_Lab1"
}
```

### Delete Room
**DELETE** `/rooms/:id`

Delete a room (Admin only).

**Parameters:**
- `id` (integer, required): Room ID

## Class Management

### Get All Classes
**GET** `/classes`

Retrieve all classes.

**Response (200):**
```json
{
  "success": true,
  "message": "Classes retrieved successfully",
  "data": [
    {
      "class_id": 1,
      "name": "Introduction to Programming",
      "course_code": "CS101",
      "description": "Basic programming concepts",
      "teacher_id": 2,
      "created_at": "2025-01-17T10:30:00.000Z"
    }
  ],
  "timestamp": "2025-01-17T10:30:00.000Z"
}
```

### Create Class
**POST** `/classes`

Create a new class.

**Request Body:**
```json
{
  "name": "Data Structures",
  "course_code": "CS201",
  "description": "Advanced data structures and algorithms"
}
```

### Update Class
**PUT** `/classes/:id`

Update an existing class.

**Parameters:**
- `id` (integer, required): Class ID

### Delete Class
**DELETE** `/classes/:id`

Delete a class.

**Parameters:**
- `id` (integer, required): Class ID

## Session Management

### Get All Sessions
**GET** `/sessions`

Retrieve all sessions.

**Response (200):**
```json
{
  "success": true,
  "message": "Sessions retrieved successfully",
  "data": [
    {
      "session_id": 1,
      "class_id": 1,
      "room_id": 1,
      "start_time": "2025-01-17T09:00:00.000Z",
      "end_time": "2025-01-17T11:00:00.000Z",
      "created_at": "2025-01-17T10:30:00.000Z"
    }
  ],
  "timestamp": "2025-01-17T10:30:00.000Z"
}
```

### Create Session
**POST** `/sessions`

Create a new session.

**Request Body:**
```json
{
  "class_id": 1,
  "room_id": 1,
  "start_time": "2025-01-18T09:00:00.000Z",
  "end_time": "2025-01-18T11:00:00.000Z"
}
```

### Get Session Attendance
**GET** `/sessions/:sessionId/attendance`

Get attendance records for a specific session.

**Parameters:**
- `sessionId` (integer, required): Session ID

**Response (200):**
```json
{
  "success": true,
  "message": "Attendance retrieved successfully",
  "data": [
    {
      "attendance_id": 1,
      "student_id": 2,
      "session_id": 1,
      "status": "present",
      "marked_at": "2025-01-17T09:15:00.000Z"
    }
  ],
  "timestamp": "2025-01-17T10:30:00.000Z"
}
```

## Attendance Management

### Mark Attendance
**POST** `/students/attendance/mark`

Mark attendance for a student.

**Request Body:**
```json
{
  "class_id": 1,
  "session_id": 1,
  "wifi_ssid": "SmartPresence_LectureA",
  "bluetooth_beacon_id": "BEACON_001"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Attendance marked successfully",
  "data": {
    "attendance_id": 1,
    "student_id": 2,
    "session_id": 1,
    "status": "present",
    "marked_at": "2025-01-17T09:15:00.000Z"
  },
  "timestamp": "2025-01-17T10:30:00.000Z"
}
```

### Update Attendance
**PUT** `/attendance/:recordId`

Update attendance record (Admin/Teacher only).

**Parameters:**
- `recordId` (integer, required): Attendance record ID

**Request Body:**
```json
{
  "status": "late"
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "type": "error_type",
    "statusCode": 400,
    "details": [] // Only for validation errors
  },
  "timestamp": "2025-01-17T10:30:00.000Z",
  "path": "/api/users/123",
  "method": "GET",
  "requestId": "req_1642428600000_abc123def"
}
```

### Common Error Types

- **validation**: Input validation errors
- **authentication**: Authentication failures
- **authorization**: Authorization failures
- **not_found**: Resource not found
- **conflict**: Resource conflicts
- **database**: Database operation failures

### HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (duplicate resource)
- `500`: Internal Server Error

## Rate Limiting

Currently no rate limiting is implemented. Consider implementing rate limiting for production use.

## Pagination

Currently no pagination is implemented. Consider implementing pagination for endpoints that return large datasets.

## Webhooks

No webhooks are currently implemented.

## SDKs

No official SDKs are currently available. The API can be consumed using any HTTP client.

## Support

For API support, please contact the development team or create an issue in the project repository.

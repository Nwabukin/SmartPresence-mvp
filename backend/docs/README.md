# SmartPresence Backend Documentation

This directory contains comprehensive documentation for the SmartPresence backend API.

## Documentation Files

### 📚 [API Documentation](./API_DOCUMENTATION.md)

Complete API reference with all endpoints, request/response schemas, authentication requirements, and example requests/responses.

### 🔧 [Swagger Specification](./swagger.yaml)

OpenAPI 3.0 specification file for interactive API documentation. Can be imported into tools like:

- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [Postman](https://www.postman.com/)
- [Insomnia](https://insomnia.rest/)

### 🧪 [API Testing Guide](./API_TESTING_GUIDE.md)

Comprehensive guide for testing the API including:

- Authentication flow examples
- cURL commands for all endpoints
- Postman collection
- Automated testing with Jest
- Performance testing with Artillery
- Security testing scenarios

### ⚠️ [Error Handling Documentation](./ERROR_HANDLING.md)

Detailed documentation of the error handling system including:

- Custom error classes
- Error response format
- Logging system
- Request tracking
- Best practices

## Quick Start

### 1. View Interactive API Documentation

**Option A: Swagger UI (Recommended)**

1. Install Swagger UI: `npm install -g swagger-ui-serve`
2. Run: `swagger-ui-serve backend/docs/swagger.yaml`
3. Open: `http://localhost:3001`

**Option B: Online Swagger Editor**

1. Go to: https://editor.swagger.io/
2. Copy and paste the contents of `swagger.yaml`
3. Explore the interactive documentation

### 2. Test the API

**Using cURL:**

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}'

# Use the returned token in subsequent requests
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Using Postman:**

1. Import the Postman collection from the [API Testing Guide](./API_TESTING_GUIDE.md)
2. Set the `base_url` variable to `http://localhost:3000/api`
3. Login to get a token and set the `jwt_token` variable

### 3. Run Automated Tests

```bash
# Install test dependencies
npm install --save-dev jest supertest

# Run tests
npm test
```

## API Overview

### Base URL

- Development: `http://localhost:3000/api`
- Production: `https://api.smartpresence.com/api`

### Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Response Format

All responses follow a consistent format:

**Success Response:**

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2025-01-17T10:30:00.000Z"
}
```

**Error Response:**

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "type": "error_type",
    "statusCode": 400,
    "details": []
  },
  "timestamp": "2025-01-17T10:30:00.000Z",
  "path": "/api/endpoint",
  "method": "GET",
  "requestId": "req_1642428600000_abc123def"
}
```

## Endpoints Summary

### Authentication

- `POST /auth/login` - User login

### User Management

- `GET /users` - Get all users (Admin/Teacher)
- `GET /users/:id` - Get user by ID
- `POST /users` - Create user (Admin)
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user (Admin)

### Room Management

- `GET /rooms` - Get all rooms (Admin)
- `GET /rooms/:id` - Get room by ID (Admin)
- `POST /rooms` - Create room (Admin)
- `PUT /rooms/:id` - Update room (Admin)
- `DELETE /rooms/:id` - Delete room (Admin)

### Class Management

- `GET /classes` - Get all classes
- `GET /classes/:id` - Get class by ID
- `POST /classes` - Create class
- `PUT /classes/:id` - Update class
- `DELETE /classes/:id` - Delete class

### Session Management

- `GET /sessions` - Get all sessions
- `GET /sessions/:id` - Get session by ID
- `POST /sessions` - Create session
- `PUT /sessions/:id` - Update session
- `DELETE /sessions/:id` - Delete session
- `GET /sessions/:sessionId/attendance` - Get session attendance

### Attendance Management

- `POST /students/attendance/mark` - Mark attendance
- `PUT /attendance/:recordId` - Update attendance (Admin/Teacher)

## User Roles and Permissions

### Admin

- Full access to all endpoints
- Can create, read, update, delete users, rooms, classes, sessions
- Can manage attendance records

### Teacher

- Can view all users
- Can create, read, update, delete classes and sessions
- Can manage attendance for their classes
- Can update attendance records

### Student

- Can view their own profile
- Can mark attendance for sessions they're enrolled in
- Limited access to other endpoints

## Error Codes

| Code | Description                            |
| ---- | -------------------------------------- |
| 200  | Success                                |
| 201  | Created                                |
| 400  | Bad Request (validation errors)        |
| 401  | Unauthorized (authentication required) |
| 403  | Forbidden (insufficient permissions)   |
| 404  | Not Found                              |
| 409  | Conflict (duplicate resource)          |
| 500  | Internal Server Error                  |

## Rate Limiting

Currently no rate limiting is implemented. Consider implementing rate limiting for production use.

## Pagination

Currently no pagination is implemented. Consider implementing pagination for endpoints that return large datasets.

## Webhooks

No webhooks are currently implemented.

## SDKs

No official SDKs are currently available. The API can be consumed using any HTTP client.

## Support

For API support:

1. Check the documentation in this directory
2. Review the error handling documentation for troubleshooting
3. Check the logs in `backend/logs/` for detailed error information
4. Contact the development team or create an issue in the project repository

## Contributing

When adding new endpoints or modifying existing ones:

1. Update the [API Documentation](./API_DOCUMENTATION.md)
2. Update the [Swagger specification](./swagger.yaml)
3. Add test cases to the [API Testing Guide](./API_TESTING_GUIDE.md)
4. Ensure proper error handling is implemented
5. Update this README if needed

## Changelog

### Version 1.0.0

- Initial API implementation
- User management with role-based profiles
- Room management
- Class and session management
- Attendance tracking
- Comprehensive error handling
- Input validation with Joi
- Structured logging
- Complete API documentation

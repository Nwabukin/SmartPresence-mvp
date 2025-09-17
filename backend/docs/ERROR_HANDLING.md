# Error Handling System

This document describes the comprehensive error handling system implemented in the SmartPresence backend.

## Overview

The error handling system provides:
- Consistent error responses across all API endpoints
- Proper HTTP status codes
- Detailed error messages
- Comprehensive error logging
- Request tracking with unique IDs

## Error Classes

### AppError (Base Class)
- **Status Code**: Configurable
- **Usage**: Base class for all custom errors
- **Properties**: `statusCode`, `isOperational`, `status`

### ValidationError
- **Status Code**: 400
- **Usage**: Input validation failures
- **Properties**: `details` (array of validation errors)

### AuthenticationError
- **Status Code**: 401
- **Usage**: Authentication failures (invalid/missing tokens)
- **Default Message**: "Authentication failed"

### AuthorizationError
- **Status Code**: 403
- **Usage**: Authorization failures (insufficient permissions)
- **Default Message**: "Access denied"

### NotFoundError
- **Status Code**: 404
- **Usage**: Resource not found
- **Default Message**: "{Resource} not found"

### ConflictError
- **Status Code**: 409
- **Usage**: Resource conflicts (duplicate entries)
- **Default Message**: "Resource already exists"

### DatabaseError
- **Status Code**: 500
- **Usage**: Database operation failures
- **Default Message**: "Database operation failed"

## Error Response Format

All errors follow a consistent response format:

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

## Usage Examples

### Throwing Custom Errors

```javascript
const { NotFoundError, AuthorizationError } = require('../utils/errorHandler');

// Throw a not found error
if (!user) {
  throw new NotFoundError('User');
}

// Throw an authorization error
if (user.role !== 'admin') {
  throw new AuthorizationError('Admin access required');
}
```

### Using Async Handler

```javascript
const { asyncHandler } = require('../utils/errorHandler');

router.get('/users', asyncHandler(async (req, res) => {
  // Any thrown errors will be automatically caught and handled
  const users = await db.query('SELECT * FROM users');
  res.json(successResponse(users));
}));
```

### Success Response Format

```javascript
const { successResponse } = require('../utils/errorHandler');

res.json(successResponse(data, 'Users retrieved successfully', 200));
```

## Error Logging

### Log Levels
- **ERROR**: Server errors (5xx)
- **WARN**: Client errors (4xx)
- **INFO**: Successful operations
- **DEBUG**: Detailed debugging information

### Log Files
- `logs/error.log`: Error-level logs
- `logs/warn.log`: Warning-level logs
- `logs/combined.log`: All logs (development only)

### Log Format
```json
{
  "timestamp": "2025-01-17T10:30:00.000Z",
  "level": "error",
  "message": "User not found",
  "type": "not_found",
  "statusCode": 404,
  "path": "/api/users/123",
  "method": "GET",
  "userAgent": "Mozilla/5.0...",
  "ip": "127.0.0.1",
  "userId": 456,
  "userRole": "admin",
  "requestId": "req_1642428600000_abc123def"
}
```

## Request Tracking

Every request is assigned a unique ID for tracking:
- **Header**: `X-Request-ID`
- **Format**: `req_{timestamp}_{random}`
- **Usage**: Error correlation and debugging

## Database Error Handling

The system automatically handles common PostgreSQL errors:

- **23505**: Unique constraint violation → ConflictError
- **23503**: Foreign key constraint violation → ConflictError
- **23502**: Not null constraint violation → ValidationError

## JWT Error Handling

- **JsonWebTokenError**: Invalid token → AuthenticationError
- **TokenExpiredError**: Expired token → AuthenticationError

## Middleware Integration

### Global Error Handler
```javascript
app.use(globalErrorHandler); // Must be last
```

### Request ID Middleware
```javascript
app.use(requestIdMiddleware);
```

### 404 Handler
```javascript
app.use(notFoundHandler);
```

## Best Practices

1. **Use Custom Error Classes**: Always use the appropriate error class instead of generic errors
2. **Async Handler**: Wrap async route handlers with `asyncHandler`
3. **Meaningful Messages**: Provide clear, actionable error messages
4. **Log Appropriately**: Errors are automatically logged, but add context when needed
5. **Consistent Responses**: Use `successResponse` for successful operations

## Environment-Specific Behavior

### Development
- Stack traces included in error responses
- All logs written to `combined.log`
- Detailed error information

### Production
- Stack traces hidden from responses
- Only error/warn logs written to files
- Sanitized error messages

## Monitoring and Alerting

The logging system is designed to integrate with monitoring services:
- Structured JSON logs for easy parsing
- Request IDs for correlation
- Error categorization for alerting
- Performance metrics (response times)

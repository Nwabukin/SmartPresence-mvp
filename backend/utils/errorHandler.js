const logger = require('./logger');

// Custom error classes for different types of errors
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = []) {
    super(message, 400);
    this.details = details;
    this.type = 'validation';
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.type = 'authentication';
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
    this.type = 'authorization';
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
    this.type = 'not_found';
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409);
    this.type = 'conflict';
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database operation failed') {
    super(message, 500);
    this.type = 'database';
  }
}

// Error response formatter
const formatErrorResponse = (error, req) => {
  const baseResponse = {
    success: false,
    error: {
      message: error.message,
      type: error.type || 'error',
      statusCode: error.statusCode || 500,
    },
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
  };

  // Add validation details if available
  if (error.details && error.details.length > 0) {
    baseResponse.error.details = error.details;
  }

  // Add request ID for tracking (if available)
  if (req.requestId) {
    baseResponse.requestId = req.requestId;
  }

  // In development, include stack trace
  if (process.env.NODE_ENV === 'development') {
    baseResponse.error.stack = error.stack;
  }

  return baseResponse;
};

// Error logging utility
const logError = (error, req) => {
  const logData = {
    type: error.type || 'error',
    statusCode: error.statusCode || 500,
    path: req.originalUrl,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    userId: req.user?.id || null,
    userRole: req.user?.role || null,
    requestId: req.requestId || null,
  };

  // Add stack trace for server errors
  if (error.statusCode >= 500) {
    logData.stack = error.stack;
  }

  // Add validation details if available
  if (error.details && error.details.length > 0) {
    logData.validationDetails = error.details;
  }

  // Use logger instead of console
  if (error.statusCode >= 500) {
    logger.error(error.message, logData);
  } else {
    logger.warn(error.message, logData);
  }
};

// Global error handler middleware
const globalErrorHandler = (error, req, res, next) => {
  // Log the error
  logError(error, req);

  // Handle different types of errors
  if (error.name === 'ValidationError') {
    // Joi validation errors
    const details = error.details ? error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value,
    })) : [];
    
    const validationError = new ValidationError('Validation failed', details);
    return res.status(validationError.statusCode).json(formatErrorResponse(validationError, req));
  }

  if (error.name === 'JsonWebTokenError') {
    const authError = new AuthenticationError('Invalid token');
    return res.status(authError.statusCode).json(formatErrorResponse(authError, req));
  }

  if (error.name === 'TokenExpiredError') {
    const authError = new AuthenticationError('Token expired');
    return res.status(authError.statusCode).json(formatErrorResponse(authError, req));
  }

  if (error.code === '23505') {
    // PostgreSQL unique constraint violation
    const conflictError = new ConflictError('Resource already exists');
    return res.status(conflictError.statusCode).json(formatErrorResponse(conflictError, req));
  }

  if (error.code === '23503') {
    // PostgreSQL foreign key constraint violation
    const conflictError = new ConflictError('Referenced resource does not exist');
    return res.status(conflictError.statusCode).json(formatErrorResponse(conflictError, req));
  }

  if (error.code === '23502') {
    // PostgreSQL not null constraint violation
    const validationError = new ValidationError('Required field is missing');
    return res.status(validationError.statusCode).json(formatErrorResponse(validationError, req));
  }

  // Handle custom AppError instances
  if (error instanceof AppError) {
    return res.status(error.statusCode).json(formatErrorResponse(error, req));
  }

  // Handle unexpected errors
  const serverError = new AppError(
    process.env.NODE_ENV === 'production' 
      ? 'Something went wrong' 
      : error.message,
    500,
    false
  );

  return res.status(serverError.statusCode).json(formatErrorResponse(serverError, req));
};

// Async error wrapper to catch async errors
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Request ID middleware for tracking
const requestIdMiddleware = (req, res, next) => {
  req.requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

// 404 handler for undefined routes
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl}`);
  next(error);
};

// Success response formatter
const successResponse = (data, message = 'Success', statusCode = 200) => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
};

// Pagination response formatter
const paginatedResponse = (data, page, limit, total, message = 'Success') => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    success: true,
    message,
    data,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
    timestamp: new Date().toISOString(),
  };
};

module.exports = {
  // Error classes
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  
  // Middleware
  globalErrorHandler,
  asyncHandler,
  requestIdMiddleware,
  notFoundHandler,
  
  // Response formatters
  successResponse,
  paginatedResponse,
  formatErrorResponse,
  
  // Utilities
  logError,
};

const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log levels
const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
};

// Get current timestamp
const getTimestamp = () => {
  return new Date().toISOString();
};

// Format log message
const formatLogMessage = (level, message, meta = {}) => {
  const logEntry = {
    timestamp: getTimestamp(),
    level,
    message,
    ...meta,
  };

  return JSON.stringify(logEntry);
};

// Write to log file
const writeToFile = (filename, message) => {
  const logFile = path.join(logsDir, filename);
  fs.appendFileSync(logFile, message + '\n');
};

// Console logger with colors
const consoleLog = (level, message, meta = {}) => {
  const colors = {
    error: '\x1b[31m', // Red
    warn: '\x1b[33m', // Yellow
    info: '\x1b[36m', // Cyan
    debug: '\x1b[37m', // White
  };

  const reset = '\x1b[0m';
  const color = colors[level] || '';

  console.log(`${color}[${level.toUpperCase()}]${reset} ${message}`, meta);
};

// Main logger function
const log = (level, message, meta = {}) => {
  const formattedMessage = formatLogMessage(level, message, meta);

  // Always log to console
  consoleLog(level, message, meta);

  // Log errors and warnings to file
  if (level === LOG_LEVELS.ERROR || level === LOG_LEVELS.WARN) {
    const filename = `${level}.log`;
    writeToFile(filename, formattedMessage);
  }

  // Log all messages to combined log in development
  if (process.env.NODE_ENV === 'development') {
    writeToFile('combined.log', formattedMessage);
  }
};

// Logger object with convenience methods
const logger = {
  error: (message, meta = {}) => log(LOG_LEVELS.ERROR, message, meta),
  warn: (message, meta = {}) => log(LOG_LEVELS.WARN, message, meta),
  info: (message, meta = {}) => log(LOG_LEVELS.INFO, message, meta),
  debug: (message, meta = {}) => log(LOG_LEVELS.DEBUG, message, meta),

  // Specialized logging methods
  request: (req, res, responseTime) => {
    const meta = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      userId: req.user?.id || null,
      userRole: req.user?.role || null,
      requestId: req.requestId || null,
    };

    const level = res.statusCode >= 400 ? LOG_LEVELS.WARN : LOG_LEVELS.INFO;
    log(level, `${req.method} ${req.originalUrl} ${res.statusCode}`, meta);
  },

  database: (operation, query, duration, error = null) => {
    const meta = {
      operation,
      query: query.substring(0, 200), // Truncate long queries
      duration: `${duration}ms`,
      error: error?.message || null,
    };

    const level = error ? LOG_LEVELS.ERROR : LOG_LEVELS.DEBUG;
    const message = error
      ? `Database error: ${operation}`
      : `Database operation: ${operation}`;
    log(level, message, meta);
  },

  auth: (action, userId, success, error = null) => {
    const meta = {
      action,
      userId,
      success,
      error: error?.message || null,
    };

    const level = success ? LOG_LEVELS.INFO : LOG_LEVELS.WARN;
    const message = success
      ? `Authentication success: ${action}`
      : `Authentication failed: ${action}`;
    log(level, message, meta);
  },
};

module.exports = logger;

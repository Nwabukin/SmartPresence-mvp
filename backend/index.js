const express = require('express');
const cors = require('cors');
const db = require('./db'); // Import the query function
const {
  globalErrorHandler,
  requestIdMiddleware,
  notFoundHandler,
} = require('./utils/errorHandler');
const logger = require('./utils/logger');
const app = express();
const port = process.env.PORT || 3000;

// CORS middleware to allow requests from frontend and mobile app
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      process.env.MOBILE_URL || 'http://192.168.1.5:3001',
      'http://localhost:3000', // For testing
      'https://smartpresence.onrender.com', // Production frontend URL
    ];

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

// Middleware to parse JSON bodies
app.use(express.json());

// Request ID middleware for tracking
app.use(requestIdMiddleware);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.request(req, res, duration);
  });

  next();
});

// Import routes with error handling
console.log('📁 Loading route modules...');
let authRoutes, userRoutes, roomRoutes, classRoutes, sessionRoutes, attendanceRoutes, mobileRoutes;

try {
  authRoutes = require('./routes/auth');
  console.log('✅ Auth routes loaded');
} catch (error) {
  console.error('❌ Failed to load auth routes:', error.message);
  console.error('💡 Check: routes/auth.js exists and has no syntax errors');
}

try {
  userRoutes = require('./routes/users');
  console.log('✅ User routes loaded');
} catch (error) {
  console.error('❌ Failed to load user routes:', error.message);
  console.error('💡 Check: routes/users.js exists and has no syntax errors');
}

try {
  roomRoutes = require('./routes/rooms');
  console.log('✅ Room routes loaded');
} catch (error) {
  console.error('❌ Failed to load room routes:', error.message);
  console.error('💡 Check: routes/rooms.js exists and has no syntax errors');
}

try {
  classRoutes = require('./routes/classes');
  console.log('✅ Class routes loaded');
} catch (error) {
  console.error('❌ Failed to load class routes:', error.message);
  console.error('💡 Check: routes/classes.js exists and has no syntax errors');
}

try {
  sessionRoutes = require('./routes/sessions');
  console.log('✅ Session routes loaded');
} catch (error) {
  console.error('❌ Failed to load session routes:', error.message);
  console.error('💡 Check: routes/sessions.js exists and has no syntax errors');
}

try {
  attendanceRoutes = require('./routes/attendance');
  console.log('✅ Attendance routes loaded');
} catch (error) {
  console.error('❌ Failed to load attendance routes:', error.message);
  console.error('💡 Check: routes/attendance.js exists and has no syntax errors');
}

try {
  mobileRoutes = require('./routes/mobile');
  console.log('✅ Mobile routes loaded');
} catch (error) {
  console.error('❌ Failed to load mobile routes:', error.message);
  console.error('💡 Check: routes/mobile.js exists and has no syntax errors');
}

// Define routes
app.get('/', (req, res) => {
  res.send('Hello from SmartPresence Backend!');
});

// Mount routes with error handling
console.log('🔗 Mounting routes...');

if (authRoutes) {
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes mounted at /api/auth');
}

if (userRoutes) {
  app.use('/api/users', userRoutes);
  console.log('✅ User routes mounted at /api/users');
}

if (roomRoutes) {
  app.use('/api/rooms', roomRoutes);
  console.log('✅ Room routes mounted at /api/rooms');
}

if (classRoutes) {
  app.use('/api/classes', classRoutes);
  console.log('✅ Class routes mounted at /api/classes');
}

if (sessionRoutes) {
  app.use('/api/sessions', sessionRoutes);
  console.log('✅ Session routes mounted at /api/sessions');
}

if (attendanceRoutes) {
  app.use('/api/attendance', attendanceRoutes);
  console.log('✅ Attendance routes mounted at /api/attendance');
}

if (mobileRoutes) {
  app.use('/api/mobile', mobileRoutes);
  console.log('✅ Mobile routes mounted at /api/mobile');
}

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'SmartPresence Backend',
  });
});

// Simple route to test DB connection
app.get('/test-db', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()'); // Use the query function
    res.json({ success: true, time: result.rows[0].now });
  } catch (err) {
    console.error('Database query error:', err);
    res.status(500).json({ success: false, error: 'Database query failed' });
  }
});

// Handle 404 for undefined routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(globalErrorHandler);

if (require.main === module) {
  app.listen(port, '0.0.0.0', () => {
    console.log(`SmartPresence backend listening on port ${port} (0.0.0.0)`);
  });
}

module.exports = app;

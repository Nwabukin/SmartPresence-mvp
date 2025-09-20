const express = require('express');
const cors = require('cors');
const db = require('./db'); // Import the query function
const { 
  globalErrorHandler, 
  requestIdMiddleware, 
  notFoundHandler 
} = require('./utils/errorHandler');
const logger = require('./utils/logger');
const app = express();
const port = process.env.PORT || 3000;

// CORS middleware to allow requests from frontend and mobile app
app.use(cors({
  origin: ['http://localhost:5173', 'http://192.168.1.5:3001'], // Frontend URL and mobile app
  credentials: true
}));

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

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users'); // Import user routes
const roomRoutes = require('./routes/rooms'); // Import room routes
const classRoutes = require('./routes/classes'); // Import class routes
const sessionRoutes = require('./routes/sessions'); // Import session routes
const attendanceRoutes = require('./routes/attendance'); // Import attendance routes
const mobileRoutes = require('./routes/mobile'); // Mobile routes

// Define routes
app.get('/', (req, res) => {
  res.send('Hello from SmartPresence Backend!');
});

// Mount auth routes
app.use('/api/auth', authRoutes);

// Mount user routes
app.use('/api/users', userRoutes);

// Mount room routes
app.use('/api/rooms', roomRoutes);

// Mount class routes
app.use('/api/classes', classRoutes);

// Mount session routes
app.use('/api/sessions', sessionRoutes);

// Mount attendance routes
app.use('/api/attendance', attendanceRoutes);

// Mount mobile routes
app.use('/api/mobile', mobileRoutes);

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

app.listen(port, () => {
  console.log(`SmartPresence backend listening on port ${port}`);
}); 
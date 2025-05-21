const express = require('express');
const db = require('./db'); // Import the query function
const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users'); // Import user routes
const roomRoutes = require('./routes/rooms'); // Import room routes
const classRoutes = require('./routes/classes'); // Import class routes
const sessionRoutes = require('./routes/sessions'); // Import session routes
const attendanceRoutes = require('./routes/attendance'); // Import attendance routes
const studentRoutes = require('./routes/studentRoutes'); // Import student routes

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

// Mount student routes
app.use('/api/students', studentRoutes);

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

app.listen(port, () => {
  console.log(`SmartPresence backend listening on port ${port}`);
}); 
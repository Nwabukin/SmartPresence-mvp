const express = require('express');
const db = require('./db'); // Import the query function
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello from SmartPresence Backend!');
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

app.listen(port, () => {
  console.log(`SmartPresence backend listening on port ${port}`);
}); 
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db'); // Adjust path to db connection

const router = express.Router();

// Load JWT secret from environment variables
// IMPORTANT: Set this in your .env file!
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET environment variable is not set.');
  process.exit(1); // Exit if secret is not set
}

// --- Registration --- 
// POST /api/auth/register
// router.post('/register', async (req, res) => { ... }); // REMOVED - User creation now handled by POST /api/users (Admin only)

// --- Login --- 
// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    // Find user by email
    const result = await db.query('SELECT user_id, email, password_hash, role, first_name, last_name FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' }); // User not found
    }

    // Compare submitted password with stored hash
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' }); // Password incorrect
    }

    // --- Generate JWT --- 
    const payload = {
      user: {
        id: user.user_id,
        email: user.email,
        role: user.role,
        // Add other non-sensitive info if needed
      },
    };

    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '1h' }, // Token expires in 1 hour (adjust as needed)
      (err, token) => {
        if (err) throw err;
        res.json({ 
          token, 
          user: { // Send back some user info 
            id: user.user_id,
            email: user.email,
            role: user.role,
            firstName: user.first_name,
            lastName: user.last_name,
          } 
        });
      }
    );

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

module.exports = router; 
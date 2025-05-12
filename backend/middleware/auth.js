const jwt = require('jsonwebtoken');
require('dotenv').config(); // Ensure environment variables are loaded

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET environment variable is not set.');
  // Optionally exit or handle differently depending on your setup
  // process.exit(1);
}

module.exports = function (req, res, next) {
  // Get token from header
  const authHeader = req.header('Authorization');

  // Check if not token
  if (!authHeader) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Check if token is in the correct format 'Bearer <token>'
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ msg: 'Token is not valid (Format: Bearer <token>)' });
  }

  const token = parts[1];

  // Verify token
  try {
    // Verify the token using the secret
    const decoded = jwt.verify(token, JWT_SECRET);

    // Add user from payload to request object
    // The payload structure depends on what was put in during jwt.sign
    // In our case, it was { user: { id, email, role } }
    req.user = decoded.user;
    next(); // Pass control to the next middleware or route handler
  } catch (err) {
    console.error('Token verification failed:', err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
}; 
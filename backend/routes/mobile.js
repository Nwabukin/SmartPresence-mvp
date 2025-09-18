const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../db');
const { validate, schemas } = require('../utils/validation');
const authMiddleware = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET;

// Health
router.get('/health', (req, res) => {
  res.json({ ok: true });
});

// POST /api/mobile/students/login
router.post('/students/login', validate(schemas.auth.studentLogin), async (req, res) => {
  const { matricNo, password } = req.body;
  try {
    const q = await db.query(
      `SELECT u.user_id, u.email, u.password_hash, u.role, u.first_name, u.last_name
         FROM users u
         JOIN student_profiles sp ON sp.user_id = u.user_id
        WHERE sp.matric_no = $1`,
      [matricNo]
    );
    const user = q.rows[0];
    if (!user || user.role !== 'student') {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const payload = { user: { id: user.user_id, email: user.email, role: user.role } };
    jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: { id: user.user_id, email: user.email, role: user.role, firstName: user.first_name, lastName: user.last_name } });
    });
  } catch (err) {
    console.error('Student mobile login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// GET /api/mobile/me
router.get('/me', authMiddleware, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Forbidden' });
  try {
    const r = await db.query(
      `SELECT u.user_id, u.email, u.first_name, u.last_name, sp.matric_no, sp.department, sp.course, sp.level, sp.phone
         FROM users u LEFT JOIN student_profiles sp ON sp.user_id = u.user_id
        WHERE u.user_id = $1`,
      [req.user.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'User not found' });
    const u = r.rows[0];
    res.json({ user_id: u.user_id, email: u.email, first_name: u.first_name, last_name: u.last_name, profile: { matric_no: u.matric_no, department: u.department, course: u.course, level: u.level, phone: u.phone } });
  } catch (err) {
    console.error('Mobile me error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

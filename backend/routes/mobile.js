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

// GET /api/mobile/me/classes
router.get('/me/classes', authMiddleware, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Forbidden' });
  try {
    const r = await db.query(
      `SELECT c.class_id, c.name, c.description, c.created_at,
              u.user_id AS teacher_id, u.first_name AS teacher_first_name, u.last_name AS teacher_last_name
         FROM classes c
         JOIN enrollments e ON e.class_id = c.class_id
    LEFT JOIN users u ON u.user_id = c.teacher_id
        WHERE e.student_id = $1
        ORDER BY c.name ASC`,
      [req.user.id]
    );
    res.json(r.rows);
  } catch (err) {
    console.error('Mobile me classes error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/mobile/me/sessions?from=&to=
router.get('/me/sessions', authMiddleware, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Forbidden' });
  const { from, to } = req.query;
  try {
    const params = [req.user.id];
    let timeFilter = '';
    if (from) {
      params.push(new Date(from).toISOString());
      timeFilter += ` AND s.end_time >= $${params.length}`;
    }
    if (to) {
      params.push(new Date(to).toISOString());
      timeFilter += ` AND s.start_time <= $${params.length}`;
    }
    const q = await db.query(
      `SELECT s.session_id, s.class_id, s.room_id, s.start_time, s.end_time,
              c.name AS class_name,
              r.name AS room_name, r.wifi_ssid, r.bluetooth_beacon_id
         FROM sessions s
         JOIN enrollments e ON e.class_id = s.class_id AND e.student_id = $1
         LEFT JOIN classes c ON c.class_id = s.class_id
         LEFT JOIN rooms r ON r.room_id = s.room_id
        WHERE 1=1 ${timeFilter}
        ORDER BY s.start_time ASC`,
      params
    );
    res.json(q.rows);
  } catch (err) {
    console.error('Mobile me sessions error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/mobile/me/attendance
router.get('/me/attendance', authMiddleware, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Forbidden' });
  try {
    const q = await db.query(
      `SELECT ar.record_id, ar.session_id, ar.marked_at, ar.status,
              s.class_id, s.start_time, s.end_time,
              c.name AS class_name
         FROM attendance_records ar
         JOIN sessions s ON s.session_id = ar.session_id
         LEFT JOIN classes c ON c.class_id = s.class_id
        WHERE ar.student_id = $1
        ORDER BY ar.marked_at DESC`,
      [req.user.id]
    );
    res.json(q.rows);
  } catch (err) {
    console.error('Mobile me attendance error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/mobile/attendance/mark
router.post('/attendance/mark', authMiddleware, validate(schemas.attendance.mark), async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Forbidden' });
  const { class_id, session_id, wifi_ssid, bluetooth_beacon_id } = req.body;
  try {
    // Verify enrollment
    const enr = await db.query('SELECT 1 FROM enrollments WHERE student_id = $1 AND class_id = $2', [req.user.id, class_id]);
    if (!enr.rows.length) return res.status(403).json({ error: 'Not enrolled in this class' });

    // Load session with room
    const sess = await db.query(
      `SELECT s.session_id, s.class_id, s.room_id, s.start_time, s.end_time,
              r.wifi_ssid AS room_wifi, r.bluetooth_beacon_id AS room_beacon
         FROM sessions s JOIN rooms r ON r.room_id = s.room_id
        WHERE s.session_id = $1 AND s.class_id = $2`,
      [session_id, class_id]
    );
    if (!sess.rows.length) return res.status(404).json({ error: 'Session not found' });
    const s = sess.rows[0];

    // Time window: must be within session window
    const now = new Date();
    if (now < new Date(s.start_time) || now > new Date(s.end_time)) {
      return res.status(403).json({ error: 'Session not active for marking' });
    }

    // Location validation: wifi or beacon match
    if (s.room_wifi && wifi_ssid && s.room_wifi !== wifi_ssid) {
      return res.status(403).json({ error: 'Wi‑Fi mismatch' });
    }
    if (bluetooth_beacon_id && s.room_beacon && s.room_beacon !== bluetooth_beacon_id) {
      return res.status(403).json({ error: 'Beacon mismatch' });
    }

    // Idempotent insert
    const rec = await db.query(
      `INSERT INTO attendance_records (session_id, student_id, status)
       VALUES ($1, $2, 'present')
       ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status
       RETURNING record_id, session_id, student_id, status, marked_at`,
      [session_id, req.user.id]
    );
    const created = rec.rows[0];
    res.status(201).json(created);
  } catch (err) {
    console.error('Mobile attendance mark error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

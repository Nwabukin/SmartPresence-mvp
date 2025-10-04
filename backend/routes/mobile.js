const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../db');
const { validate, schemas } = require('../utils/validation');
const authMiddleware = require('../middleware/auth');
const NotificationService = require('../services/notificationService');
const {
  S3Client,
  PutObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const {
  RekognitionClient,
  IndexFacesCommand,
  SearchFacesByImageCommand,
} = require('@aws-sdk/client-rekognition');

const AWS_REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
const S3_BUCKET = process.env.S3_BUCKET;
const REKOG_COLLECTION_ID = process.env.REKOG_COLLECTION_ID;

const s3 = new S3Client({ region: AWS_REGION });
const rekog = new RekognitionClient({ region: AWS_REGION });
// POST /api/mobile/biometrics/enroll
router.post('/biometrics/enroll', authMiddleware, async (req, res) => {
  if (req.user.role !== 'student')
    return res.status(403).json({ error: 'Forbidden' });
  const { face_id } = req.body || {};
  if (!face_id || typeof face_id !== 'string') {
    return res.status(400).json({ error: 'face_id is required' });
  }
  try {
    // Ensure student profile exists
    const prof = await db.query(
      'SELECT user_id FROM student_profiles WHERE user_id = $1',
      [req.user.id]
    );
    if (!prof.rows.length) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    await db.query(
      'UPDATE student_profiles SET rekognition_face_id = $1 WHERE user_id = $2',
      [face_id, req.user.id]
    );

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Biometrics enroll error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});


// POST /api/mobile/biometrics/presign-upload
router.post('/biometrics/presign-upload', authMiddleware, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Forbidden' });
  try {
    if (!S3_BUCKET) return res.status(500).json({ error: 'S3 bucket not configured' });
    const { content_type, purpose } = req.body || {};
    if (!content_type || typeof content_type !== 'string') {
      return res.status(400).json({ error: 'content_type is required' });
    }
    const safePurpose = typeof purpose === 'string' ? purpose : 'enroll';
    const timestamp = Date.now();
    const key = `${safePurpose}/selfies/${req.user.id}/${timestamp}.jpg`;
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      ContentType: content_type,
    });
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 5 });
    return res.status(200).json({ upload_url: uploadUrl, s3_key: key, bucket: S3_BUCKET, region: AWS_REGION });
  } catch (err) {
    console.error('Presign upload error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/mobile/biometrics/index-face
router.post('/biometrics/index-face', authMiddleware, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Forbidden' });
  try {
    if (!REKOG_COLLECTION_ID) return res.status(500).json({ error: 'Rekognition collection not configured' });
    if (!S3_BUCKET) return res.status(500).json({ error: 'S3 bucket not configured' });
    const { s3_key } = req.body || {};
    if (!s3_key || typeof s3_key !== 'string') {
      return res.status(400).json({ error: 's3_key is required' });
    }
    const indexCmd = new IndexFacesCommand({
      CollectionId: REKOG_COLLECTION_ID,
      ExternalImageId: String(req.user.id),
      Image: {
        S3Object: { Bucket: S3_BUCKET, Name: s3_key },
      },
      DetectionAttributes: [],
      MaxFaces: 1,
      QualityFilter: 'AUTO',
    });
    const out = await rekog.send(indexCmd);
    const faceId = out?.FaceRecords?.[0]?.Face?.FaceId;
    if (!faceId) {
      return res.status(422).json({ error: 'No face detected' });
    }
    return res.status(200).json({ face_id: faceId });
  } catch (err) {
    console.error('Index face error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/mobile/biometrics/verify-face
// Body: { s3_key: string, threshold?: number }
router.post('/biometrics/verify-face', authMiddleware, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Forbidden' });
  try {
    if (!REKOG_COLLECTION_ID) return res.status(500).json({ error: 'Rekognition collection not configured' });
    if (!S3_BUCKET) return res.status(500).json({ error: 'S3 bucket not configured' });
    const { s3_key, threshold } = req.body || {};
    if (!s3_key || typeof s3_key !== 'string') {
      return res.status(400).json({ error: 's3_key is required' });
    }
    const faceThreshold = typeof threshold === 'number' ? threshold : 90; // default 90%

    const cmd = new SearchFacesByImageCommand({
      CollectionId: REKOG_COLLECTION_ID,
      Image: { S3Object: { Bucket: S3_BUCKET, Name: s3_key } },
      FaceMatchThreshold: faceThreshold,
      MaxFaces: 1,
    });
    const out = await rekog.send(cmd);
    const match = out?.FaceMatches?.[0];
    if (!match) {
      return res.status(200).json({ matched: false, confidence: 0 });
    }
    return res.status(200).json({
      matched: true,
      confidence: match.Similarity || match.Face?.Confidence || 0,
      face_id: match.Face?.FaceId,
      external_image_id: match.Face?.ExternalImageId,
    });
  } catch (err) {
    console.error('Verify face error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});


const JWT_SECRET = process.env.JWT_SECRET;

// Health
router.get('/health', (req, res) => {
  res.json({ ok: true });
});

// POST /api/mobile/students/login
router.post(
  '/students/login',
  validate(schemas.auth.studentLogin),
  async (req, res) => {
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
      const payload = {
        user: { id: user.user_id, email: user.email, role: user.role },
      };
      jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' }, (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.user_id,
            email: user.email,
            role: user.role,
            firstName: user.first_name,
            lastName: user.last_name,
          },
        });
      });
    } catch (err) {
      console.error('Student mobile login error:', err);
      res.status(500).json({ error: 'Server error during login.' });
    }
  }
);

// GET /api/mobile/me
router.get('/me', authMiddleware, async (req, res) => {
  if (req.user.role !== 'student')
    return res.status(403).json({ error: 'Forbidden' });
  try {
    const r = await db.query(
      `SELECT u.user_id, u.email, u.first_name, u.last_name, sp.matric_no, sp.department, sp.course, sp.level, sp.phone, sp.rekognition_face_id
         FROM users u LEFT JOIN student_profiles sp ON sp.user_id = u.user_id
        WHERE u.user_id = $1`,
      [req.user.id]
    );
    if (!r.rows.length)
      return res.status(404).json({ error: 'User not found' });
    const u = r.rows[0];
    res.json({
      user_id: u.user_id,
      email: u.email,
      first_name: u.first_name,
      last_name: u.last_name,
      profile: {
        matric_no: u.matric_no,
        department: u.department,
        course: u.course,
        level: u.level,
        phone: u.phone,
        is_biometric_enrolled: !!u.rekognition_face_id,
      },
    });
  } catch (err) {
    console.error('Mobile me error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/mobile/me/classes
router.get('/me/classes', authMiddleware, async (req, res) => {
  if (req.user.role !== 'student')
    return res.status(403).json({ error: 'Forbidden' });
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
  if (req.user.role !== 'student')
    return res.status(403).json({ error: 'Forbidden' });
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
  if (req.user.role !== 'student')
    return res.status(403).json({ error: 'Forbidden' });
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
router.post(
  '/attendance/mark',
  authMiddleware,
  validate(schemas.attendance.mark),
  async (req, res) => {
    if (req.user.role !== 'student')
      return res.status(403).json({ error: 'Forbidden' });
    const { class_id, session_id, wifi_ssid, bluetooth_beacon_id, device_id } =
      req.body;
    
    // Debug: Print received location data
    console.log('=== ATTENDANCE MARKING DEBUG ===');
    console.log('Received Wi-Fi SSID:', wifi_ssid);
    console.log('Received Bluetooth Beacon:', bluetooth_beacon_id);
    console.log('Received Device ID:', device_id);
    console.log('================================');
    
    try {
      // Check if student has biometric enrollment
      const biometricCheck = await db.query(
        'SELECT rekognition_face_id FROM student_profiles WHERE user_id = $1',
        [req.user.id]
      );
      if (!biometricCheck.rows.length || !biometricCheck.rows[0].rekognition_face_id) {
        return res.status(403).json({ error: 'Biometric enrollment required. Please enroll your face first.' });
      }

      // Verify enrollment
      const enr = await db.query(
        'SELECT 1 FROM enrollments WHERE student_id = $1 AND class_id = $2',
        [req.user.id, class_id]
      );
      if (!enr.rows.length)
        return res.status(403).json({ error: 'Not enrolled in this class' });

      // Load session with room
      const sess = await db.query(
        `SELECT s.session_id, s.class_id, s.room_id, s.start_time, s.end_time,
              r.wifi_ssid AS room_wifi, r.bluetooth_beacon_id AS room_beacon
         FROM sessions s JOIN rooms r ON r.room_id = s.room_id
        WHERE s.session_id = $1 AND s.class_id = $2`,
        [session_id, class_id]
      );
      if (!sess.rows.length)
        return res.status(404).json({ error: 'Session not found' });
      const s = sess.rows[0];

      // Time window: must be within session window
      const now = new Date();
      if (now < new Date(s.start_time) || now > new Date(s.end_time)) {
        return res
          .status(403)
          .json({ error: 'Session not active for marking' });
      }

      // Location validation: wifi is required if room has wifi configured
      console.log('Room Wi-Fi SSID:', s.room_wifi);
      console.log('Student Wi-Fi SSID:', wifi_ssid);
      
      if (s.room_wifi) {
        if (!wifi_ssid) {
          return res.status(403).json({ error: 'Wi-Fi connection required for this room. Please connect to the correct Wi-Fi network.' });
        }
        if (s.room_wifi !== wifi_ssid) {
          return res.status(403).json({ error: `Wi-Fi mismatch. Expected: ${s.room_wifi}, Got: ${wifi_ssid}` });
        }
      }

      // Bluetooth beacon validation (optional - only validate if both room and student have beacons)
      // Skip validation if student sends 'not_available' or null/undefined
      if (
        s.room_beacon &&
        bluetooth_beacon_id &&
        bluetooth_beacon_id !== 'not_available' &&
        s.room_beacon !== bluetooth_beacon_id
      ) {
        return res.status(403).json({ error: 'Beacon mismatch' });
      }

      // If room has a beacon but student doesn't provide one, that's OK (beacons are optional)
      // If student provides a beacon but room doesn't have one, that's OK (beacons are optional)
      // Only fail if both have beacons and they don't match

      // Face verification is required - the mobile app should have already done this
      // but we add a server-side check to ensure biometric enrollment exists
      if (!biometricCheck.rows[0].rekognition_face_id) {
        return res.status(403).json({ error: 'Face verification required. Please complete biometric enrollment first.' });
      }

      // Enforce one device per session and idempotency per student
      const rec = await db
        .query(
          `INSERT INTO attendance_records (session_id, student_id, device_id, status)
       VALUES ($1, $2, $3, 'present')
       ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status
       RETURNING record_id, session_id, student_id, device_id, status, marked_at`,
          [session_id, req.user.id, device_id]
        )
        .catch(async (err) => {
          // Unique (session_id, device_id) violation => device already used in this session
          if (err.code === '23505') {
            return { rows: [], conflictDevice: true };
          }
          throw err;
        });
      if (rec.conflictDevice) {
        return res
          .status(409)
          .json({
            error:
              'This device has already marked attendance for this session.',
          });
      }
      const created = rec.rows[0];

      // Create attendance confirmation notification
      try {
        const classResult = await db.query(
          'SELECT name FROM classes WHERE class_id = $1',
          [class_id]
        );
        const class_name = classResult.rows[0]?.name || 'Unknown Class';

        await NotificationService.createAttendanceConfirmationNotification(
          req.user.id,
          session_id,
          class_id,
          class_name
        );
      } catch (notificationError) {
        console.error(
          'Error creating attendance confirmation notification:',
          notificationError
        );
        // Don't fail the attendance marking if notification fails
      }

      res.status(201).json(created);
    } catch (err) {
      console.error('Mobile attendance mark error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// GET /api/mobile/me/notifications
router.get(
  '/me/notifications',
  authMiddleware,
  validate(schemas.notification.getNotifications, 'query'),
  async (req, res) => {
    if (req.user.role !== 'student')
      return res.status(403).json({ error: 'Forbidden' });

    const { page = 1, limit = 20, unread_only = false } = req.query;
    const offset = (page - 1) * limit;

    try {
      let whereClause = 'WHERE n.user_id = $1';
      const params = [req.user.id];

      if (unread_only === 'true') {
        whereClause += ' AND n.is_read = false';
      }

      const q = await db.query(
        `SELECT n.notification_id, n.type, n.title, n.message, n.is_read, 
              n.related_session_id, n.related_class_id, n.created_at, n.read_at,
              c.name AS class_name,
              s.start_time AS session_start_time
         FROM notifications n
    LEFT JOIN classes c ON c.class_id = n.related_class_id
    LEFT JOIN sessions s ON s.session_id = n.related_session_id
        ${whereClause}
        ORDER BY n.created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      );

      // Get total count for pagination
      const countQuery = await db.query(
        `SELECT COUNT(*) as total FROM notifications n ${whereClause}`,
        params
      );

      const total = parseInt(countQuery.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      res.json({
        notifications: q.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      });
    } catch (err) {
      console.error('Mobile notifications error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// GET /api/mobile/me/notifications/unread-count
router.get(
  '/me/notifications/unread-count',
  authMiddleware,
  async (req, res) => {
    if (req.user.role !== 'student')
      return res.status(403).json({ error: 'Forbidden' });

    try {
      const q = await db.query(
        'SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = $1 AND is_read = false',
        [req.user.id]
      );

      res.json({ unread_count: parseInt(q.rows[0].unread_count) });
    } catch (err) {
      console.error('Mobile notifications unread count error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// PUT /api/mobile/notifications/:id/read
router.put(
  '/notifications/:id/read',
  authMiddleware,
  validate(schemas.notification.markRead, 'params'),
  async (req, res) => {
    if (req.user.role !== 'student')
      return res.status(403).json({ error: 'Forbidden' });

    const { id } = req.params;

    try {
      const q = await db.query(
        `UPDATE notifications 
       SET is_read = true, read_at = CURRENT_TIMESTAMP 
       WHERE notification_id = $1 AND user_id = $2 
       RETURNING notification_id, is_read, read_at`,
        [id, req.user.id]
      );

      if (!q.rows.length) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      res.json({
        notification_id: q.rows[0].notification_id,
        is_read: q.rows[0].is_read,
        read_at: q.rows[0].read_at,
      });
    } catch (err) {
      console.error('Mobile notification mark read error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// PUT /api/mobile/notifications/mark-all-read
router.put('/notifications/mark-all-read', authMiddleware, async (req, res) => {
  if (req.user.role !== 'student')
    return res.status(403).json({ error: 'Forbidden' });

  try {
    const q = await db.query(
      `UPDATE notifications 
       SET is_read = true, read_at = CURRENT_TIMESTAMP 
       WHERE user_id = $1 AND is_read = false 
       RETURNING COUNT(*) as updated_count`,
      [req.user.id]
    );

    const updatedCount = parseInt(q.rows[0].updated_count);

    res.json({
      message: `Marked ${updatedCount} notifications as read`,
      updated_count: updatedCount,
    });
  } catch (err) {
    console.error('Mobile notifications mark all read error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

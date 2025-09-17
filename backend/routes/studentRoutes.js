const express = require('express');
const router = express.Router();
const db = require('../db'); // Database connection
const authMiddleware = require('../middleware/auth'); // Authentication middleware
const ROLES = require('../utils/roles'); // Roles
const { validate, schemas } = require('../utils/validation'); // Input validation

// --- Get Enrolled Classes for the Authenticated Student ---
// GET /api/students/classes
router.get('/classes', authMiddleware, async (req, res) => {
  // Ensure the user is a student
  if (req.user.role !== ROLES.STUDENT) {
    return res.status(403).json({ error: 'Forbidden: This route is for students only.' });
  }

  const studentId = req.user.id;

  try {
    const query = `
      SELECT c.class_id, c.class_name, c.class_code, c.teacher_id, u.first_name AS teacher_first_name, u.last_name AS teacher_last_name
      FROM classes c
      JOIN student_enrollments se ON c.class_id = se.class_id
      LEFT JOIN users u ON c.teacher_id = u.user_id
      WHERE se.student_id = $1
      ORDER BY c.class_name;
    `;
    const { rows } = await db.query(query, [studentId]);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching enrolled classes for student:', err);
    res.status(500).json({ error: 'Server error fetching enrolled classes.' });
  }
});

// --- Mark Attendance for a Session ---
// POST /api/students/attendance/mark
router.post('/attendance/mark', authMiddleware, validate(schemas.attendance.mark), async (req, res) => {
  // Ensure the user is a student
  if (req.user.role !== ROLES.STUDENT) {
    return res.status(403).json({ error: 'Forbidden: This route is for students only.' });
  }

  const studentId = req.user.id;
  const { class_id, session_id, wifi_ssid, bluetooth_beacon_id } = req.body;

  try {
    // 1. Verify student is enrolled in the class.
    const enrollmentCheckQuery = 'SELECT 1 FROM student_enrollments WHERE student_id = $1 AND class_id = $2';
    const enrollmentResult = await db.query(enrollmentCheckQuery, [studentId, class_id]);

    if (enrollmentResult.rows.length === 0) {
      return res.status(403).json({ error: 'Forbidden: You are not enrolled in this class.' });
    }

    // 2. Verify session exists and is currently active (within time window).
    const sessionQuery = 'SELECT room_id, start_time, end_time FROM sessions WHERE session_id = $1 AND class_id = $2';
    const sessionResult = await db.query(sessionQuery, [session_id, class_id]);

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found for the given class or session ID is invalid.' });
    }

    const session = sessionResult.rows[0];
    const now = new Date();
    const startTime = new Date(session.start_time);
    const endTime = new Date(session.end_time);

    if (now < startTime) {
      return res.status(400).json({ error: 'Attendance marking not yet open for this session.' });
    }
    if (now > endTime) {
      return res.status(400).json({ error: 'Attendance marking period has ended for this session.' });
    }

    // Store room_id for the next step
    const roomId = session.room_id;

    // 3. Fetch room details for the session.
    const roomQuery = 'SELECT wifi_ssid, bluetooth_beacon_id FROM rooms WHERE room_id = $1';
    const roomResult = await db.query(roomQuery, [roomId]);

    if (roomResult.rows.length === 0) {
      // This case should ideally not happen if roomId from session is valid
      return res.status(500).json({ error: 'Internal server error: Room details not found for session.' });
    }
    const room = roomResult.rows[0];

    // 4. Compare submitted Wi-Fi SSID and Bluetooth Beacon ID.
    // Strict check: submitted Wi-Fi must match room's Wi-Fi.
    if (room.wifi_ssid !== wifi_ssid) {
      return res.status(400).json({ error: 'Location mismatch: Wi-Fi SSID does not match session room.' });
    }

    // Strict check for Bluetooth: if student provides a beacon ID, it must match the room's. 
    // If room has a beacon ID and student doesn't provide one, it's a mismatch (implicit by current logic).
    // If room does NOT have a beacon_id, but student provides one, it's also a mismatch.
    // This also implies if bluetooth_beacon_id is null in DB and not provided by student, it passes this specific check.
    if (room.bluetooth_beacon_id !== bluetooth_beacon_id) { 
        // This comparison handles cases: 
        // room.beacon_id (e.g., 'B1') !== student_beacon_id (e.g., 'B2') -> FAIL
        // room.beacon_id (e.g., 'B1') !== student_beacon_id (undefined) -> FAIL (room.bluetooth_beacon_id will not be === undefined)
        // room.beacon_id (null) !== student_beacon_id (e.g., 'B1') -> FAIL 
        // Only passes if room.beacon_id === student_beacon_id (e.g. 'B1' === 'B1' OR null === undefined (which is false, so null === null is needed if we want to allow optional on both sides))
        // Let's refine this to be more explicit about optionality later if needed.
        // For now, if bluetooth_beacon_id is provided by student, it MUST match. If room has one, student MUST provide matching.
        // If room.bluetooth_beacon_id is set, and student doesn't provide bluetooth_beacon_id, it's a fail.
        // If student provides bluetooth_beacon_id, and room.bluetooth_beacon_id is null, it's a fail.
        // Basically, they must match if both are present. If one is present and other is not, fail. If both are null/undefined, pass.

        // More robust check:
        const roomBeacon = room.bluetooth_beacon_id;
        const studentBeacon = bluetooth_beacon_id;

        // If room expects a beacon and student provides a different one or none.
        if (roomBeacon && roomBeacon !== studentBeacon) {
             return res.status(400).json({ error: 'Location mismatch: Bluetooth Beacon ID does not match session room.' });
        }
        // If student provides a beacon but room doesn't expect one (or expects a different one).
        if (studentBeacon && roomBeacon !== studentBeacon) { // This condition is partially redundant with above but covers studentBeacon && !roomBeacon
            return res.status(400).json({ error: 'Location mismatch: Bluetooth Beacon ID provided but not expected or does not match.' });
        }
        // This logic ensures if one is set, the other must be set and match.
        // If both are null/undefined, this check is passed.
    }

    // 5. Prevent duplicate attendance for the same student in the same session.
    const duplicateCheckQuery = 'SELECT 1 FROM attendance_records WHERE student_id = $1 AND session_id = $2';
    const duplicateResult = await db.query(duplicateCheckQuery, [studentId, session_id]);

    if (duplicateResult.rows.length > 0) {
      return res.status(409).json({ error: 'Conflict: Attendance already recorded for this session.' }); // 409 Conflict
    }

    // 6. Record attendance if all checks pass.
    const attendanceStatus = 'present'; // Assuming 'present' as the default status upon successful marking
    const recordedAt = new Date(); // Current timestamp

    const insertAttendanceQuery = `
      INSERT INTO attendance_records (student_id, session_id, status, recorded_at, verified_wifi_ssid, verified_bluetooth_beacon_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING attendance_record_id, student_id, session_id, status, recorded_at, verified_wifi_ssid, verified_bluetooth_beacon_id;
    `;
    
    const insertResult = await db.query(insertAttendanceQuery, [
      studentId,
      session_id,
      attendanceStatus,
      recordedAt,
      wifi_ssid, // The student-submitted and verified Wi-Fi SSID
      bluetooth_beacon_id // The student-submitted and verified Bluetooth Beacon ID (could be null)
    ]);

    res.status(201).json({
      message: 'Attendance marked successfully.',
      attendanceRecord: insertResult.rows[0]
    });

  } catch (err) {
    console.error('Error marking attendance:', err);
    res.status(500).json({ error: 'Server error marking attendance.' });
  }
});

module.exports = router; 
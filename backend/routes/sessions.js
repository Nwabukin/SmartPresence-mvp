const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const ROLES = require('../utils/roles');

// Helper function to check if user can manage a session (teacher owns the class)
async function canManageSession(userId, userRole, classId) {
  if (userRole !== ROLES.TEACHER) {
    return false; // Only teachers can manage sessions
  }
  // Check if the teacher owns the class
  const classResult = await db.query('SELECT teacher_id FROM classes WHERE class_id = $1', [classId]);
  if (classResult.rows.length === 0) {
    return false; // Class not found
  }
  return classResult.rows[0].teacher_id === userId;
}

// --- Create a new Session (Teacher Only) ---
// POST /api/sessions
router.post('/', authMiddleware, async (req, res) => {
  const { class_id, room_id, start_time, end_time } = req.body;
  const requestingUserId = req.user.id;
  const requestingUserRole = req.user.role;

  if (!class_id || !room_id || !start_time || !end_time) {
    return res.status(400).json({ error: 'Missing required fields (class_id, room_id, start_time, end_time).' });
  }

  const classIdInt = parseInt(class_id, 10);
  const roomIdInt = parseInt(room_id, 10);

  if (isNaN(classIdInt) || isNaN(roomIdInt)) {
    return res.status(400).json({ error: 'Invalid class_id or room_id format.'});
  }

  // Validate start_time and end_time format and logic (end_time > start_time)
  const startTimeDate = new Date(start_time);
  const endTimeDate = new Date(end_time);
  if (isNaN(startTimeDate.getTime()) || isNaN(endTimeDate.getTime())) {
    return res.status(400).json({ error: 'Invalid date format for start_time or end_time.' });
  }
  if (endTimeDate <= startTimeDate) {
    return res.status(400).json({ error: 'End time must be after start time.' });
  }

  try {
    const canCreate = await canManageSession(requestingUserId, requestingUserRole, classIdInt);
    if (!canCreate) {
      return res.status(403).json({ error: 'Forbidden: Only teachers can create sessions for their own classes.' });
    }
    
    // Verify room exists
    const roomExists = await db.query('SELECT 1 FROM rooms WHERE room_id = $1', [roomIdInt]);
    if (roomExists.rows.length === 0) {
        return res.status(404).json({ error: 'Room not found.'});
    }

    const result = await db.query(
      'INSERT INTO sessions (class_id, room_id, start_time, end_time) VALUES ($1, $2, $3, $4) RETURNING *',
      [classIdInt, roomIdInt, startTimeDate, endTimeDate]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating session:', err);
    res.status(500).json({ error: 'Server error creating session.' });
  }
});

// --- Get all Sessions (Admin can view all, Teacher for their classes) ---
// GET /api/sessions
router.get('/', authMiddleware, async (req, res) => {
  const requestingUserId = req.user.id;
  const requestingUserRole = req.user.role;
  const { class_id: queryClassId, teacher_id: queryTeacherId } = req.query;

  try {
    let query = 
      `SELECT s.*, c.name as class_name, c.course_code, r.name as room_name 
       FROM sessions s 
       JOIN classes c ON s.class_id = c.class_id 
       JOIN rooms r ON s.room_id = r.room_id`;
    const params = [];
    const conditions = [];

    if (requestingUserRole === ROLES.TEACHER) {
      conditions.push(`c.teacher_id = $${params.length + 1}`);
      params.push(requestingUserId);
    }

    if (queryClassId) {
        const classIdInt = parseInt(queryClassId, 10);
        if (isNaN(classIdInt)) return res.status(400).json({ error: 'Invalid class_id format in query.'});
        conditions.push(`s.class_id = $${params.length + 1}`);
        params.push(classIdInt);
    }
    
    if (queryTeacherId && requestingUserRole === ROLES.ADMIN) { // Teacher can only see their own, admin can filter by teacher
        const teacherIdInt = parseInt(queryTeacherId, 10);
        if (isNaN(teacherIdInt)) return res.status(400).json({ error: 'Invalid teacher_id format in query.'});
        conditions.push(`c.teacher_id = $${params.length + 1}`);
        params.push(teacherIdInt);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY s.start_time DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching sessions:', err);
    res.status(500).json({ error: 'Server error fetching sessions.' });
  }
});

// --- Get a specific Session by ID (Admin can view all, Teacher who owns class) ---
// GET /api/sessions/:sessionId
router.get('/:sessionId', authMiddleware, async (req, res) => {
  const { sessionId } = req.params;
  const sessionIdInt = parseInt(sessionId, 10);
  const requestingUserId = req.user.id;
  const requestingUserRole = req.user.role;

  if (isNaN(sessionIdInt)) {
    return res.status(400).json({ error: 'Invalid session ID format.' });
  }

  try {
    const result = await db.query(
        `SELECT s.*, c.name as class_name, c.course_code, r.name as room_name 
         FROM sessions s 
         JOIN classes c ON s.class_id = c.class_id 
         JOIN rooms r ON s.room_id = r.room_id 
         WHERE s.session_id = $1`,
        [sessionIdInt]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found.' });
    }
    const session = result.rows[0];
    // Admin can view all sessions, teachers can only view their own
    if (requestingUserRole === ROLES.ADMIN) {
      // Admin can view any session
    } else {
      const canView = await canManageSession(requestingUserId, requestingUserRole, session.class_id);
      if (!canView) {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to view this session.' });
      }
    }
    res.json(session);
  } catch (err) {
    console.error(`Error fetching session ${sessionIdInt}:`, err);
    res.status(500).json({ error: 'Server error fetching session.' });
  }
});

// --- Update a Session by ID (Teacher who owns class only) ---
// PUT /api/sessions/:sessionId
router.put('/:sessionId', authMiddleware, async (req, res) => {
  const { sessionId } = req.params;
  const sessionIdInt = parseInt(sessionId, 10);
  const { room_id, start_time, end_time } = req.body;
  const requestingUserId = req.user.id;
  const requestingUserRole = req.user.role;

  if (isNaN(sessionIdInt)) {
    return res.status(400).json({ error: 'Invalid session ID format.' });
  }

  let roomIdInt, startTimeDate, endTimeDate;
  if (room_id !== undefined) {
    roomIdInt = parseInt(room_id, 10);
    if (isNaN(roomIdInt)) return res.status(400).json({ error: 'Invalid room_id format.'});
  }
  if (start_time !== undefined) {
    startTimeDate = new Date(start_time);
    if (isNaN(startTimeDate.getTime())) return res.status(400).json({ error: 'Invalid start_time format.'});
  }
  if (end_time !== undefined) {
    endTimeDate = new Date(end_time);
    if (isNaN(endTimeDate.getTime())) return res.status(400).json({ error: 'Invalid end_time format.'});
  }
  
  // Validate time logic if both are provided or one is provided and the other exists
  // This is a bit complex, so for now, ensure if both provided, end > start
  if (startTimeDate && endTimeDate && endTimeDate <= startTimeDate) {
      return res.status(400).json({ error: 'End time must be after start time.' });
  }

  if (room_id === undefined && start_time === undefined && end_time === undefined) {
    return res.status(400).json({ error: 'No updateable fields provided (room_id, start_time, end_time).' });
  }

  try {
    const sessionResult = await db.query('SELECT class_id, start_time as current_start_time, end_time as current_end_time FROM sessions WHERE session_id = $1', [sessionIdInt]);
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found.' });
    }
    const sessionData = sessionResult.rows[0];

    const canUpdate = await canManageSession(requestingUserId, requestingUserRole, sessionData.class_id);
    if (!canUpdate) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to update this session.' });
    }
    
    // More robust time validation if one is updated
    const finalStartTime = startTimeDate || new Date(sessionData.current_start_time);
    const finalEndTime = endTimeDate || new Date(sessionData.current_end_time);
    if (finalEndTime <= finalStartTime) {
        return res.status(400).json({ error: 'End time must be after start time based on current or provided values.' });
    }
    
    // Verify room exists if room_id is being updated
    if (roomIdInt !== undefined) {
        const roomExists = await db.query('SELECT 1 FROM rooms WHERE room_id = $1', [roomIdInt]);
        if (roomExists.rows.length === 0) {
            return res.status(404).json({ error: 'Room not found for update.'});
        }
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (roomIdInt !== undefined) { updates.push(`room_id = $${paramCount++}`); values.push(roomIdInt); }
    if (startTimeDate !== undefined) { updates.push(`start_time = $${paramCount++}`); values.push(startTimeDate); }
    if (endTimeDate !== undefined) { updates.push(`end_time = $${paramCount++}`); values.push(endTimeDate); }
    updates.push(`updated_at = current_timestamp`);

    if (updates.length === 1) { // only updated_at
        return res.status(400).json({ error: 'No valid fields to update.'});
    }

    values.push(sessionIdInt);
    const queryText = `UPDATE sessions SET ${updates.join(', ')} WHERE session_id = $${paramCount} RETURNING *`;
    
    const result = await db.query(queryText, values);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(`Error updating session ${sessionIdInt}:`, err);
    res.status(500).json({ error: 'Server error updating session.' });
  }
});

// --- Delete a Session by ID (Teacher who owns class only) ---
// DELETE /api/sessions/:sessionId
router.delete('/:sessionId', authMiddleware, async (req, res) => {
  const { sessionId } = req.params;
  const sessionIdInt = parseInt(sessionId, 10);
  const requestingUserId = req.user.id;
  const requestingUserRole = req.user.role;

  if (isNaN(sessionIdInt)) {
    return res.status(400).json({ error: 'Invalid session ID format.' });
  }

  try {
    const sessionResult = await db.query('SELECT class_id FROM sessions WHERE session_id = $1', [sessionIdInt]);
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found.' });
    }
    const classIdForSession = sessionResult.rows[0].class_id;

    const canDelete = await canManageSession(requestingUserId, requestingUserRole, classIdForSession);
    if (!canDelete) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to delete this session.' });
    }

    const result = await db.query('DELETE FROM sessions WHERE session_id = $1 RETURNING *', [sessionIdInt]);
    // Cascade delete for attendance_records is handled by DB constraints
    res.status(200).json({ message: `Session ID ${sessionIdInt} (Class ID: ${result.rows[0].class_id}) and associated attendance records deleted.`, details: result.rows[0] });
  } catch (err) {
    console.error(`Error deleting session ${sessionIdInt}:`, err);
    res.status(500).json({ error: 'Server error deleting session.' });
  }
});

// --- Get Attendance Records for a Session (Admin can view all, Teacher who owns class) ---
// GET /api/sessions/:sessionId/attendance
router.get('/:sessionId/attendance', authMiddleware, async (req, res) => {
  const { sessionId } = req.params;
  const sessionIdInt = parseInt(sessionId, 10);
  const requestingUserId = req.user.id;
  const requestingUserRole = req.user.role;

  if (isNaN(sessionIdInt)) {
    return res.status(400).json({ error: 'Invalid session ID format.' });
  }

  try {
    // 1. Fetch session to get class_id for authorization
    const sessionResult = await db.query('SELECT class_id FROM sessions WHERE session_id = $1', [sessionIdInt]);
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found.' });
    }
    const classIdForSession = sessionResult.rows[0].class_id;

    // 2. Authorize - Admin can view all attendance, teachers can only view their own
    if (requestingUserRole === ROLES.ADMIN) {
      // Admin can view any attendance
    } else {
      const canViewAttendance = await canManageSession(requestingUserId, requestingUserRole, classIdForSession);
      if (!canViewAttendance) {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to view attendance for this session.' });
      }
    }

    // 3. Fetch attendance records with student details
    const attendanceRecords = await db.query(
      `SELECT 
         ar.record_id, 
         ar.session_id, 
         ar.student_id, 
         u.first_name AS student_first_name, 
         u.last_name AS student_last_name, 
         u.email AS student_email,
         ar.marked_at, 
         ar.status, 
         ar.modified_by_teacher_id,
         modifier.first_name AS modifier_first_name, -- Get modifier's name
         modifier.last_name AS modifier_last_name     -- Get modifier's name
       FROM attendance_records ar
       JOIN users u ON ar.student_id = u.user_id
       LEFT JOIN users modifier ON ar.modified_by_teacher_id = modifier.user_id -- Left join for optional modifier
       WHERE ar.session_id = $1
       ORDER BY u.last_name, u.first_name`,
      [sessionIdInt]
    );

    res.json(attendanceRecords.rows);
  } catch (err) {
    console.error(`Error fetching attendance for session ${sessionIdInt}:`, err);
    res.status(500).json({ error: 'Server error fetching attendance records.' });
  }
});

module.exports = router;
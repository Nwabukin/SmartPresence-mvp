const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const ROLES = require('../utils/roles');
const { validate, schemas } = require('../utils/validation'); // Input validation
const { sendSuccess, handleDbError } = require('../utils/http');

const VALID_ATTENDANCE_STATUSES = ['present', 'absent', 'late', 'excused'];

// --- Manually Update an Attendance Record (Teacher who owns class only) ---
// PUT /api/attendance/:recordId
router.put(
  '/:recordId',
  authMiddleware,
  validate(schemas.attendance.getByRecordId, 'params'),
  validate(schemas.attendance.update),
  async (req, res) => {
    const { recordId } = req.params;
    const recordIdInt = parseInt(recordId, 10);
    const { status } = req.body;
    const requestingUserId = req.user.id;
    const requestingUserRole = req.user.role;

    try {
      // 1. Fetch the attendance record to get session_id
      const attRecordResult = await db.query(
        'SELECT session_id FROM attendance_records WHERE record_id = $1',
        [recordIdInt]
      );
      if (attRecordResult.rows.length === 0) {
        return res.status(404).json({ error: 'Attendance record not found.' });
      }
      const { session_id } = attRecordResult.rows[0];

      // 2. Fetch the session to get class_id for authorization
      const sessionResult = await db.query(
        'SELECT class_id FROM sessions WHERE session_id = $1',
        [session_id]
      );
      if (sessionResult.rows.length === 0) {
        // Should not happen if DB integrity is maintained, but good to check
        return res.status(404).json({ error: 'Associated session not found.' });
      }
      const { class_id } = sessionResult.rows[0];

      // 3. Authorization check (Only Teacher who owns the class)
      if (requestingUserRole !== ROLES.TEACHER) {
        return res
          .status(403)
          .json({
            error: 'Forbidden: Only teachers can modify attendance records.',
          });
      }

      const classOwnerResult = await db.query(
        'SELECT teacher_id FROM classes WHERE class_id = $1',
        [class_id]
      );
      if (classOwnerResult.rows.length === 0) {
        return res.status(404).json({ error: 'Associated class not found.' });
      }

      if (classOwnerResult.rows[0].teacher_id !== requestingUserId) {
        return res
          .status(403)
          .json({
            error:
              'Forbidden: You can only modify attendance for your own classes.',
          });
      }

      // 4. Update the attendance record
      const updateResult = await db.query(
        'UPDATE attendance_records SET status = $1, modified_by_teacher_id = $2 WHERE record_id = $3 RETURNING *',
        [status, requestingUserId, recordIdInt]
      );

      return sendSuccess(res, 200, 'Attendance record updated successfully', updateResult.rows[0]);
    } catch (err) {
      return handleDbError(err, res);
    }
  }
);

module.exports = router;

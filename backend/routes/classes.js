const express = require('express');
const router = express.Router();
const db = require('../db'); // Database connection
const authMiddleware = require('../middleware/auth'); // Authentication middleware
const ROLES = require('../utils/roles'); // Roles
const { validate, schemas } = require('../utils/validation'); // Input validation
const NotificationService = require('../services/notificationService');

// Placeholder for Class model structure (fields we expect for a class)
// Example: { class_name: "Introduction to Programming", course_code: "CS101", teacher_id: 1 }

// --- Create a new Class (Teacher Only) ---
// POST /api/classes
router.post(
  '/',
  authMiddleware,
  validate(schemas.class.create),
  async (req, res) => {
    if (req.user.role !== ROLES.TEACHER) {
      return res
        .status(403)
        .json({ error: 'Forbidden: Only teachers can create classes.' });
    }

    const { name, course_code, description } = req.body;
    const teacher_id = req.user.id; // The logged-in teacher becomes the teacher_id

    try {
      const result = await db.query(
        'INSERT INTO classes (name, course_code, description, teacher_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, course_code, description, teacher_id]
      );
      const newClass = result.rows[0];
      res.status(201).json(newClass);
    } catch (err) {
      console.error('Error creating class:', err);
      // Check for unique constraint violation for course_code if you add one later
      res.status(500).json({ error: 'Server error creating class.' });
    }
  }
);

// --- Get all Classes (Teacher/Admin) ---
// GET /api/classes
router.get('/', authMiddleware, async (req, res) => {
  if (![ROLES.ADMIN, ROLES.TEACHER].includes(req.user.role)) {
    return res
      .status(403)
      .json({ error: 'Forbidden: Insufficient privileges to view classes.' });
  }

  try {
    let query;
    let params = [];
    if (req.user.role === ROLES.ADMIN) {
      query = 'SELECT * FROM classes ORDER BY created_at DESC';
    } else {
      query =
        'SELECT * FROM classes WHERE teacher_id = $1 ORDER BY created_at DESC';
      params = [req.user.id];
    }
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching classes:', err);
    res.status(500).json({ error: 'Server error fetching classes.' });
  }
});

// --- Get a specific Class by ID (Teacher/Admin) ---
// GET /api/classes/:id
router.get(
  '/:id',
  authMiddleware,
  validate(schemas.class.getById, 'params'),
  async (req, res) => {
    if (![ROLES.ADMIN, ROLES.TEACHER].includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: 'Forbidden: Insufficient privileges.' });
    }
    const { id } = req.params;
    const classId = parseInt(id, 10);

    if (isNaN(classId)) {
      return res.status(400).json({ error: 'Invalid class ID format.' });
    }

    try {
      const result = await db.query(
        'SELECT * FROM classes WHERE class_id = $1',
        [classId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Class not found.' });
      }
      // Optional: Add check if teacher is allowed to view this specific class if not admin
      // if (req.user.role === ROLES.TEACHER && result.rows[0].teacher_id !== req.user.id) {
      //   return res.status(403).json({ error: 'Forbidden: You do not own this class.' });
      // }
      res.json(result.rows[0]);
    } catch (err) {
      console.error(`Error fetching class ${classId}:`, err);
      res.status(500).json({ error: 'Server error fetching class.' });
    }
  }
);

// --- Update a Class by ID (Owner Teacher Only) ---
// PUT /api/classes/:id
router.put(
  '/:id',
  authMiddleware,
  validate(schemas.class.getById, 'params'),
  validate(schemas.class.update),
  async (req, res) => {
    const { id } = req.params;
    const classId = parseInt(id, 10);
    const { name, course_code, description } = req.body;
    const requestingUserId = req.user.id;
    const requestingUserRole = req.user.role;

    if (isNaN(classId)) {
      return res.status(400).json({ error: 'Invalid class ID format.' });
    }

    if (!name && !course_code && description === undefined) {
      return res
        .status(400)
        .json({
          error:
            'No updateable fields provided (name, course_code, description).',
        });
    }

    try {
      // First, fetch the class to check ownership if the user is a teacher
      const classResult = await db.query(
        'SELECT teacher_id FROM classes WHERE class_id = $1',
        [classId]
      );
      if (classResult.rows.length === 0) {
        return res.status(404).json({ error: 'Class not found.' });
      }

      const classOwnerId = classResult.rows[0].teacher_id;

      // Authorization: Only the teacher who owns the class
      if (requestingUserRole !== ROLES.TEACHER) {
        return res
          .status(403)
          .json({ error: 'Forbidden: Only teachers can update classes.' });
      }

      if (classOwnerId !== requestingUserId) {
        return res
          .status(403)
          .json({ error: 'Forbidden: You can only update your own classes.' });
      }

      // Build the update query dynamically
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramCount++}`);
        values.push(name);
      }
      if (course_code !== undefined) {
        updates.push(`course_code = $${paramCount++}`);
        values.push(course_code);
      }
      if (description !== undefined) {
        updates.push(`description = $${paramCount++}`);
        values.push(description);
      }
      updates.push(`updated_at = current_timestamp`);

      if (updates.length === 1) {
        // only updated_at was added
        return res
          .status(400)
          .json({ error: 'No valid fields provided for update.' });
      }

      values.push(classId); // For the WHERE clause

      const queryText = `UPDATE classes SET ${updates.join(', ')} WHERE class_id = $${paramCount} RETURNING *`;

      const result = await db.query(queryText, values);

      if (result.rows.length === 0) {
        // Should not happen if previous check passed, but as a safeguard
        return res
          .status(404)
          .json({ error: 'Class not found or update failed.' });
      }
      res.json(result.rows[0]);
    } catch (err) {
      console.error(`Error updating class ${classId}:`, err);
      res.status(500).json({ error: 'Server error updating class.' });
    }
  }
);

// --- Delete a Class by ID (Owner Teacher Only) ---
// DELETE /api/classes/:id
router.delete(
  '/:id',
  authMiddleware,
  validate(schemas.class.getById, 'params'),
  async (req, res) => {
    const { id } = req.params;
    const classId = parseInt(id, 10);
    const requestingUserId = req.user.id;
    const requestingUserRole = req.user.role;

    if (isNaN(classId)) {
      return res.status(400).json({ error: 'Invalid class ID format.' });
    }

    try {
      // First, fetch the class to check ownership if the user is a teacher
      const classResult = await db.query(
        'SELECT teacher_id FROM classes WHERE class_id = $1',
        [classId]
      );
      if (classResult.rows.length === 0) {
        return res.status(404).json({ error: 'Class not found.' });
      }

      const classOwnerId = classResult.rows[0].teacher_id;

      // Authorization: Only the teacher who owns the class
      if (requestingUserRole !== ROLES.TEACHER) {
        return res
          .status(403)
          .json({ error: 'Forbidden: Only teachers can delete classes.' });
      }

      if (classOwnerId !== requestingUserId) {
        return res
          .status(403)
          .json({ error: 'Forbidden: You can only delete your own classes.' });
      }

      const result = await db.query(
        'DELETE FROM classes WHERE class_id = $1 RETURNING *',
        [classId]
      );

      if (result.rowCount === 0) {
        // Should not happen if previous check passed, but as a safeguard
        return res
          .status(404)
          .json({ error: 'Class not found, could not delete.' });
      }
      // Cascade delete for enrollments and sessions is handled by DB constraints
      res
        .status(200)
        .json({
          message: `Class '${result.rows[0].name}' (ID: ${classId}) and all associated enrollments/sessions deleted successfully.`,
        });
    } catch (err) {
      console.error(`Error deleting class ${classId}:`, err);
      // Handle potential foreign key issues if cascade wasn't set up, though it is in this schema
      res.status(500).json({ error: 'Server error deleting class.' });
    }
  }
);

// --- Enroll a Student in a Class (Owner Teacher Only) ---
// POST /api/classes/:classId/students
router.post('/:classId/students', authMiddleware, async (req, res) => {
  const { classId } = req.params;
  const classIdInt = parseInt(classId, 10);
  const { student_id } = req.body;
  const studentIdInt = parseInt(student_id, 10);
  const requestingUserId = req.user.id;
  const requestingUserRole = req.user.role;

  if (isNaN(classIdInt) || isNaN(studentIdInt)) {
    return res
      .status(400)
      .json({ error: 'Invalid class ID or student ID format.' });
  }

  try {
    // 1. Verify class exists and check ownership
    const classResult = await db.query(
      'SELECT teacher_id FROM classes WHERE class_id = $1',
      [classIdInt]
    );
    if (classResult.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found.' });
    }
    const classOwnerId = classResult.rows[0].teacher_id;

    if (requestingUserRole !== ROLES.TEACHER) {
      return res
        .status(403)
        .json({
          error: 'Forbidden: Only teachers can enroll students in classes.',
        });
    }

    if (classOwnerId !== requestingUserId) {
      return res
        .status(403)
        .json({
          error: 'Forbidden: You can only enroll students in your own classes.',
        });
    }

    // 2. Verify student exists and is a student
    const studentResult = await db.query(
      'SELECT role FROM users WHERE user_id = $1',
      [studentIdInt]
    );
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found.' });
    }
    if (studentResult.rows[0].role !== ROLES.STUDENT) {
      return res
        .status(400)
        .json({ error: 'Invalid action: User is not a student.' });
    }

    // 3. Perform enrollment
    const enrollmentResult = await db.query(
      'INSERT INTO enrollments (class_id, student_id) VALUES ($1, $2) RETURNING *',
      [classIdInt, studentIdInt]
    );

    // Create class enrollment notification for the student
    try {
      const classResult = await db.query(
        'SELECT name FROM classes WHERE class_id = $1',
        [classIdInt]
      );
      const class_name = classResult.rows[0]?.name || 'Unknown Class';

      await NotificationService.createClassEnrollmentNotification(
        studentIdInt,
        classIdInt,
        class_name
      );
    } catch (notificationError) {
      console.error(
        'Error creating class enrollment notification:',
        notificationError
      );
      // Don't fail the enrollment if notification fails
    }

    res.status(201).json(enrollmentResult.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      // Unique violation (student already enrolled)
      return res
        .status(409)
        .json({
          error: 'Conflict: Student is already enrolled in this class.',
        });
    }
    console.error(
      `Error enrolling student ${studentIdInt} in class ${classIdInt}:`,
      err
    );
    res.status(500).json({ error: 'Server error enrolling student.' });
  }
});

// --- Unenroll a Student from a Class (Owner Teacher Only) ---
// DELETE /api/classes/:classId/students/:studentId
router.delete(
  '/:classId/students/:studentId',
  authMiddleware,
  async (req, res) => {
    const { classId, studentId } = req.params;
    const classIdInt = parseInt(classId, 10);
    const studentIdInt = parseInt(studentId, 10);
    const requestingUserId = req.user.id;
    const requestingUserRole = req.user.role;

    if (isNaN(classIdInt) || isNaN(studentIdInt)) {
      return res
        .status(400)
        .json({ error: 'Invalid class ID or student ID format.' });
    }

    try {
      // 1. Verify class exists and check ownership
      const classResult = await db.query(
        'SELECT teacher_id FROM classes WHERE class_id = $1',
        [classIdInt]
      );
      if (classResult.rows.length === 0) {
        return res.status(404).json({ error: 'Class not found.' });
      }
      const classOwnerId = classResult.rows[0].teacher_id;

      if (requestingUserRole !== ROLES.TEACHER) {
        return res
          .status(403)
          .json({
            error:
              'Forbidden: Only teachers can unenroll students from classes.',
          });
      }

      if (classOwnerId !== requestingUserId) {
        return res
          .status(403)
          .json({
            error:
              'Forbidden: You can only unenroll students from your own classes.',
          });
      }

      // 2. Perform unenrollment
      const unenrollmentResult = await db.query(
        'DELETE FROM enrollments WHERE class_id = $1 AND student_id = $2 RETURNING *',
        [classIdInt, studentIdInt]
      );

      if (unenrollmentResult.rowCount === 0) {
        return res
          .status(404)
          .json({
            error:
              'Enrollment record not found. Student may not be enrolled in this class.',
          });
      }
      res
        .status(200)
        .json({
          message: 'Student unenrolled successfully.',
          details: unenrollmentResult.rows[0],
        });
    } catch (err) {
      console.error(
        `Error unenrolling student ${studentIdInt} from class ${classIdInt}:`,
        err
      );
      res.status(500).json({ error: 'Server error unenrolling student.' });
    }
  }
);

// --- List Students Enrolled in a Class (Admin can view all, Owner Teacher) ---
// GET /api/classes/:classId/students
router.get('/:classId/students', authMiddleware, async (req, res) => {
  const { classId } = req.params;
  const classIdInt = parseInt(classId, 10);
  const requestingUserId = req.user.id;
  const requestingUserRole = req.user.role;

  if (isNaN(classIdInt)) {
    return res.status(400).json({ error: 'Invalid class ID format.' });
  }

  try {
    // 1. Verify class exists and check ownership for viewing enrollments
    const classResult = await db.query(
      'SELECT teacher_id FROM classes WHERE class_id = $1',
      [classIdInt]
    );
    if (classResult.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found.' });
    }
    const classOwnerId = classResult.rows[0].teacher_id;

    // Admin can view all enrollments, teachers can only view their own
    if (requestingUserRole === ROLES.ADMIN) {
      // Admin can view any class enrollments
    } else if (
      requestingUserRole === ROLES.TEACHER &&
      classOwnerId === requestingUserId
    ) {
      // Teacher can view their own class enrollments
    } else {
      return res
        .status(403)
        .json({
          error:
            'Forbidden: You do not have permission to view enrollments for this class.',
        });
    }

    // 2. Fetch enrolled students' details
    // Joining enrollments with users table and student_profiles to get complete student information
    const enrolledStudentsResult = await db.query(
      `SELECT u.user_id, u.email, u.first_name, u.last_name, e.enrollment_date,
              sp.matric_no, sp.department, sp.course, sp.level, sp.phone
       FROM enrollments e
       JOIN users u ON e.student_id = u.user_id
       LEFT JOIN student_profiles sp ON sp.user_id = u.user_id
       WHERE e.class_id = $1
       ORDER BY u.last_name, u.first_name`,
      [classIdInt]
    );

    res.json(enrolledStudentsResult.rows);
  } catch (err) {
    console.error(`Error fetching students for class ${classIdInt}:`, err);
    res.status(500).json({ error: 'Server error fetching enrolled students.' });
  }
});

module.exports = router;

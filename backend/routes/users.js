const express = require('express');
const router = express.Router();
const db = require('../db'); // Database connection
const authMiddleware = require('../middleware/auth'); // Authentication middleware
const ROLES = require('../utils/roles'); // Assuming roles are defined centrally
const bcrypt = require('bcryptjs'); // Need bcrypt for hashing password
const { validate, schemas } = require('../utils/validation'); // Input validation
const {
  asyncHandler,
  successResponse,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
} = require('../utils/errorHandler');

// --- Get All Users (Admin/Teacher Only) ---
// GET /api/users/
router.get(
  '/',
  authMiddleware,
  asyncHandler(async (req, res) => {
    // Check user role from the token (added by authMiddleware)
    if (![ROLES.ADMIN, ROLES.TEACHER].includes(req.user.role)) {
      throw new AuthorizationError('Insufficient privileges to view users');
    }

    // Fetch all users and join possible profiles. We'll project a normalized shape with optional profile data.
    let result;
    try {
      result = await db.query(
        `SELECT u.user_id, u.email, u.first_name, u.last_name, u.role, u.created_at,
              sp.matric_no AS student_matric_no, sp.department AS student_department, sp.course AS student_course, sp.level AS student_level, sp.phone AS student_phone,
              tp.lecturer_no AS teacher_lecturer_no, tp.department AS teacher_department, tp.faculty AS teacher_faculty, tp.office AS teacher_office, tp.phone AS teacher_phone
         FROM users u
    LEFT JOIN student_profiles sp ON sp.user_id = u.user_id
    LEFT JOIN teacher_profiles tp ON tp.user_id = u.user_id
        ORDER BY u.created_at DESC`
      );
    } catch (err) {
      // Fallback if faculty column does not exist yet
      if (err.code === '42703') {
        result = await db.query(
          `SELECT u.user_id, u.email, u.first_name, u.last_name, u.role, u.created_at,
            sp.matric_no AS student_matric_no, sp.department AS student_department, sp.course AS student_course, sp.level AS student_level, sp.phone AS student_phone,
                tp.lecturer_no AS teacher_lecturer_no, tp.department AS teacher_department, NULL::varchar AS teacher_faculty, tp.office AS teacher_office, tp.phone AS teacher_phone
       FROM users u
  LEFT JOIN student_profiles sp ON sp.user_id = u.user_id
  LEFT JOIN teacher_profiles tp ON tp.user_id = u.user_id
      ORDER BY u.created_at DESC`
        );
      } else {
        throw err;
      }
    }

    const users = result.rows.map((r) => {
      const base = {
        user_id: r.user_id,
        email: r.email,
        first_name: r.first_name,
        last_name: r.last_name,
        role: r.role,
        created_at: r.created_at,
      };
      if (r.role === ROLES.STUDENT) {
        return {
          ...base,
          profile: {
            matric_no: r.student_matric_no || null,
            department: r.student_department || null,
            course: r.student_course || null,
            level: r.student_level || null,
            phone: r.student_phone || null,
          },
        };
      }
      if (r.role === ROLES.TEACHER) {
        return {
          ...base,
          profile: {
            lecturer_no: r.teacher_lecturer_no || null,
            department: r.teacher_department || null,
            faculty: r.teacher_faculty || null,
            office: r.teacher_office || null,
            phone: r.teacher_phone || null,
          },
        };
      }
      return base;
    });

    // Return raw array to match existing frontend expectations
    res.json(users);
  })
);

// --- Get Specific User by ID ---
// GET /api/users/:id
router.get(
  '/:id',
  authMiddleware,
  validate(schemas.user.getById, 'params'),
  asyncHandler(async (req, res) => {
    const requestedUserId = parseInt(req.params.id, 10);
    const requestingUserId = req.user.id;
    const requestingUserRole = req.user.role;

    // Authorization Check:
    // Allow if admin/teacher OR if the user is requesting their own data
    if (
      !(
        [ROLES.ADMIN, ROLES.TEACHER].includes(requestingUserRole) ||
        requestedUserId === requestingUserId
      )
    ) {
      throw new AuthorizationError(
        'You do not have permission to view this user'
      );
    }

    try {
      // Fetch the specific user with optional role-specific profile
      let result;
      try {
        result = await db.query(
          `SELECT u.user_id, u.email, u.first_name, u.last_name, u.role, u.created_at,
                sp.matric_no AS student_matric_no, sp.department AS student_department, sp.course AS student_course, sp.level AS student_level, sp.phone AS student_phone,
                tp.lecturer_no AS teacher_lecturer_no, tp.department AS teacher_department, tp.faculty AS teacher_faculty, tp.office AS teacher_office, tp.phone AS teacher_phone
           FROM users u
      LEFT JOIN student_profiles sp ON sp.user_id = u.user_id
      LEFT JOIN teacher_profiles tp ON tp.user_id = u.user_id
          WHERE u.user_id = $1`,
          [requestedUserId]
        );
      } catch (err) {
        if (err.code === '42703') {
          result = await db.query(
            `SELECT u.user_id, u.email, u.first_name, u.last_name, u.role, u.created_at,
              sp.matric_no AS student_matric_no, sp.department AS student_department, sp.course AS student_course, sp.level AS student_level, sp.phone AS student_phone,
                  tp.lecturer_no AS teacher_lecturer_no, tp.department AS teacher_department, NULL::varchar AS teacher_faculty, tp.office AS teacher_office, tp.phone AS teacher_phone
         FROM users u
    LEFT JOIN student_profiles sp ON sp.user_id = u.user_id
    LEFT JOIN teacher_profiles tp ON tp.user_id = u.user_id
        WHERE u.user_id = $1`,
            [requestedUserId]
          );
        } else {
          throw err;
        }
      }

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found.' });
      }

      const r = result.rows[0];
      const base = {
        user_id: r.user_id,
        email: r.email,
        first_name: r.first_name,
        last_name: r.last_name,
        role: r.role,
        created_at: r.created_at,
      };
      let withProfile = base;
      if (r.role === ROLES.STUDENT) {
        withProfile = {
          ...base,
          profile: {
            matric_no: r.student_matric_no || null,
            department: r.student_department || null,
            course: r.student_course || null,
            level: r.student_level || null,
            phone: r.student_phone || null,
          },
        };
      } else if (r.role === ROLES.TEACHER) {
        withProfile = {
          ...base,
          profile: {
            lecturer_no: r.teacher_lecturer_no || null,
            department: r.teacher_department || null,
            faculty: r.teacher_faculty || null,
            office: r.teacher_office || null,
            phone: r.teacher_phone || null,
          },
        };
      }

      res.json(withProfile);
    } catch (err) {
      console.error(`Error fetching user ${requestedUserId}:`, err);
      res.status(500).json({ error: 'Server error fetching user.' });
    }
  })
);

// --- Update User by ID ---
// PUT /api/users/:id
router.put(
  '/:id',
  authMiddleware,
  validate(schemas.user.getById, 'params'),
  validate(schemas.user.update),
  async (req, res) => {
    const requestedUserId = parseInt(req.params.id, 10);
    const { firstName, lastName, role, profileStudent, profileTeacher } =
      req.body; // Allow optional profile updates
    const requestingUser = req.user; // Contains requesting user's id and role

    if (isNaN(requestedUserId)) {
      return res.status(400).json({ error: 'Invalid user ID format.' });
    }

    // Check if at least one field is provided for update
    if (
      firstName === undefined &&
      lastName === undefined &&
      role === undefined
    ) {
      return res
        .status(400)
        .json({
          error: 'No updateable fields provided (firstName, lastName, role).',
        });
    }

    const updatableFields = [];
    const queryParams = [];
    let paramIndex = 1;
    let userBeingUpdatedCurrentRole = null;

    // If a role change is attempted by an admin for another user, fetch that user's current role.
    if (
      role !== undefined &&
      requestingUser.role === ROLES.ADMIN &&
      requestedUserId !== requestingUser.id
    ) {
      try {
        const userResult = await db.query(
          'SELECT role FROM users WHERE user_id = $1',
          [requestedUserId]
        );
        if (userResult.rows.length === 0) {
          return res
            .status(404)
            .json({ error: 'User to be updated not found.' });
        }
        userBeingUpdatedCurrentRole = userResult.rows[0].role;
      } catch (err) {
        console.error(
          `Error fetching user ${requestedUserId} for role check:`,
          err
        );
        return res
          .status(500)
          .json({
            error: 'Server error during user data retrieval for update.',
          });
      }
    }

    // Handle firstName update
    if (firstName !== undefined) {
      const canUpdateFirstName =
        requestingUser.role === ROLES.ADMIN ||
        requestingUser.role === ROLES.TEACHER ||
        requestedUserId === requestingUser.id;

      if (canUpdateFirstName) {
        updatableFields.push(`first_name = $${paramIndex++}`);
        queryParams.push(firstName);
      } else if (role === undefined || requestingUser.role !== ROLES.ADMIN) {
        // If firstName is provided, user is not authorized, and it's not an admin simultaneously attempting a role change
        return res
          .status(403)
          .json({
            error:
              'Forbidden: You do not have permission to update firstName for this user.',
          });
      }
    }

    // Handle lastName update
    if (lastName !== undefined) {
      const canUpdateLastName =
        requestingUser.role === ROLES.ADMIN ||
        requestingUser.role === ROLES.TEACHER ||
        requestedUserId === requestingUser.id;

      if (canUpdateLastName) {
        updatableFields.push(`last_name = $${paramIndex++}`);
        queryParams.push(lastName);
      } else if (role === undefined || requestingUser.role !== ROLES.ADMIN) {
        // If lastName is provided, user is not authorized, and it's not an admin simultaneously attempting a role change
        return res
          .status(403)
          .json({
            error:
              'Forbidden: You do not have permission to update lastName for this user.',
          });
      }
    }

    // Handle role update
    if (role !== undefined) {
      if (requestingUser.role !== ROLES.ADMIN) {
        return res
          .status(403)
          .json({
            error: 'Forbidden: Only administrators can change user roles.',
          });
      }
      if (requestedUserId === requestingUser.id) {
        return res
          .status(403)
          .json({
            error:
              'Forbidden: Administrators cannot change their own role via this endpoint.',
          });
      }
      if (userBeingUpdatedCurrentRole === ROLES.ADMIN) {
        return res
          .status(403)
          .json({
            error:
              'Forbidden: Cannot change the role of another administrator via this endpoint.',
          });
      }
      if (![ROLES.TEACHER, ROLES.STUDENT].includes(role)) {
        return res
          .status(400)
          .json({
            error:
              'Invalid target role specified. Can only change to teacher or student.',
          });
      }

      updatableFields.push(`role = $${paramIndex++}`);
      queryParams.push(role);
    }

    if (updatableFields.length === 0) {
      // This means fields were provided, but none resulted in an update (e.g., due to permission issues for all provided fields)
      return res
        .status(400)
        .json({
          error:
            'No valid changes to apply. Check permissions or provided data.',
        });
    }

    queryParams.push(requestedUserId); // For the WHERE user_id = $N clause

    try {
      console.log('[API] PUT /api/users/:id body', {
        id: requestedUserId,
        hasFirstName: firstName !== undefined,
        hasLastName: lastName !== undefined,
        hasRole: role !== undefined,
        hasStudent: Boolean(profileStudent),
        hasTeacher: Boolean(profileTeacher),
        actorRole: requestingUser.role,
      });

      const updatedUser = await db.withTransaction(async (client) => {
        // Update base user fields
        const queryText = `UPDATE users SET ${updatableFields.join(', ')} WHERE user_id = $${paramIndex} RETURNING user_id, email, first_name, last_name, role`;
        const baseResult = await client.query(queryText, queryParams);
        if (baseResult.rows.length === 0) {
          return { notFound: true };
        }
        const baseUser = baseResult.rows[0];

        // Determine target role for profile updates (post-change if role changed)
        const targetRole = baseUser.role;

        // Optionally upsert profile data
        if (targetRole === ROLES.STUDENT && profileStudent) {
          const { matricNo, department, course, level, phone } = profileStudent;
          // Upsert behavior: if profile exists, update; else insert
          await client.query(
            `INSERT INTO student_profiles (user_id, matric_no, department, course, level, phone)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (user_id) DO UPDATE SET
             matric_no = EXCLUDED.matric_no,
             department = EXCLUDED.department,
             course = EXCLUDED.course,
             level = EXCLUDED.level,
             phone = EXCLUDED.phone`,
            [
              baseUser.user_id,
              matricNo,
              department,
              course,
              level,
              phone || null,
            ]
          );
        }
        if (targetRole === ROLES.TEACHER && profileTeacher) {
          const { lecturerNo, department, faculty, office, phone } =
            profileTeacher;
          try {
            await client.query(
              `INSERT INTO teacher_profiles (user_id, lecturer_no, department, faculty, office, phone)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (user_id) DO UPDATE SET
               lecturer_no = EXCLUDED.lecturer_no,
               department = EXCLUDED.department,
               faculty = EXCLUDED.faculty,
               office = EXCLUDED.office,
               phone = EXCLUDED.phone`,
              [
                baseUser.user_id,
                lecturerNo,
                department,
                faculty || null,
                office || null,
                phone || null,
              ]
            );
          } catch (err) {
            if (err.code === '42703') {
              await client.query(
                `INSERT INTO teacher_profiles (user_id, lecturer_no, department, office, phone)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (user_id) DO UPDATE SET
             lecturer_no = EXCLUDED.lecturer_no,
             department = EXCLUDED.department,
             office = EXCLUDED.office,
             phone = EXCLUDED.phone`,
                [
                  baseUser.user_id,
                  lecturerNo,
                  department,
                  office || null,
                  phone || null,
                ]
              );
            } else {
              throw err;
            }
          }
        }

        return { user: baseUser };
      });

      if (updatedUser.notFound) {
        return res
          .status(404)
          .json({ error: 'User not found or update failed.' });
      }

      return res.json({
        message: 'User updated successfully.',
        user: updatedUser.user,
      });
    } catch (err) {
      console.error(`[API] Error updating user ${requestedUserId}:`, err);
      return res.status(500).json({ error: 'Server error updating user.' });
    }
  }
);

// --- Delete User by ID (Admin/Teacher Only) ---
// DELETE /api/users/:id
router.delete(
  '/:id',
  authMiddleware,
  validate(schemas.user.getById, 'params'),
  async (req, res) => {
    const requestedUserId = parseInt(req.params.id, 10);
    const requestingUserId = req.user.id;
    const requestingUserRole = req.user.role;

    // Validate requested ID
    if (isNaN(requestedUserId)) {
      return res.status(400).json({ error: 'Invalid user ID format.' });
    }

    // Authorization Check: Only Admin/Teacher can delete users
    // Also, prevent users from deleting themselves via this route (safer)
    if (![ROLES.ADMIN, ROLES.TEACHER].includes(requestingUserRole)) {
      return res
        .status(403)
        .json({ error: 'Forbidden: Insufficient privileges to delete users.' });
    }
    if (requestedUserId === requestingUserId) {
      return res
        .status(403)
        .json({
          error: 'Forbidden: Cannot delete your own account via this endpoint.',
        });
    }

    try {
      // Check if user exists before deleting (optional but good practice)
      const userCheck = await db.query(
        'SELECT 1 FROM users WHERE user_id = $1',
        [requestedUserId]
      );
      if (userCheck.rows.length === 0) {
        return res.status(404).json({ error: 'User not found.' });
      }

      // Perform the delete operation
      // Note: Consider implications of foreign key constraints (ON DELETE CASCADE/SET NULL etc.)
      // If attendance records reference user_id, deleting a user might fail or orphan records
      // depending on the schema design.
      await db.query('DELETE FROM users WHERE user_id = $1', [requestedUserId]);

      res
        .status(200)
        .json({
          message: `User with ID ${requestedUserId} deleted successfully.`,
        }); // 200 OK or 204 No Content
    } catch (err) {
      console.error(`Error deleting user ${requestedUserId}:`, err);
      // Check for foreign key constraint errors specifically if needed
      // if (err.code === '23503') { // PostgreSQL foreign key violation code
      //   return res.status(409).json({ error: 'Conflict: Cannot delete user because they are referenced by other records (e.g., attendance).' });
      // }
      res.status(500).json({ error: 'Server error deleting user.' });
    }
  }
);

// --- Create New User (Admin Only) ---
// POST /api/users/
router.post(
  '/',
  authMiddleware,
  validate(schemas.user.create),
  async (req, res) => {
    // 1. Authorization: Check if requester is Admin
    if (req.user.role !== ROLES.ADMIN) {
      return res
        .status(403)
        .json({ error: 'Forbidden: Only administrators can create users.' });
    }

    // 2. Extract and Validate Input
    const {
      email,
      password,
      firstName,
      lastName,
      role,
      profileStudent,
      profileTeacher,
    } = req.body;
    if (!email || !password || !firstName || !lastName || !role) {
      return res
        .status(400)
        .json({
          error:
            'Missing required fields (email, password, firstName, lastName, role).',
        });
    }
    if (![ROLES.TEACHER, ROLES.STUDENT].includes(role)) {
      // Admins can only create teachers or students via this route
      // Admin creation should happen via seed/manual process
      return res
        .status(400)
        .json({
          error: 'Invalid role specified. Can only create teacher or student.',
        });
    }
    // Add more validation (e.g., email format, password strength) if needed

    try {
      console.log('[API] POST /api/users body', {
        email,
        hasPassword: Boolean(password),
        firstName,
        lastName,
        role,
        hasStudent: Boolean(profileStudent),
        hasTeacher: Boolean(profileTeacher),
      });
      const result = await db.withTransaction(async (client) => {
        // 3. Check if email already exists
        const userExists = await client.query(
          'SELECT 1 FROM users WHERE email = $1',
          [email]
        );
        if (userExists.rows.length > 0) {
          return { conflict: true };
        }

        // 4. Hash the password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 5. Insert new user into the database
        const inserted = await client.query(
          'INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING user_id, email, first_name, last_name, role, created_at',
          [email, passwordHash, firstName, lastName, role]
        );
        const newUser = inserted.rows[0];

        // 6. Insert role-specific profile if provided
        if (role === ROLES.STUDENT) {
          // Validate minimal required profile fields for student
          if (profileStudent) {
            const { matricNo, department, course, level, phone } =
              profileStudent;
            if (!matricNo || !department || !course || !level) {
              throw new Error(
                'Missing required student profile fields (matricNo, department, course, level).'
              );
            }
            await client.query(
              'INSERT INTO student_profiles (user_id, matric_no, department, course, level, phone) VALUES ($1, $2, $3, $4, $5, $6)',
              [
                newUser.user_id,
                matricNo,
                department,
                course,
                level,
                phone || null,
              ]
            );
          }
        } else if (role === ROLES.TEACHER) {
          if (profileTeacher) {
            const { lecturerNo, department, faculty, office, phone } =
              profileTeacher;
            try {
              if (!lecturerNo || !department) {
                throw new Error(
                  'Missing required teacher profile fields (lecturerNo, department).'
                );
              }
              await client.query(
                'INSERT INTO teacher_profiles (user_id, lecturer_no, department, faculty, office, phone) VALUES ($1, $2, $3, $4, $5, $6)',
                [
                  newUser.user_id,
                  lecturerNo,
                  department,
                  faculty || null,
                  office || null,
                  phone || null,
                ]
              );
            } catch (err) {
              if (err.code === '42703') {
                await client.query(
                  'INSERT INTO teacher_profiles (user_id, lecturer_no, department, office, phone) VALUES ($1, $2, $3, $4, $5)',
                  [
                    newUser.user_id,
                    lecturerNo,
                    department,
                    office || null,
                    phone || null,
                  ]
                );
              } else {
                throw err;
              }
            }
          }
        }

        // 7. Return full user with profile (if any) to the client
        let joined;
        try {
          joined = await client.query(
            `SELECT u.user_id, u.email, u.first_name, u.last_name, u.role, u.created_at,
                  sp.matric_no AS student_matric_no, sp.department AS student_department, sp.course AS student_course, sp.level AS student_level, sp.phone AS student_phone,
                  tp.lecturer_no AS teacher_lecturer_no, tp.department AS teacher_department, tp.faculty AS teacher_faculty, tp.office AS teacher_office, tp.phone AS teacher_phone
             FROM users u
        LEFT JOIN student_profiles sp ON sp.user_id = u.user_id
        LEFT JOIN teacher_profiles tp ON tp.user_id = u.user_id
            WHERE u.user_id = $1`,
            [newUser.user_id]
          );
        } catch (err) {
          if (err.code === '42703') {
            joined = await client.query(
              `SELECT u.user_id, u.email, u.first_name, u.last_name, u.role, u.created_at,
                sp.matric_no AS student_matric_no, sp.department AS student_department, sp.course AS student_course, sp.level AS student_level, sp.phone AS student_phone,
                    tp.lecturer_no AS teacher_lecturer_no, tp.department AS teacher_department, NULL::varchar AS teacher_faculty, tp.office AS teacher_office, tp.phone AS teacher_phone
           FROM users u
      LEFT JOIN student_profiles sp ON sp.user_id = u.user_id
      LEFT JOIN teacher_profiles tp ON tp.user_id = u.user_id
          WHERE u.user_id = $1`,
              [newUser.user_id]
            );
          } else {
            throw err;
          }
        }

        const r = joined.rows[0];
        const base = {
          user_id: r.user_id,
          email: r.email,
          first_name: r.first_name,
          last_name: r.last_name,
          role: r.role,
          created_at: r.created_at,
        };

        let withProfile = base;
        if (r.role === ROLES.STUDENT) {
          withProfile = {
            ...base,
            profile: {
              matric_no: r.student_matric_no || null,
              department: r.student_department || null,
              course: r.student_course || null,
              level: r.student_level || null,
              phone: r.student_phone || null,
            },
          };
        } else if (r.role === ROLES.TEACHER) {
          withProfile = {
            ...base,
            profile: {
              lecturer_no: r.teacher_lecturer_no || null,
              department: r.teacher_department || null,
              faculty: r.teacher_faculty || null,
              office: r.teacher_office || null,
              phone: r.teacher_phone || null,
            },
          };
        }

        return { user: withProfile };
      });

      if (result.conflict) {
        return res
          .status(409)
          .json({ error: 'Conflict: Email address is already in use.' });
      }

      return res
        .status(201)
        .json({ message: 'User created successfully.', user: result.user });
    } catch (err) {
      console.error('[API] Error creating user:', err);
      // Basic constraint handling for uniqueness
      if (err.message && err.message.startsWith('Missing required')) {
        return res.status(400).json({ error: err.message });
      }
      return res
        .status(500)
        .json({ error: 'Server error during user creation.' });
    }
  }
);

// --- Bulk Import Users (Admin Only) ---
// POST /api/users/import
router.post(
  '/import',
  authMiddleware,
  validate(schemas.import.usersBulk),
  async (req, res) => {
    if (req.user.role !== ROLES.ADMIN) {
      return res
        .status(403)
        .json({ error: 'Forbidden: Only administrators can import users.' });
    }

    const { rows } = req.body; // rows: array of CSV-like objects

    // Helpers
    const derivePassword = (role, lastName, matricNo, lecturerNo) => {
      const base =
        role === ROLES.STUDENT
          ? `${(matricNo || '').trim()}${(lastName || '').trim()}`
          : `${(lecturerNo || '').trim()}${(lastName || '').trim()}`;
      let pwd = base || 'Passw0rd';
      if (pwd.length < 6) pwd = `${pwd}!1`;
      return pwd;
    };

    const summary = {
      total: rows.length,
      created: 0,
      skipped: 0,
      errors: [],
    };

    try {
      for (let i = 0; i < rows.length; i += 1) {
        const r = rows[i];
        const rowNum = i + 2; // assume header at 1

        // Process each row in its own transaction to avoid poisoning the whole batch
        try {
          const result = await db.withTransaction(async (client) => {
            const email = (r.email || '').toLowerCase().trim();
            const firstName = (r.firstName || '').trim();
            const lastName = (r.lastName || '').trim();
            const roleStr = (r.role || '').toLowerCase().trim();
            if (!email || !firstName || !lastName || !['student', 'teacher'].includes(roleStr)) {
              return { skip: { field: 'required', message: 'Missing required fields or invalid role' } };
            }

            // duplicate email
            const emailExists = await client.query('SELECT 1 FROM users WHERE email = $1', [email]);
            if (emailExists.rows.length > 0) {
              return { skip: { field: 'email', message: 'Email already exists' } };
            }

            // Role-specific duplicate keys pre-check
            if (roleStr === 'student') {
              const matricNo = (r.matricNo || '').trim();
              if (matricNo) {
                const m = await client.query('SELECT 1 FROM student_profiles WHERE matric_no = $1', [matricNo]);
                if (m.rows.length > 0) {
                  return { skip: { field: 'matricNo', message: 'matric_no already exists' } };
                }
              }
            } else if (roleStr === 'teacher') {
              const lecturerNo = (r.lecturerNo || '').trim();
              if (lecturerNo) {
                const l = await client.query('SELECT 1 FROM teacher_profiles WHERE lecturer_no = $1', [lecturerNo]);
                if (l.rows.length > 0) {
                  return { skip: { field: 'lecturerNo', message: 'lecturer_no already exists' } };
                }
              }
            }

            // Derive password if missing
            const providedPassword = (r.password || '').trim();
            const effectivePassword = providedPassword
              ? providedPassword
              : derivePassword(
                  roleStr === 'student' ? ROLES.STUDENT : ROLES.TEACHER,
                  lastName,
                  r.matricNo,
                  r.lecturerNo
                );
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(effectivePassword, salt);

            // Insert user
            const inserted = await client.query(
              'INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING user_id',
              [email, passwordHash, firstName, lastName, roleStr]
            );
            const userId = inserted.rows[0].user_id;

            if (roleStr === 'student') {
              const matricNo = (r.matricNo || '').trim();
              const department = (r.department || '').trim() || null;
              const course = (r.course || '').trim() || null;
              const level = (r.level || '').trim() || null;
              const phone = (r.phone || null) || null;
              if (!matricNo || !department || !course || !level) {
                // rollback via throwing to outer catch but return structured reason
                throw new Error('Missing required student profile fields');
              }
              await client.query(
                'INSERT INTO student_profiles (user_id, matric_no, department, course, level, phone) VALUES ($1, $2, $3, $4, $5, $6)',
                [userId, matricNo, department, course, level, phone]
              );
            } else {
              const lecturerNo = (r.lecturerNo || '').trim();
              const department = (r.department || '').trim() || null;
              const faculty = (r.faculty || '').trim() || null;
              const office = (r.office || '').trim() || null;
              const phone = (r.phone || null) || null;
              if (!lecturerNo || !department) {
                throw new Error('Missing required teacher profile fields');
              }
              try {
                await client.query(
                  'INSERT INTO teacher_profiles (user_id, lecturer_no, department, faculty, office, phone) VALUES ($1, $2, $3, $4, $5, $6)',
                  [userId, lecturerNo, department, faculty, office, phone]
                );
              } catch (err) {
                if (err.code === '42703') {
                  await client.query(
                    'INSERT INTO teacher_profiles (user_id, lecturer_no, department, office, phone) VALUES ($1, $2, $3, $4, $5)',
                    [userId, lecturerNo, department, office, phone]
                  );
                } else {
                  throw err;
                }
              }
            }

            return { created: true };
          });

          if (result && result.skip) {
            summary.skipped += 1;
            summary.errors.push({ row: rowNum, field: result.skip.field, message: result.skip.message });
          } else if (result && result.created) {
            summary.created += 1;
          } else {
            summary.skipped += 1;
            summary.errors.push({ row: rowNum, field: 'api', message: 'Unknown processing result' });
          }
        } catch (e) {
          // Per-row failure shouldn't abort the batch
          summary.skipped += 1;
          summary.errors.push({ row: rowNum, field: 'api', message: e.message || 'Failed to import row' });
        }
      }

      return res.status(200).json({ message: 'Import completed', ...summary, total: rows.length });
    } catch (err) {
      console.error('[API] Error during bulk import:', err);
      return res.status(500).json({ error: 'Server error during bulk import.' });
    }
  }
);

// We will add other user management routes here

module.exports = router;

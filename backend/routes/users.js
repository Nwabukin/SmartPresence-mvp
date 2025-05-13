const express = require('express');
const router = express.Router();
const db = require('../db'); // Database connection
const authMiddleware = require('../middleware/auth'); // Authentication middleware
const ROLES = require('../utils/roles'); // Assuming roles are defined centrally
const bcrypt = require('bcryptjs'); // Need bcrypt for hashing password

// --- Get All Users (Admin/Teacher Only) ---
// GET /api/users/
router.get('/', authMiddleware, async (req, res) => {
  // Check user role from the token (added by authMiddleware)
  if (![ROLES.ADMIN, ROLES.TEACHER].includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden: Insufficient privileges.' });
  }

  try {
    // Fetch all users, excluding password hash for security
    const result = await db.query('SELECT user_id, email, first_name, last_name, role, created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Server error fetching users.' });
  }
});

// --- Get Specific User by ID ---
// GET /api/users/:id
router.get('/:id', authMiddleware, async (req, res) => {
  const requestedUserId = parseInt(req.params.id, 10);
  const requestingUserId = req.user.id;
  const requestingUserRole = req.user.role;

  // Validate requested ID
  if (isNaN(requestedUserId)) {
    return res.status(400).json({ error: 'Invalid user ID format.' });
  }

  // Authorization Check:
  // Allow if admin/teacher OR if the user is requesting their own data
  if (!([ROLES.ADMIN, ROLES.TEACHER].includes(requestingUserRole) || requestedUserId === requestingUserId)) {
    return res.status(403).json({ error: 'Forbidden: You do not have permission to view this user.' });
  }

  try {
    // Fetch the specific user, excluding password hash
    const result = await db.query(
      'SELECT user_id, email, first_name, last_name, role, created_at FROM users WHERE user_id = $1',
      [requestedUserId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(`Error fetching user ${requestedUserId}:`, err);
    res.status(500).json({ error: 'Server error fetching user.' });
  }
});

// --- Update User by ID ---
// PUT /api/users/:id
router.put('/:id', authMiddleware, async (req, res) => {
  const requestedUserId = parseInt(req.params.id, 10);
  const { firstName, lastName, role } = req.body; // Destructure role from body
  const requestingUser = req.user; // Contains requesting user's id and role

  if (isNaN(requestedUserId)) {
    return res.status(400).json({ error: 'Invalid user ID format.' });
  }

  // Check if at least one field is provided for update
  if (firstName === undefined && lastName === undefined && role === undefined) {
    return res.status(400).json({ error: 'No updateable fields provided (firstName, lastName, role).' });
  }

  const updatableFields = [];
  const queryParams = [];
  let paramIndex = 1;
  let userBeingUpdatedCurrentRole = null;

  // If a role change is attempted by an admin for another user, fetch that user's current role.
  if (role !== undefined && requestingUser.role === ROLES.ADMIN && requestedUserId !== requestingUser.id) {
    try {
      const userResult = await db.query('SELECT role FROM users WHERE user_id = $1', [requestedUserId]);
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User to be updated not found.' });
      }
      userBeingUpdatedCurrentRole = userResult.rows[0].role;
    } catch (err) {
      console.error(`Error fetching user ${requestedUserId} for role check:`, err);
      return res.status(500).json({ error: 'Server error during user data retrieval for update.' });
    }
  }

  // Handle firstName update
  if (firstName !== undefined) {
    const canUpdateFirstName = 
      requestingUser.role === ROLES.ADMIN || 
      requestingUser.role === ROLES.TEACHER || 
      (requestedUserId === requestingUser.id);
    
    if (canUpdateFirstName) {
      updatableFields.push(`first_name = $${paramIndex++}`);
      queryParams.push(firstName);
    } else if (role === undefined || requestingUser.role !== ROLES.ADMIN) { 
      // If firstName is provided, user is not authorized, and it's not an admin simultaneously attempting a role change
      return res.status(403).json({ error: 'Forbidden: You do not have permission to update firstName for this user.' });
    }
  }

  // Handle lastName update
  if (lastName !== undefined) {
    const canUpdateLastName = 
      requestingUser.role === ROLES.ADMIN || 
      requestingUser.role === ROLES.TEACHER || 
      (requestedUserId === requestingUser.id);

    if (canUpdateLastName) {
      updatableFields.push(`last_name = $${paramIndex++}`);
      queryParams.push(lastName);
    } else if (role === undefined || requestingUser.role !== ROLES.ADMIN) {
      // If lastName is provided, user is not authorized, and it's not an admin simultaneously attempting a role change
      return res.status(403).json({ error: 'Forbidden: You do not have permission to update lastName for this user.' });
    }
  }
  
  // Handle role update
  if (role !== undefined) {
    if (requestingUser.role !== ROLES.ADMIN) {
      return res.status(403).json({ error: 'Forbidden: Only administrators can change user roles.' });
    }
    if (requestedUserId === requestingUser.id) {
      return res.status(403).json({ error: 'Forbidden: Administrators cannot change their own role via this endpoint.' });
    }
    if (userBeingUpdatedCurrentRole === ROLES.ADMIN) {
      return res.status(403).json({ error: 'Forbidden: Cannot change the role of another administrator via this endpoint.' });
    }
    if (![ROLES.TEACHER, ROLES.STUDENT].includes(role)) {
      return res.status(400).json({ error: 'Invalid target role specified. Can only change to teacher or student.' });
    }
    
    updatableFields.push(`role = $${paramIndex++}`);
    queryParams.push(role);
  }

  if (updatableFields.length === 0) {
    // This means fields were provided, but none resulted in an update (e.g., due to permission issues for all provided fields)
    return res.status(400).json({ error: 'No valid changes to apply. Check permissions or provided data.' });
  }

  queryParams.push(requestedUserId); // For the WHERE user_id = $N clause

  try {
    const queryText = `UPDATE users SET ${updatableFields.join(', ')} WHERE user_id = $${paramIndex} RETURNING user_id, email, first_name, last_name, role`;
    
    const result = await db.query(queryText, queryParams);

    if (result.rows.length === 0) {
      // Should ideally be caught by the user check if role was being updated, but good as a fallback.
      return res.status(404).json({ error: 'User not found or update failed.' });
    }

    res.json({
      message: 'User updated successfully.',
      user: result.rows[0],
    });
  } catch (err) {
    console.error(`Error updating user ${requestedUserId}:`, err);
    res.status(500).json({ error: 'Server error updating user.' });
  }
});

// --- Delete User by ID (Admin/Teacher Only) ---
// DELETE /api/users/:id
router.delete('/:id', authMiddleware, async (req, res) => {
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
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges to delete users.' });
  }
  if (requestedUserId === requestingUserId) {
      return res.status(403).json({ error: 'Forbidden: Cannot delete your own account via this endpoint.' });
  }

  try {
    // Check if user exists before deleting (optional but good practice)
    const userCheck = await db.query('SELECT 1 FROM users WHERE user_id = $1', [requestedUserId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Perform the delete operation
    // Note: Consider implications of foreign key constraints (ON DELETE CASCADE/SET NULL etc.)
    // If attendance records reference user_id, deleting a user might fail or orphan records
    // depending on the schema design.
    await db.query('DELETE FROM users WHERE user_id = $1', [requestedUserId]);

    res.status(200).json({ message: `User with ID ${requestedUserId} deleted successfully.` }); // 200 OK or 204 No Content

  } catch (err) {
    console.error(`Error deleting user ${requestedUserId}:`, err);
    // Check for foreign key constraint errors specifically if needed
    // if (err.code === '23503') { // PostgreSQL foreign key violation code
    //   return res.status(409).json({ error: 'Conflict: Cannot delete user because they are referenced by other records (e.g., attendance).' });
    // }
    res.status(500).json({ error: 'Server error deleting user.' });
  }
});

// --- Create New User (Admin Only) ---
// POST /api/users/
router.post('/', authMiddleware, async (req, res) => {
  // 1. Authorization: Check if requester is Admin
  if (req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({ error: 'Forbidden: Only administrators can create users.' });
  }

  // 2. Extract and Validate Input
  const { email, password, firstName, lastName, role } = req.body;
  if (!email || !password || !firstName || !lastName || !role) {
    return res.status(400).json({ error: 'Missing required fields (email, password, firstName, lastName, role).' });
  }
  if (![ROLES.TEACHER, ROLES.STUDENT].includes(role)) {
    // Admins can only create teachers or students via this route
    // Admin creation should happen via seed/manual process
    return res.status(400).json({ error: 'Invalid role specified. Can only create teacher or student.' });
  }
  // Add more validation (e.g., email format, password strength) if needed

  try {
    // 3. Check if email already exists
    const userExists = await db.query('SELECT 1 FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(409).json({ error: 'Conflict: Email address is already in use.' }); // 409 Conflict is appropriate here
    }

    // 4. Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 5. Insert new user into the database
    const newUser = await db.query(
      'INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING user_id, email, first_name, last_name, role, created_at',
      [email, passwordHash, firstName, lastName, role]
    );

    // 6. Send Response
    res.status(201).json({
      message: 'User created successfully.',
      user: newUser.rows[0],
    });

  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Server error during user creation.' });
  }
});

// We will add other user management routes here

module.exports = router; 
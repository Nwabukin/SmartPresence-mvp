const express = require('express');
const router = express.Router();

// Middleware
const authMiddleware = require('../middleware/auth'); // Corrected path
const adminMiddleware = require('../middleware/adminMiddleware');
const { validate, schemas } = require('../utils/validation'); // Input validation

// Database connection (pool or query function)
const db = require('../db'); // Assuming db/index.js or db.js exports query or pool

const { sendSuccess, handleDbError } = require('../utils/http');

// Create a new room
// POST /api/rooms
// Protected by authMiddleware (user must be logged in) and adminMiddleware (user must be an admin)
router.post(
  '/',
  [authMiddleware, adminMiddleware],
  validate(schemas.room.create),
  async (req, res) => {
    const { name, wifi_ssid, bluetooth_beacon_id } = req.body;

    // Normalize optional beacon: empty string -> null
    const normalizedBeaconId = bluetooth_beacon_id === '' ? null : bluetooth_beacon_id;

    try {
      const newRoom = await db.query(
        'INSERT INTO rooms (name, wifi_ssid, bluetooth_beacon_id) VALUES ($1, $2, $3) RETURNING *',
        [name, wifi_ssid, normalizedBeaconId]
      );
      return sendSuccess(res, 201, 'Room created successfully', newRoom.rows[0]);
    } catch (err) {
      return handleDbError(err, res);
    }
  }
);

// Get all rooms
// GET /api/rooms
// Allow both admins and teachers to read rooms (teachers need this for session scheduling)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const allRooms = await db.query('SELECT * FROM rooms ORDER BY name ASC');
    return sendSuccess(res, 200, 'Rooms retrieved successfully', allRooms.rows);
  } catch (err) {
    return handleDbError(err, res);
  }
});

// Get a single room by ID
// GET /api/rooms/:id
// Allow both admins and teachers to read individual rooms
router.get(
  '/:id',
  authMiddleware,
  validate(schemas.room.getById, 'params'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const room = await db.query('SELECT * FROM rooms WHERE room_id = $1', [
        id,
      ]);

      if (room.rows.length === 0) {
        return res.status(404).json({ msg: 'Room not found' });
      }
      return sendSuccess(res, 200, 'Room retrieved successfully', room.rows[0]);
    } catch (err) {
      // Check for specific errors, e.g., invalid UUID format if your ID is UUID
      if (err.message.includes('invalid input syntax for type uuid')) {
        // Example for PostgreSQL UUID
        return res.status(400).json({ msg: 'Invalid room ID format.' });
      }
      return handleDbError(err, res);
    }
  }
);

// Update a room by ID
// PUT /api/rooms/:id
router.put(
  '/:id',
  [authMiddleware, adminMiddleware],
  validate(schemas.room.getById, 'params'),
  validate(schemas.room.update),
  async (req, res) => {
    const { id } = req.params;
    const { name, wifi_ssid, bluetooth_beacon_id } = req.body;

    // Normalize optional beacon: empty string -> null
    const normalizedBeaconId = bluetooth_beacon_id === '' ? null : bluetooth_beacon_id;

    try {
      const updatedRoom = await db.query(
        'UPDATE rooms SET name = $1, wifi_ssid = $2, bluetooth_beacon_id = $3 WHERE room_id = $4 RETURNING *',
        [name, wifi_ssid, normalizedBeaconId, id]
      );

      if (updatedRoom.rows.length === 0) {
        return res.status(404).json({ msg: 'Room not found to update' });
      }
      return sendSuccess(res, 200, 'Room updated successfully', updatedRoom.rows[0]);
    } catch (err) {
      // Check for specific errors, e.g., invalid UUID format
      if (err.message.includes('invalid input syntax for type uuid')) {
        return res.status(400).json({ msg: 'Invalid room ID format.' });
      }
      return handleDbError(err, res);
    }
  }
);

// Delete a room by ID
// DELETE /api/rooms/:id
router.delete(
  '/:id',
  [authMiddleware, adminMiddleware],
  validate(schemas.room.getById, 'params'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const deleteOp = await db.query(
        'DELETE FROM rooms WHERE room_id = $1 RETURNING *',
        [id]
      );

      if (deleteOp.rowCount === 0) {
        // rowCount is more standard for DELETE w/o RETURNING, but RETURNING * gives rows.
        return res.status(404).json({ msg: 'Room not found to delete' });
      }
      // Align with documented response shape: data is null on delete success
      return sendSuccess(res, 200, 'Room deleted successfully', null);
    } catch (err) {
      // Check for specific errors, e.g., invalid UUID format
      if (err.message.includes('invalid input syntax for type uuid')) {
        return res.status(400).json({ msg: 'Invalid room ID format.' });
      }
      return handleDbError(err, res);
    }
  }
);

module.exports = router;

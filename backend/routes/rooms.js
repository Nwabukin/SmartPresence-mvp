const express = require('express');
const router = express.Router();

// Middleware
const authMiddleware = require('../middleware/auth'); // Corrected path
const adminMiddleware = require('../middleware/adminMiddleware');
const { validate, schemas } = require('../utils/validation'); // Input validation

// Database connection (pool or query function)
const db = require('../db'); // Assuming db/index.js or db.js exports query or pool

// Create a new room
// POST /api/rooms
// Protected by authMiddleware (user must be logged in) and adminMiddleware (user must be an admin)
router.post('/', [authMiddleware, adminMiddleware], validate(schemas.room.create), async (req, res) => {
  const { name, wifi_ssid, bluetooth_beacon_id } = req.body;

  try {
    const newRoom = await db.query(
      'INSERT INTO rooms (name, wifi_ssid, bluetooth_beacon_id) VALUES ($1, $2, $3) RETURNING *',
      [name, wifi_ssid, bluetooth_beacon_id]
    );
    res.status(201).json(newRoom.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get all rooms
// GET /api/rooms
router.get('/', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const allRooms = await db.query('SELECT * FROM rooms ORDER BY name ASC');
    res.json(allRooms.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get a single room by ID
// GET /api/rooms/:id
router.get('/:id', [authMiddleware, adminMiddleware], validate(schemas.room.getById, 'params'), async (req, res) => {
  try {
    const { id } = req.params;
    const room = await db.query('SELECT * FROM rooms WHERE room_id = $1', [id]);

    if (room.rows.length === 0) {
      return res.status(404).json({ msg: 'Room not found' });
    }
    res.json(room.rows[0]);
  } catch (err) {
    console.error(err.message);
    // Check for specific errors, e.g., invalid UUID format if your ID is UUID
    if (err.message.includes('invalid input syntax for type uuid')) { // Example for PostgreSQL UUID
        return res.status(400).json({ msg: 'Invalid room ID format.' });
    }
    res.status(500).send('Server error');
  }
});

// Update a room by ID
// PUT /api/rooms/:id
router.put('/:id', [authMiddleware, adminMiddleware], validate(schemas.room.getById, 'params'), validate(schemas.room.update), async (req, res) => {
  const { id } = req.params;
  const { name, wifi_ssid, bluetooth_beacon_id } = req.body;

  try {
    const updatedRoom = await db.query(
      'UPDATE rooms SET name = $1, wifi_ssid = $2, bluetooth_beacon_id = $3 WHERE room_id = $4 RETURNING *',
      [name, wifi_ssid, bluetooth_beacon_id, id]
    );

    if (updatedRoom.rows.length === 0) {
      return res.status(404).json({ msg: 'Room not found to update' });
    }
    res.json(updatedRoom.rows[0]);
  } catch (err) {
    console.error(err.message);
    // Check for specific errors, e.g., invalid UUID format
    if (err.message.includes('invalid input syntax for type uuid')) { 
        return res.status(400).json({ msg: 'Invalid room ID format.' });
    }
    res.status(500).send('Server error');
  }
});

// Delete a room by ID
// DELETE /api/rooms/:id
router.delete('/:id', [authMiddleware, adminMiddleware], validate(schemas.room.getById, 'params'), async (req, res) => {
  try {
    const { id } = req.params;
    const deleteOp = await db.query('DELETE FROM rooms WHERE room_id = $1 RETURNING *', [id]);

    if (deleteOp.rowCount === 0) { // rowCount is more standard for DELETE w/o RETURNING, but RETURNING * gives rows.
      return res.status(404).json({ msg: 'Room not found to delete' });
    }
    // If RETURNING * was used, deletedOp.rows[0] would contain the deleted room.
    // If not, you might just send a success message.
    res.json({ msg: 'Room deleted successfully', deletedRoom: deleteOp.rows[0] });
  } catch (err) {
    console.error(err.message);
    // Check for specific errors, e.g., invalid UUID format
    if (err.message.includes('invalid input syntax for type uuid')) { 
        return res.status(400).json({ msg: 'Invalid room ID format.' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router; 
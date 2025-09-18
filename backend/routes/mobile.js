const express = require('express');
const router = express.Router();

// Placeholder - concrete handlers will be added in subsequent tasks
router.get('/health', (req, res) => {
  res.json({ ok: true });
});

module.exports = router;

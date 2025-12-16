const express = require('express');
const router = express.Router();

// Minimal photos endpoint — returns empty array for now
router.get('/', async (req, res) => {
  try {
    res.json([]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

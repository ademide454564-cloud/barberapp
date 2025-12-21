const express = require('express');
const router = express.Router();

// Get unread notification count for a customer
router.get('/unread-count/:customerId', async (req, res) => {
  try {
    // For now, return 0. You can implement actual notification logic later
    res.json({ count: 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

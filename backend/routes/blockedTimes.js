const express = require('express');
const router = express.Router();
const BlockedTime = require('../models/blockedTime.model');

// POST /blocked-times/check
// body: { date: ISOString, time: "HH:mm" (optional) }
router.post('/check', async (req, res) => {
  try {
    const { date, time } = req.body;
    const d = new Date(date);

    // Check full_day blocked
    const full = await BlockedTime.findOne({ date: d, type: 'full_day' }).lean();
    if (full) return res.json({ isBlocked: true, type: 'full_day', reason: full.reason || '' });

    // Check time_range entries
    const ranges = await BlockedTime.find({ date: d, type: 'time_range' }).lean();
    if (!ranges || ranges.length === 0) return res.json({ isBlocked: false });

    if (!time) return res.json({ isBlocked: true, type: 'time_range', reason: ranges[0].reason || '' });

    const [h, m] = time.split(':').map(Number);
    const tMinutes = h * 60 + m;

    for (const r of ranges) {
      const [sh, sm] = r.start_time.split(':').map(Number);
      const [eh, em] = r.end_time.split(':').map(Number);
      const sM = sh * 60 + sm;
      const eM = eh * 60 + em;
      if (tMinutes >= sM && tMinutes < eM) return res.json({ isBlocked: true, type: 'time_range', reason: r.reason || '' });
    }

    return res.json({ isBlocked: false });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const BlockedTime = require('../models/blockedTime.model');

// GET /blocked-times - Tüm kapalı zamanları listele
router.get('/', async (req, res) => {
  try {
    const blockedTimes = await BlockedTime.find().sort({ date: 1 });
    res.json(blockedTimes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /blocked-times - Yeni kapalı zaman ekle
router.post('/', async (req, res) => {
  try {
    const blockedTime = new BlockedTime(req.body);
    await blockedTime.save();
    res.json(blockedTime);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /blocked-times/:id - Kapalı zaman sil
router.delete('/:id', async (req, res) => {
  try {
    await BlockedTime.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /blocked-times/check
// body: { date: ISOString, time: "HH:mm" (optional) }
router.post('/check', async (req, res) => {
  try {
    const { date, time } = req.body;
    const d = new Date(date);
    const dayOfWeek = d.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Check recurring blocked days (e.g., every Sunday)
    const recurringFull = await BlockedTime.findOne({
      is_recurring: true,
      recurring_day: dayOfWeek,
      type: 'full_day'
    }).lean();
    if (recurringFull) return res.json({ isBlocked: true, type: 'full_day', reason: recurringFull.reason || '' });

    // Check recurring time ranges
    const recurringRanges = await BlockedTime.find({
      is_recurring: true,
      recurring_day: dayOfWeek,
      type: 'time_range'
    }).lean();

    if (recurringRanges && recurringRanges.length > 0) {
      if (!time) return res.json({ isBlocked: true, type: 'time_range', reason: recurringRanges[0].reason || '' });

      const [h, m] = time.split(':').map(Number);
      const tMinutes = h * 60 + m;

      for (const r of recurringRanges) {
        const [sh, sm] = r.start_time.split(':').map(Number);
        const [eh, em] = r.end_time.split(':').map(Number);
        const sM = sh * 60 + sm;
        const eM = eh * 60 + em;
        if (tMinutes >= sM && tMinutes < eM) return res.json({ isBlocked: true, type: 'time_range', reason: r.reason || '' });
      }
    }

    // Check full_day blocked for specific date
    const full = await BlockedTime.findOne({ date: d, type: 'full_day' }).lean();
    if (full) return res.json({ isBlocked: true, type: 'full_day', reason: full.reason || '' });

    // Check time_range entries for specific date
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

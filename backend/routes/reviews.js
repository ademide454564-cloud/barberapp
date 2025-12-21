const express = require('express');
const router = express.Router();
const Review = require('../models/review.model');

router.get('/', async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 }).limit(50).lean();
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/create', async (req, res) => {
  try {
    const { customer_id, appointment_id, rating, comment } = req.body;
    const review = await Review.create({ customer_id, appointment_id, rating, comment });
    res.json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get average rating
router.get('/average-rating', async (req, res) => {
  try {
    const reviews = await Review.find();
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;
    res.json({ averageRating: parseFloat(averageRating.toFixed(1)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

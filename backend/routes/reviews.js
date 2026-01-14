const express = require('express');
const router = express.Router();
const Review = require('../models/review.model');
const { notifyNewReview } = require('../utils/notificationHelper');

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

    // Populate ederek bildirim gönder
    const populatedReview = await Review.findById(review._id).populate('customer_id');

    // Admin'e bildirim gönder
    try {
      await notifyNewReview(populatedReview);
    } catch (notificationError) {
      console.error('Yorum bildirimi gönderilirken hata:', notificationError);
    }

    res.json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get average rating
router.get('/average-rating', async (req, res) => {
  try {
    const reviews = await Review.find({ is_hidden: false });
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;
    res.json({ averageRating: parseFloat(averageRating.toFixed(1)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Toggle review visibility (hide/show)
router.put('/:id/toggle-visibility', async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Yorum bulunamadı' });
    }
    review.is_hidden = !review.is_hidden;
    await review.save();
    res.json({ message: review.is_hidden ? 'Yorum gizlendi' : 'Yorum gösterildi', review });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete review
router.delete('/:id', async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Yorum bulunamadı' });
    }
    res.json({ message: 'Yorum silindi' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

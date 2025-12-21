const express = require('express');
const router = express.Router();
const Service = require('../models/service.model');

// Get all service extras
router.get('/', async (req, res) => {
  try {
    const services = await Service.find().lean();
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    // Fallback: match services whose name contains the category string (case-insensitive)
    const services = await Service.find({ name: new RegExp(category, 'i') }).lean();
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

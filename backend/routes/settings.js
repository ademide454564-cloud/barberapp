const express = require('express');
const router = express.Router();
const Settings = require('../models/settings.model');

// Get appointment settings
router.get('/appointment', async (req, res) => {
  try {
    let settings = await Settings.findOne({ type: 'appointment' });

    // Eğer ayarlar yoksa varsayılan ayarları oluştur
    if (!settings) {
      settings = new Settings({
        type: 'appointment',
        autoApprove: false,
        slotDuration: 30,
        minAdvanceBooking: 2,
        maxAdvanceBooking: 30,
        allowCancellation: true,
        cancellationDeadline: 24,
        allowSameDayBooking: true,
        requireDeposit: false,
        depositAmount: 0,
      });
      await settings.save();
    }

    res.json(settings);
  } catch (error) {
    console.error('Error fetching appointment settings:', error);
    res.status(500).json({ message: 'Ayarlar getirilemedi', error: error.message });
  }
});

// Update appointment settings
router.post('/appointment', async (req, res) => {
  try {
    const {
      autoApprove,
      slotDuration,
      minAdvanceBooking,
      maxAdvanceBooking,
      allowCancellation,
      cancellationDeadline,
      allowSameDayBooking,
      requireDeposit,
      depositAmount,
    } = req.body;

    let settings = await Settings.findOne({ type: 'appointment' });

    if (!settings) {
      settings = new Settings({ type: 'appointment' });
    }

    // Update fields
    if (autoApprove !== undefined) settings.autoApprove = autoApprove;
    if (slotDuration !== undefined) settings.slotDuration = slotDuration;
    if (minAdvanceBooking !== undefined) settings.minAdvanceBooking = minAdvanceBooking;
    if (maxAdvanceBooking !== undefined) settings.maxAdvanceBooking = maxAdvanceBooking;
    if (allowCancellation !== undefined) settings.allowCancellation = allowCancellation;
    if (cancellationDeadline !== undefined) settings.cancellationDeadline = cancellationDeadline;
    if (allowSameDayBooking !== undefined) settings.allowSameDayBooking = allowSameDayBooking;
    if (requireDeposit !== undefined) settings.requireDeposit = requireDeposit;
    if (depositAmount !== undefined) settings.depositAmount = depositAmount;

    const savedSettings = await settings.save();
    res.json(savedSettings);
  } catch (error) {
    console.error('Error saving appointment settings:', error);
    res.status(500).json({ message: 'Ayarlar kaydedilemedi', error: error.message });
  }
});

// Get general settings
router.get('/general', async (req, res) => {
  try {
    let settings = await Settings.findOne({ type: 'general' });

    if (!settings) {
      settings = new Settings({ type: 'general' });
      await settings.save();
    }

    res.json(settings);
  } catch (error) {
    console.error('Error fetching general settings:', error);
    res.status(500).json({ message: 'Ayarlar getirilemedi', error: error.message });
  }
});

// Get notification settings
router.get('/notification', async (req, res) => {
  try {
    let settings = await Settings.findOne({ type: 'notification' });

    if (!settings) {
      settings = new Settings({ type: 'notification' });
      await settings.save();
    }

    res.json(settings);
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({ message: 'Ayarlar getirilemedi', error: error.message });
  }
});

module.exports = router;

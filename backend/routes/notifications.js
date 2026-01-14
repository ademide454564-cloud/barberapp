const express = require('express');
const router = express.Router();
const Notification = require('../models/notification.model');
const Staff = require('../models/staff.model');

// Get all notifications for admin
router.get('/admin/all', async (req, res) => {
  try {
    // Tüm staff'ları bul
    const staffMembers = await Staff.find();
    const staffIds = staffMembers.map(s => s._id);

    const notifications = await Notification.find({
      recipient_type: 'admin',
      recipient_id: { $in: staffIds }
    })
      .populate('data.appointment_id')
      .populate('data.customer_id')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get unread count for admin
router.get('/admin/unread-count', async (req, res) => {
  try {
    const staffMembers = await Staff.find();
    const staffIds = staffMembers.map(s => s._id);

    const count = await Notification.countDocuments({
      recipient_type: 'admin',
      recipient_id: { $in: staffIds },
      is_read: false
    });

    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all notifications for a customer
router.get('/customer/:customerId', async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient_type: 'customer',
      recipient_id: req.params.customerId
    })
      .populate('data.appointment_id')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get unread notification count for a customer
router.get('/customer/unread-count/:customerId', async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient_type: 'customer',
      recipient_id: req.params.customerId,
      is_read: false
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark notification as read
router.put('/:notificationId/read', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.notificationId,
      { is_read: true },
      { new: true }
    );
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark all notifications as read for a customer
router.put('/read-all/:customerId', async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient_id: req.params.customerId, is_read: false },
      { is_read: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a notification
router.delete('/:notificationId', async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.notificationId);
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

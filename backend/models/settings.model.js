const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    unique: true,
    enum: ['appointment', 'general', 'notification'],
  },
  // Appointment Settings
  autoApprove: {
    type: Boolean,
    default: false,
  },
  slotDuration: {
    type: Number,
    default: 30, // dakika
  },
  minAdvanceBooking: {
    type: Number,
    default: 2, // saat
  },
  maxAdvanceBooking: {
    type: Number,
    default: 30, // gün
  },
  allowCancellation: {
    type: Boolean,
    default: true,
  },
  cancellationDeadline: {
    type: Number,
    default: 24, // saat
  },
  allowSameDayBooking: {
    type: Boolean,
    default: true,
  },
  requireDeposit: {
    type: Boolean,
    default: false,
  },
  depositAmount: {
    type: Number,
    default: 0,
  },
  // Genel ayarlar için ek alanlar eklenebilir
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before saving
settingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Settings', settingsSchema);

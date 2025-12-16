const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const blockedTimeSchema = new Schema({
  // Tam gün kapalı mı yoksa sadece belirli saatler mi?
  type: {
    type: String,
    enum: ['full_day', 'time_range'],
    required: true,
  },
  // Kapalı olan tarih
  date: {
    type: Date,
    required: true,
  },
  // Sadece time_range için (opsiyonel)
  start_time: {
    type: String, // Format: "HH:mm" (örn: "14:00")
    required: function() {
      return this.type === 'time_range';
    }
  },
  end_time: {
    type: String, // Format: "HH:mm" (örn: "18:00")
    required: function() {
      return this.type === 'time_range';
    }
  },
  // Açıklama (opsiyonel)
  reason: {
    type: String,
    default: '',
  },
  // Tekrarlayan kapalılık mı? (örn: her pazar)
  is_recurring: {
    type: Boolean,
    default: false,
  },
  // Hangi gün tekrarlanacak (0=Pazar, 1=Pazartesi, ..., 6=Cumartesi)
  recurring_day: {
    type: Number,
    min: 0,
    max: 6,
  },
}, {
  timestamps: true,
});

// Index for faster queries
blockedTimeSchema.index({ date: 1, type: 1 });

const BlockedTime = mongoose.model('BlockedTime', blockedTimeSchema);

module.exports = BlockedTime;

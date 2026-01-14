const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const notificationSchema = new Schema({
  recipient_type: {
    type: String,
    enum: ['customer', 'admin'],
    required: true
  },
  recipient_id: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'recipient_type_model'
  },
  recipient_type_model: {
    type: String,
    enum: ['Customer', 'Staff'],
    required: function() {
      return this.recipient_type === 'customer' ? 'Customer' : 'Staff';
    }
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['appointment', 'reminder', 'cancellation', 'reschedule', 'review', 'general'],
    default: 'general'
  },
  data: {
    appointment_id: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    customer_id: { type: Schema.Types.ObjectId, ref: 'Customer' },
    customer_name: String,
    service_name: String,
    appointment_time: Date,
    review_id: { type: Schema.Types.ObjectId, ref: 'Review' },
  },
  is_read: {
    type: Boolean,
    default: false
  },
  push_sent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;

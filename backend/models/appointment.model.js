const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const appointmentSchema = new Schema({
  customer_id: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  service_id: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
  staff_id: { type: Schema.Types.ObjectId, ref: 'Staff', required: true },
  start_time: { type: Date, required: true },
  end_time: { type: Date, required: true },
  status: { type: String, required: true, enum: ['Beklemede', 'Onaylandı', 'İptal Edildi'], default: 'Beklemede' },
  verification_code: { type: String, required: false },
  is_verified: { type: Boolean, default: false },
}, {
  timestamps: true,
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;

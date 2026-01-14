const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const customerSchema = new Schema({
  name: { type: String, required: true },
  phone_number: { type: String, required: true, unique: true },
  email: { type: String, required: false },
  password: { type: String, required: false }, // Şimdilik zorunlu değil (eski kayıtlar için)
  is_admin: { type: Boolean, default: false },
  cancellation_count: { type: Number, default: 0 },
  birthdate: { type: Date, required: false },
  file_number: { type: String, required: false },
  tags: { type: [String], default: [] },
  is_banned: { type: Boolean, default: false },
  banned_reason: { type: String, required: false },
  loyalty_points: { type: Number, default: 0 },
  expo_push_token: { type: String, required: false }, // Push notification için
}, {
  timestamps: true,
});

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;

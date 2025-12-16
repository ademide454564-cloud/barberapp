const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const staffSchema = new Schema({
  name: { type: String, required: true },
  phone_number: { type: String, required: false },
  email: { type: String, required: false },
  specialties: [{ type: String }],
  profile_image: { type: String, required: false },
  is_active: { type: Boolean, default: true },
}, {
  timestamps: true,
});

const Staff = mongoose.model('Staff', staffSchema);

module.exports = Staff;

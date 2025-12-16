const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const verificationSchema = new Schema({
  phone_number: { type: String, required: true },
  code: { type: String, required: true },
  expires_at: { type: Date, required: true },
  verified: { type: Boolean, default: false },
}, {
  timestamps: true,
});

verificationSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

const Verification = mongoose.model('Verification', verificationSchema);

module.exports = Verification;

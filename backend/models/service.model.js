const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const serviceSchema = new Schema({
  name: { type: String, required: true },
  duration_minutes: { type: Number, required: true },
  price: { type: Number, required: true },
}, {
  timestamps: true,
});

const Service = mongoose.model('Service', serviceSchema);

module.exports = Service;

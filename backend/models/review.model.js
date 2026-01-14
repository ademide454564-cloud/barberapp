const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const reviewSchema = new Schema({
  customer_id: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  appointment_id: { type: Schema.Types.ObjectId },
  rating: { type: Number, required: true },
  comment: { type: String, default: '' },
  is_hidden: { type: Boolean, default: false },
}, {
  timestamps: true,
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;

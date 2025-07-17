// models/Rating.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const ratingSchema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    service_id: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, trim: true },
}, { timestamps: true });

// Prevent a user from rating the same service twice
ratingSchema.index({ user_id: 1, service_id: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);

// models/Service.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const workingHourSchema = new Schema({
    day: { type: String, required: true, trim: true },        // e.g. "Monday"
    start_time: { type: String, required: true, trim: true },        // e.g. "09:00"
    end_time: { type: String, required: true, trim: true },        // e.g. "17:00"
}, { _id: false });

const serviceSchema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category_id: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    price: { type: Number, required: true },
    duration: { type: Number, required: true },                    // in minutes
    location: { type: String, trim: true },
    experience: { type: Number, default: 0 },                        // in years
    working_hours: { type: [workingHourSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);

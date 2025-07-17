// models/Appointment.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const appointmentSchema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    service_id: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'pending'
    },
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);


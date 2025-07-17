// File: jobs/finalizeAppointments.js
const Appointment = require('../models/Appointment');

async function finalizePastAppointments() {
    const now = new Date();
    // Confirmed → completed
    await Appointment.updateMany(
        { date: { $lt: now }, status: 'confirmed' },
        { status: 'completed' }
    );
    // Pending → cancelled
    await Appointment.updateMany(
        { date: { $lt: now }, status: 'pending' },
        { status: 'cancelled' }
    );
}

module.exports = finalizePastAppointments;

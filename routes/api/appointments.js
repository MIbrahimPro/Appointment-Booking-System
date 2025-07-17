// routes/api/appointments.js
const express = require('express');
const mongoose = require('mongoose');
const { authenticateRequired } = require('../../middleware/auth');
const Appointment = require('../../models/Appointment');
const Rating = require('../../models/Rating');

const router = express.Router();




router.get('/', async (req, res) => {
    const { service_id } = req.query;

    let filter = {};
    if (service_id && mongoose.Types.ObjectId.isValid(service_id)) {
        filter.service_id = service_id;
    }

    try {
        const appointments = await Appointment.find(filter)
            .populate('user_id', 'name email image') // Optional: populate user info
            .sort({ date: -1, time: -1 });
        console.log("return from appointments api:", {appointments})
        res.json({ appointments });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Could not fetch appointments' });
    }
});












// POST /api/appointments
router.post('/', authenticateRequired, async (req, res) => {
    const { service_id, date, time } = req.body;
    console.log(service_id, date, time);


    // Validate
    if (!mongoose.Types.ObjectId.isValid(service_id)
        || !/^\d{4}-\d{2}-\d{2}$/.test(date)
        || !/^\d{2}:\d{2}$/.test(time)) {
        return res.status(400).json({ message: 'Invalid input' });
    }

    try {
        // Check for existing booking on that slot
        const exists = await Appointment.findOne({
            service_id, date, time,
            status: { $in: ['pending', 'confirmed'] }
        });
        if (exists) {
            return res.status(409).json({ message: 'Time slot already booked' });
        }

        // Create
        const appt = await Appointment.create({
            user_id: req.user._id,
            service_id,
            date,
            time,
            status: 'pending'
        });

        res.status(201).json({ appointment: appt });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Could not book appointment' });
    }
});


router.put('/:id', authenticateRequired, async (req, res) => {
    try {
        const appt = await Appointment.findOneAndUpdate(
            { _id: req.params.id },
            { status: req.body.status },
            { new: true }
        );
        if (!appt) return res.status(404).json({ message: 'Not weee sfound' });
        res.json({ appointment: appt });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});




router.post('/:id/review', authenticateRequired, async (req, res, next) => {
    try {
        const appt = await Appointment.findById(req.params.id);
        if (!appt) return res.status(404).json({ error: 'Appointment not found' });

        // only the user who booked it can review, and only completed ones in the past
        if (
            !appt.user_id.equals(req.user._id) ||
            appt.status !== 'completed' ||
            new Date(appt.date) > new Date()
        ) {
            return res.status(403).json({ error: 'Cannot review this appointment' });
        }

        // upsert rating so user can only leave one per service
        const ratingDoc = await Rating.findOneAndUpdate(
            { user_id: req.user._id, service_id: appt.service_id },
            { rating: req.body.rating, comment: req.body.comment },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        return res.json({ message: 'Review saved', review: ratingDoc });
    } catch (err) {
        next(err);
    }
});






module.exports = router;

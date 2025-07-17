// routes/client/appointments.js
const express = require('express');
const axios = require('axios');
const { authenticateRequired, authenticateOptional } = require('../../middleware/auth');
const router = express.Router();
const Appointment = require('../../models/Appointment');
const Service = require('../../models/Service');
const Category = require('../../models/Category');
const User = require('../../models/User');
const Rating = require('../../models/Rating');

const api = axios.create({ baseURL: process.env.BASEURL });


// GET /client/appointments
router.get('/', authenticateOptional,  async (req, res, next) => {
  // Optional auth: redirect if unauthenticated
  if (!req.user) {
    return res.redirect('/client/user/login');
  }

  try {
    // 1. Load this user's appointments
    const appointments = await Appointment.find({ user_id: req.user._id })
      .populate({
        path: 'service_id',
        populate: [
          { path: 'category_id' },
          { path: 'user_id', select: 'name image' }
        ]
      })
      .sort({ date: 1, time: 1 });

    // 2. Compute average rating per service
    const serviceIds = appointments.map(a => a.service_id._id);
    const avgResults = await Rating.aggregate([
      { $match: { service_id: { $in: serviceIds } } },
      { $group: { _id: '$service_id', avgRating: { $avg: '$rating' } } }
    ]);
    const avgMap = {};
    avgResults.forEach(r => {
      avgMap[r._id.toString()] = r.avgRating.toFixed(1);
    });

    // 3. Fetch this user's own reviews
    const userReviews = await Rating.find({
      user_id: req.user._id,
      service_id: { $in: serviceIds }
    }).lean();
    const reviewMap = {};
    userReviews.forEach(r => {
      reviewMap[r.service_id.toString()] = { rating: r.rating, comment: r.comment };
    });

    // 4. Enrich each appointment object
    const enriched = appointments.map(a => {
      const obj = a.toObject();
      const sid = a.service_id._id.toString();
      obj.avgRating = avgMap[sid] || null;
      obj.myReview  = reviewMap[sid]  || null;
      return obj;
    });

    res.render('pages/appointments', { appointments: enriched });
  } catch (err) {
    next(err);
  }
});
// POST /client/appointments
router.post('/', authenticateRequired, async (req, res) => {
    const { service_id, date, time } = req.body;
    try {
        await api.post('/appointments',
            { service_id, date, time },
            { headers: { Authorization: `Bearer ${req.session.token}` } }
        );
        res.redirect('/client/appointments');
    } catch (err) {
        console.error(err);
        // if conflict
        if (err.response?.status === 409) {
            req.flash('error', 'Time slot already booked');
        } else {
            req.flash('error', err.response?.data?.message || 'Booking failed');
        }
        // stay on the same details page
        res.redirect('back');
    }
});

module.exports = router;

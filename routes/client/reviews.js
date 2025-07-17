const express = require('express');
const router = express.Router();
const Service = require('../../models/Service');
const Rating = require('../../models/Rating');
const { authenticateOptional } = require('../../middleware/auth');

// GET /client/reviews/services/:id/
router.get('/services/:id', authenticateOptional, async (req, res, next) => {

    try {
        // 1. Load the service and its provider
        const service = await Service.findById(req.params.id)
            .populate({ path: 'user_id', select: 'name image' });
        if (!service) {
            return res.status(404).send('Service not found');
        }

        // 2. Fetch all ratings for this service, newest first
        const reviews = await Rating.find({ service_id: service._id })
            .populate({ path: 'user_id', select: 'name image' })
            .sort({ createdAt: -1 })
            .lean();

        // 3. Compute overall average
        const totalReviews = reviews.length;
        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = totalReviews ? (totalRating / totalReviews).toFixed(1) : null;

        // 4. Render the EJS view
        res.render('pages/ratings', {
            service,
            reviews,
            averageRating,
            totalReviews
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;

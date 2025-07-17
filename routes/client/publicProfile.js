const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const Service = require('../../models/Service');
const Category = require('../../models/Category');
const Rating = require('../../models/Rating');
const { authenticateOptional } = require('../../middleware/auth');

// GET /client/user/:id/profile
router.get('/:id/profile', authenticateOptional, async (req, res, next) => {


    try {
        // 1. Load public user (provider) info
        const provider = await User.findById(req.params.id)
            .select('name image location role email')
            .lean();
        if (!provider || provider.role !== 'user') {
            return res.status(404).send('User not found');
        }

        // 2. Fetch services by this provider
        const services = await Service.find({ user_id: provider._id })
            .populate('category_id')
            .lean();

        // 3. Compute average rating for each service
        const serviceIds = services.map(s => s._id);
        const agg = await Rating.aggregate([
            { $match: { service_id: { $in: serviceIds } } },
            { $group: { _id: '$service_id', avgRating: { $avg: '$rating' } } }
        ]);
        const avgMap = {};
        agg.forEach(a => avgMap[a._id.toString()] = a.avgRating.toFixed(1));

        // 4. Attach avgRating and isFavorite (if you have favorites logic)
        const enrichedServices = services.map(s => ({
            ...s,
            avgRating: avgMap[s._id.toString()] || null,
            // isFavorite: req.user.favorites?.includes(s._id) || false
            isFavorite: req.user && req.user.favorites
                ? req.user.favorites.includes(s._id)
                : false
        }));

        res.render('pages/publicProfile', {
            provider,
            services: enrichedServices
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;

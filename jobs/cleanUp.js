
const Appointment = require('../models/Appointment');
const Rating = require('../models/Rating');
const Service = require('../models/Service');
const User = require('../models/User');
const Category = require('../models/Category');

// Cleanup middleware: runs on every request
async function cleaner(req, res, next) {
    try {
        // 1. Delete appointments with missing user or service
        await Appointment.deleteMany({
            $or: [
                { user_id: { $nin: await User.distinct('_id') } },
                { service_id: { $nin: await Service.distinct('_id') } }
            ]
        });

        // 2. Delete ratings with missing user or service
        await Rating.deleteMany({
            $or: [
                { user_id: { $nin: await User.distinct('_id') } },
                { service_id: { $nin: await Service.distinct('_id') } }
            ]
        });

        // 3. Delete services with missing category
        await Service.deleteMany({
            category_id: { $nin: await Category.distinct('_id') }
        });

        console.log("clean data")
        next();
    } catch (err) {
        console.error('Cleanup middleware error:', err);
        next(); // Don't block the request if cleanup fails
    }
};


module.exports = cleaner;

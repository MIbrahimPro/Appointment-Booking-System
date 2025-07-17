// routes/api/services.js
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const Service = require('../../models/Service');
const Appointment = require('../../models/Appointment');
const { authenticateRequired } = require('../../middleware/auth');
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;




router.get('/', async (req, res) => {
    const {
        search = '',
        category = 'all',
        location = '',
        page = 1,
        limit = 9,
        favorites = 'false'
    } = req.query;

    // Build base match
    const match = {};
    if (search) {
        match.name = { $regex: search, $options: 'i' };
    }
    if (category !== 'all' && mongoose.Types.ObjectId.isValid(category)) {
        match.category_id = new mongoose.Types.ObjectId(category);
    }
    if (location) {
        match.location = { $regex: location, $options: 'i' };
    }

    // Authenticate user to get favorites
    let favoriteIds = [];
    const favOnly = favorites === 'true';
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/, '');
    if (token) {
        try {
            const payload = jwt.verify(token, JWT_SECRET);
            const user = await User.findById(payload._id).select('favorites');
            favoriteIds = user?.favorites.map(f => f.toString()) || [];
            if (favOnly) {
                // Only show favorites
                match._id = { $in: user.favorites };
            }
        } catch (e) {
            // invalid token or user not found → ignore favorites
        }
    }

    try {
        const total = await Service.countDocuments(match);

        const servicesAgg = await Service.aggregate([
            { $match: match },
            // ratings lookup
            {
                $lookup: {
                    from: 'ratings',
                    localField: '_id',
                    foreignField: 'service_id',
                    as: 'ratings'
                }
            },
            { $addFields: { avgRating: { $avg: '$ratings.rating' } } },
            // category lookup
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category_id',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            { $unwind: '$category' },
            // provider lookup
            {
                $lookup: {
                    from: 'users',
                    localField: 'user_id',
                    foreignField: '_id',
                    as: 'provider'
                }
            },
            { $unwind: '$provider' },
            // pagination
            { $skip: (Number(page) - 1) * Number(limit) },
            { $limit: Number(limit) },
            // project
            {
                $project: {
                    _id: 1,
                    name: 1,
                    details: '$description',
                    price: 1,
                    location: 1,
                    experience: 1,
                    avgRating: 1,
                    'category._id': 1,
                    'category.name': 1,
                    'category.icon': 1,
                    'category.color': 1,
                    providerImage: '$provider.image',
                    username: '$provider.name'
                }
            }
        ]);


        // Shape and attach isFavorite
        const services = servicesAgg.map(s => {
            const base = {
                _id: s._id,
                name: s.name,
                details: s.details,
                price: s.price,
                location: s.location,
                avgRating: s.avgRating || 0,
                category: {
                    _id: s.category._id,
                    name: s.category.name,
                    icon: s.category.icon,
                    color: s.category.color
                },
                image: s.providerImage || null,
                username: s.username
            };
            return {
                ...base,
                isFavorite: favoriteIds.includes(s._id.toString())
            };
        });

        res.json({
            services,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit))
            }
        });
    } catch (err) {
        console.error('GET /api/services error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});





// GET /api/services/mine
router.get('/mine', authenticateRequired, async (req, res) => {
    try {
        const userId = req.user._id;
        const services = await Service.aggregate([
            { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
            {
                $lookup: {
                    from: 'ratings',
                    localField: '_id',
                    foreignField: 'service_id',
                    as: 'ratings'
                }
            },
            {
                $addFields: {
                    avgRating: {
                        $cond: [
                            { $gt: [{ $size: '$ratings' }, 0] },
                            { $avg: '$ratings.rating' },
                            null
                        ]
                    }
                }
            },
            {
                $project: {
                    name: 1, description: 1, category_id: 1,
                    price: 1, duration: 1, location: 1, experience: 1,
                    avgRating: 1, working_hours: 1
                }
            }
        ]);
        // console.log("\n\n\n\n\n\n\n\n\n\n\n =========================================\nservices return :", { services: services.map(s => ({ ...s, rating: s.avgRating })) }, "\n\n\n\n\n\n\n\n\n\n\n =========================================\n")
        res.json({ services: services.map(s => ({ ...s, rating: s.avgRating })) });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server error' });
    }
});


















// GET /api/services/:id
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid service ID' });
    }
    try {
        const [s] = await Service.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(id) } },
            {
                $lookup: {
                    from: 'ratings',
                    localField: '_id',
                    foreignField: 'service_id',
                    as: 'ratings'
                }
            },
            { $addFields: { avgRating: { $avg: '$ratings.rating' } } },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category_id',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            { $unwind: '$category' },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user_id',
                    foreignField: '_id',
                    as: 'provider'
                }
            },
            { $unwind: '$provider' },
            // <-- include duration ---
            {
                $project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    price: 1,
                    location: 1,
                    duration: 1,
                    experience: 1,
                    working_hours: 1,
                    avgRating: 1,
                    category_id: '$category._id',
                    'category._id': 1, 'category.name': 1, 'category.icon': 1, 'category.color': 1,
                    'provider._id': 1, 'provider.name': 1, 'provider.image': 1
                }
            }
        ]);
        if (!s) return res.status(404).json({ message: 'Not found' });
        console.log(s.category)
        res.json({
            service: {
                _id: s._id,
                name: s.name,
                description: s.description,
                price: s.price,
                location: s.location,
                duration: s.duration,
                experience: s.experience,
                working_hours: s.working_hours,
                avgRating: s.avgRating || 0,
                category: s.category,
                provider: {
                    _id: s.provider._id,
                    name: s.provider.name,
                    image: s.provider.image
                }
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});




// GET /api/services/:id/availability?date=YYYY-MM-DD
router.get('/:id/availability', async (req, res) => {
    const { id } = req.params;
    const { date } = req.query; // ISO yyyy-mm-dd
    console.log("\n\n\n\n\n\n\n\n\n availability route")
    console.log("id", id);
    console.log("date", date);


    if (!mongoose.Types.ObjectId.isValid(id) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        console.log("invalid service or date")
        return res.status(400).json({ message: 'Invalid service or date' });
    }

    // 1) Load service working_hours
    const svc = await Service.findById(id).select('working_hours duration').lean();
    if (!svc) {
        console.log("not found")
        return res.status(404).json({ message: 'Not found' });
    }

    console.log(svc)
    // find the provider’s schedule for that weekday
    const weekday = new Date(date).toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
    console.log(weekday || "no weekend");
    const wh = svc.working_hours.find(w => w.day.toLowerCase() === weekday);
    console.log(wh || "no wh");

    if (!wh) {
        console.log("empty ")
        return res.json({ slots: [] });
    }

    // 2) generate all potential slots
    const [h0, m0] = wh.start_time.split(':').map(Number);
    const [h1, m1] = wh.end_time.split(':').map(Number);
    const duration = svc.duration; // in minutes
    const slots = [];
    let t = new Date(`${date}T${wh.start_time}:00`);
    const end = new Date(`${date}T${wh.end_time}:00`);
    while (t < end) {
        slots.push(t.toTimeString().slice(0, 5)); // "HH:MM"
        t = new Date(t.getTime() + duration * 60000);
    }

    // 3) fetch already‐booked appointments for that service/date
    const appts = await Appointment.find({
        service_id: id,
        date: date,
        status: { $in: ['pending', 'confirmed'] }
    }).select('time').lean();
    const booked = new Set(appts.map(a => a.time));

    // 4) return with disabled flag
    const result = slots.map(time => ({
        time,
        disabled: booked.has(time)
    }));

    console.log("result", result);

    res.json({ slots: result });
});




const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;


// POST /api/services/
router.post('/', authenticateRequired, async (req, res) => {
    const {
        name,
        description,
        category_id,
        price,
        duration,
        location,
        experience,
        working_hours
    } = req.body;

    const errors = [];

    // --- Simple inline checks ---
    if (!name || !name.trim()) {
        errors.push('Name is required.');
    }

    if (!category_id || !mongoose.Types.ObjectId.isValid(category_id)) {
        errors.push('Valid category_id is required.');
    }

    if (price == null || typeof price !== 'number' || price <= 0) {
        errors.push('Price must be a positive number.');
    }

    if (duration == null || !Number.isInteger(duration) || duration <= 0) {
        errors.push('Duration must be an integer > 0.');
    }

    if (experience != null && (!Number.isInteger(experience) || experience < 0)) {
        errors.push('Experience, if provided, must be a non-negative integer.');
    }

    if (working_hours != null) {
        if (!Array.isArray(working_hours)) {
            errors.push('working_hours must be an array.');
        } else {
            working_hours.forEach((wh, idx) => {
                const { day, start_time, end_time } = wh;
                if (!day || !DAYS.includes(day)) {
                    errors.push(`working_hours[${idx}].day must be one of ${DAYS.join(', ')}.`);
                }
                if (!start_time || !TIME_REGEX.test(start_time)) {
                    errors.push(`working_hours[${idx}].start_time must be HH:MM in 24h.`);
                }
                if (!end_time || !TIME_REGEX.test(end_time)) {
                    errors.push(`working_hours[${idx}].end_time must be HH:MM in 24h.`);
                }
                // compare times
                if (TIME_REGEX.test(start_time) && TIME_REGEX.test(end_time)) {
                    const [sh, sm] = start_time.split(':').map(Number);
                    const [eh, em] = end_time.split(':').map(Number);
                    if (sh * 60 + sm >= eh * 60 + em) {
                        errors.push(
                            `working_hours[${idx}]: start_time (${start_time}) must be before end_time (${end_time}).`
                        );
                    }
                }
            });
        }
    }

    // If any errors, stop here:
    if (errors.length) {
        return res.status(400).json({ errors });
    }

    // --- All good: create the service ---
    try {
        const svc = await Service.create({
            user_id: req.user._id,
            name: name.trim(),
            description: description?.trim(),
            category_id,
            price,
            duration,
            location: location?.trim(),
            experience,
            working_hours
        });
        return res.status(201).json({ service: svc });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error. Try again later.' });
    }
});


// PUT update /api/services/:id

router.put('/:id', authenticateRequired, async (req, res) => {
    const { name, description, category_id, price,
        duration, location, experience, working_hours } = req.body;
    const errors = [];

    // --- exactly the same inline checks as in POST ---
    if (!name || !name.trim()) errors.push('Name is required.');
    if (!category_id || !mongoose.Types.ObjectId.isValid(category_id))
        errors.push('Valid category_id is required.');
    if (typeof price !== 'number' || price <= 0)
        errors.push('Price must be a positive number.');
    if (!Number.isInteger(duration) || duration <= 0)
        errors.push('Duration must be an integer > 0.');
    if (experience != null && (!Number.isInteger(experience) || experience < 0))
        errors.push('Experience must be a non-negative integer.');
    if (working_hours != null) {
        if (!Array.isArray(working_hours)) {
            errors.push('working_hours must be an array.');
        } else {
            working_hours.forEach((wh, idx) => {
                if (!wh.day || !DAYS.includes(wh.day))
                    errors.push(`working_hours[${idx}].day invalid.`);
                if (!TIME_REGEX.test(wh.start_time))
                    errors.push(`working_hours[${idx}].start_time invalid.`);
                if (!TIME_REGEX.test(wh.end_time))
                    errors.push(`working_hours[${idx}].end_time invalid.`);
                // time order
                const [sh, sm] = (wh.start_time || '00:00').split(':').map(Number);
                const [eh, em] = (wh.end_time || '00:00').split(':').map(Number);
                if (sh * 60 + sm >= eh * 60 + em)
                    errors.push(`working_hours[${idx}]: start must be before end.`);
            });
        }
    }

    if (errors.length) {
        return res.status(400).json({ errors });
    }

    try {
        const svc = await Service.findOneAndUpdate(
            { _id: req.params.id, user_id: req.user._id },
            {
                name: name.trim(),
                description: description?.trim(),
                category_id, price, duration,
                location: location?.trim(),
                experience, working_hours
            },
            { new: true }
        );
        if (!svc) return res.status(404).json({ message: 'Service not found' });
        return res.json({ service: svc });
    } catch (err) {
        console.error('PUT /api/services error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// DELETE
router.delete('/:id', authenticateRequired, async (req, res) => {
    console.log('[API] DELETE /api/services/' + req.params.id + ' start');
    try {
        const svc = await Service.findOneAndDelete({ _id: req.params.id, user_id: req.user._id });
        if (!svc) return res.status(404).json({ message: 'Not found' });
        console.log('[API] deleted service', svc._id);
        res.json({ message: 'Deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
    console.log('[API] DELETE /api/services/' + req.params.id + ' end');
});







module.exports = router;

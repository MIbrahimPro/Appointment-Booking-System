const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const User = require('../../models/User');
const { authenticateRequired } = require('../../middleware/auth');

// Toggle favorite: POST or DELETE
router.post('/:serviceId', authenticateRequired, async (req, res) => {
    const { serviceId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
        return res.status(400).json({ message: 'Invalid service ID' });
    }

    const idx = req.user.favorites.findIndex(f => f.equals(serviceId));
    if (idx >= 0) {
        // already favorite → remove
        req.user.favorites.splice(idx, 1);
    } else {
        // add to front
        req.user.favorites.unshift(serviceId);
    }
    await req.user.save();
    res.json({ favorites: req.user.favorites });
});

// List favorites
router.get('/', authenticateRequired, async (req, res) => {
    res.json({ favorites: req.user.favorites });
});

module.exports = router;




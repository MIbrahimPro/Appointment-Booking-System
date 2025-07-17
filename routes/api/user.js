const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../../models/User');
const { authenticateRequired, requireAdmin } = require('../../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d';

// POST /api/user/signup
router.post('/signup', async (req, res) => {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password || !phone) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    try {
        if (await User.findOne({ email })) {
            return res.status(400).json({ message: 'Email already in use' });
        }
        const hash = await bcrypt.hash(password, 10);
        const user = await User.create({
            name, email,
            password: hash,
            phone
        });
        const token = jwt.sign({ _id: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        res.json({
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                image: user.image,
                location: user.location
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/user/login
router.post('/login', async (req, res) => {
    // console.log('Login request body:', req.body);
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Missing email or password' });
    }
    try {
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = jwt.sign({ _id: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        res.json({
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                image: user.image,
                location: user.location
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT /api/user/image
const { uploadUserImage } = require('../../middleware/upload');
router.put('/image', authenticateRequired, uploadUserImage, async (req, res) => {
    try {
        if (req.file) {
            req.user.image = `/uploads/users/${req.file.filename}`;
            await req.user.save();
        }
        res.json({ image: req.user.image });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT /api/user/       (update profile fields)
router.put('/', authenticateRequired, async (req, res) => {
    const { name, phone, location } = req.body;
    if (name) req.user.name = name;
    if (phone) req.user.phone = phone;
    if (location) req.user.location = location;
    try {
        await req.user.save();
        res.json({ user: req.user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/user/me
router.get('/me', authenticateRequired, (req, res) => {
    const { password, ...user } = req.user.toObject();
    res.json({ user });
});

// PUT /api/user/change-password
router.put('/change-password', authenticateRequired, async (req, res) => {
    console.log('Change password request bod123y:', req.body);
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: 'Old and new passwords required' });
    }
    try {
        // Fetch user with password field included
        const user = await User.findById(req.user._id).select('+password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (!(await bcrypt.compare(oldPassword, user.password))) {
            return res.status(401).json({ message: 'Old password incorrect' });
        }
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        console.log('Password changed successfully');
        res.json({ message: 'Password changed' });
    } catch (err) {
        console.error('Error changing password:', err);
        res.status(500).json({ message: err.message });
    }
});

// ADMIN ONLY

// GET /api/user/all
router.get('/all', authenticateRequired, requireAdmin, async (req, res) => {
    const users = await User.find().select('-password');
    res.json({ users });
});

// PUT /api/user/role/:id
router.put('/role/:id', authenticateRequired, requireAdmin, async (req, res) => {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
    }
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        user.role = role;
        await user.save();
        res.json({ user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE /api/user/:id
router.delete('/:id', authenticateRequired, requireAdmin, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;

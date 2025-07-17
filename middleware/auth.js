// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('Please set JWT_SECRET environment variable');
}

/**
 * Try to read a token from req.session.token (or req.headers.authorization).
 * If valid, attach req.user = { _id, role, ... }.
 */
async function _attachUser(req, res) {
    const token = req.session?.token
        || (req.headers.authorization || '').replace(/^Bearer\s+/, '');
    if (!token) return;

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        // payload contains at least { _id }
        const user = await User.findById(payload._id).select('-password');
        if (user) {
            req.user = user;
        }
    } catch (err) {
        // invalid token; ignore
    }
}

/**
 * 1) authenticateOptional
 *    If logged in, attaches req.user. Always calls next().
 */
async function authenticateOptional(req, res, next) {
    await _attachUser(req, res);
    next();
}

/**
 * 2) authenticateRequired
 *    Requires a valid token & user. Otherwise 401.
 */
async function authenticateRequired(req, res, next) {
    await _attachUser(req, res);
    if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    next();
}

/**
 * 3) requireAdmin
 *    Must be logged in AND have role === 'admin'
 */
async function requireAdmin(req, res, next) {
    await _attachUser(req, res);
    if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin privileges required' });
    }
    next();
}

module.exports = {
    authenticateOptional,
    authenticateRequired,
    requireAdmin,
};

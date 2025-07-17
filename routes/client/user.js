const express = require('express');
const axios = require('axios');
const router = express.Router();
const multer = require('multer');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const {
    authenticateOptional,
    authenticateRequired
} = require('../../middleware/auth');
const { uploadUserImage } = require('../../middleware/upload');

const api = axios.create({
    baseURL: process.env.BASEURL, // e.g. 'http://localhost:5000/api'
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});


// GET /client/user/login
router.get('/login', authenticateOptional, (req, res) => {
    if (req.user) {
        return res.redirect('/client/user/profile');
    }
    res.render('pages/login', { error: req.query.error });
});


// GET /client/user/signup
router.get('/signup', authenticateOptional, (req, res) => {
    if (req.user) {
        return res.redirect('/client/user/profile');
    }
    res.render('pages/signup', { error: req.query.error });
});

// POST /client/user/login
router.post('/login', async (req, res) => {
    try {
        // console.log('Login request body:', req.body);
        const { data } = await api.post('/user/login', req.body);
        req.session.token = data.token;
        res.redirect('/client/user/profile');
    } catch (err) {
        console.error('Login error:', err.response.data.message);
        console.error('link error:', '/client/user/login?error=' + encodeURIComponent(err.response.data.message));
        res.redirect('/client/user/login?error=' + encodeURIComponent(err.response.data.message));
    }
});

// POST /client/user/signup
router.post('/signup', async (req, res) => {
    try {
        console.log('Signup request body:', req.body);
        const { data } = await api.post('/user/signup', req.body);
        req.session.token = data.token;
        res.redirect('/client/user/profile');
    } catch (err) {
        console.error('Signup error:', err.response.data.message);
        console.error('link error:', '/client/user/signup?error=' + encodeURIComponent(err.response.data.message));
        res.redirect('/client/user/signup?error=' + encodeURIComponent(err.response.data.message));
    }
});

// GET /client/user/profile (protected)
router.get('/profile', authenticateOptional, async (req, res) => {
    if (!req.user) {
        return res.redirect('/client/user/login');
    }
    try {
        const { data } = await api.get('/user/me', {
            headers: { Authorization: `Bearer ${req.session.token}` }
        });
        res.render('pages/profile', { user: data.user, session: req.session });
    } catch {
        return res.redirect('/client/user/login');
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        res.redirect('/client/user/login');
    });
});

router.put(
    '/profile/image',
    authenticateRequired,
    uploadUserImage,
    async (req, res) => {
        try {
            const form = new FormData();
            form.append('image', fs.createReadStream(req.file.path));
            await api.put('/user/image', form, {
                headers: {
                    ...form.getHeaders(),
                    Authorization: `Bearer ${req.session.token}`
                }
            });
            fs.unlinkSync(req.file.path);
            res.redirect('/client/user/profile');
        } catch (e) {
            console.error(e);
            res.redirect('/client/user/profile?error=upload');
        }
    }
);

// PUT  /client/user/profile
// proxy for name/phone/location
router.put(
    '/profile',
    authenticateRequired,
    async (req, res) => {
        try {
            await api.put(
                '/user',
                req.body,
                { headers: { Authorization: `Bearer ${req.session.token}` } }
            );
            res.redirect('/client/user/profile');
        } catch (e) {
            console.error(e);
            res.redirect('/client/user/profile?error=update');
        }
    }
);

router.get(
    '/change-password',
    authenticateRequired,
    (req, res) => {
        res.render('pages/change-password', {
            session: req.session
        });
    }
);

router.put(
    '/change-password',
    authenticateRequired,
    async (req, res) => {
        console.log('Change password request body:', req.body);
        try {
            await api.put(
                '/user/change-password',
                {
                    oldPassword: req.body.oldPassword,
                    newPassword: req.body.newPassword
                },
                { headers: { Authorization: `Bearer ${req.session.token}` } }
            );
            console.log('doneeee', req.body);

            // on success, bounce back to profile
            res.redirect('/client/user/profile?msg=password_changed');
        } catch (err) {
            console.log('erorreeeeeeeeeeee', err.response?.data?.message);

            // pass error message via query or flash
            const msg = encodeURIComponent(err.response?.data?.message || 'Change failed');
            res.redirect('/client/user/change-password?error=' + msg);
        }
    }
);

module.exports = router;

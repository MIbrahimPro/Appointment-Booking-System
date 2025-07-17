// routes/client/services.js
const express = require('express');
const axios = require('axios');
const { authenticateOptional } = require('../../middleware/auth');
const router = express.Router();

const api = axios.create({ baseURL: process.env.BASEURL });

router.get(
    '/',
    authenticateOptional,
    async (req, res) => {
        const {
            search = '',
            category = 'all',
            location = '',
            page = 1,
            favorites = 'false'
        } = req.query;

        try {
            const catsRes = await api.get('/categories');
            const categories = catsRes.data.categories;

            const { data } = await api.get('/services', {
                params: { search, category, location, page, limit: 18, favorites },
                headers: req.user ? { Authorization: `Bearer ${req.session.token}` } : {}
            });

            console.log("Data", data)

            // inject cardBgColor & sort
            let services = data.services.map(svc => {
                const [h, sat] = svc.category.color.match(/\d+/g).map(Number);
                return { ...svc, cardBgColor: `hsl(${h}, ${sat}%, 95%)` };
            });

            // if not filtering only favorites, sort favorites to top
            if (favorites !== 'true') {
                services.sort((a, b) => (b.isFavorite === true) - (a.isFavorite === true));
            }

            console.log("Services", services)
            // console.log("\n\n\n\n\n\n\n\n", req.baseURL, "\n\n\n\n\n\n\n\n")
            res.render('pages/services', {
                user: req.user || null,
                categories,
                services,
                pagination: data.pagination,
                filters: { search, category: category || 'all', location, favorites: favorites === 'true' },
                baseUrl: req.baseUrl
            });
        } catch (err) {
            console.error(err);
            res.render('pages/services', {
                user: req.user || null,
                categories: [],
                services: [],
                pagination: { total: 0, page: 1, pages: 1 },
                filters: { search: '', category: 'all', location: '', favorites: false },
                error: 'Could not load services',
                baseUrl: req.baseUrl

            });
        }
    }
);

// Toggle favorite
router.post(
    '/favorite/:id',
    authenticateOptional,
    async (req, res) => {
        if (!req.user) {
            return res.redirect('/client/user/login');
        }
        try {
            await api.post(
                `/favorites/${req.params.id}`,
                {},
                { headers: { Authorization: `Bearer ${req.session.token}` } }
            );
        } catch (e) {
            console.error(e);
        }
        // rebuild URL to stay on this page
        const { search = '', category = 'all', location = '', page = 1, favorites = 'false' } = req.query;
        let url = `/client/services?search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}&location=${encodeURIComponent(location)}&page=${page}`;
        if (favorites === 'true') url += `&favorites=true`;
        res.redirect(url);
    }
);


router.get('/:id', authenticateOptional, async (req, res) => {
    try {
        const id = req.params.id;
        // 1) fetch service data
        const svcRes = await api.get(`/services/${id}`, {
            headers: req.user
                ? { Authorization: `Bearer ${req.session.token}` }
                : {}
        });
        const service = svcRes.data.service;

        // 2) derive favorite state from req.user.favorites
        service.isFavorite = req.user
            ? req.user.favorites.some(f => f.toString() === id)
            : false;

        // 3) build next week’s only‐working‐days
        const workingDays = service.working_hours.map(w =>
            w.day.toLowerCase().slice(0, 3)
        );
        const dates = [];
        let d = new Date();
        d.setDate(d.getDate() + 1);
        while (dates.length < workingDays.length) {
            const short = d.toLocaleString('en-US', { weekday: 'short' }).toLowerCase();
            if (workingDays.includes(short)) dates.push(new Date(d));
            d.setDate(d.getDate() + 1);
        }

        res.render('pages/service-details', {
            user: req.user || null,
            service,
            dates,
            baseUrl: req.baseUrl  // "/client/services"
        });
    } catch (err) {
        console.error(err);
        res.redirect('/client/services');
    }
});


module.exports = router;

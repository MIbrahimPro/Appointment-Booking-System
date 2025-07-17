const express = require('express');
const { authenticateOptional } = require('../../middleware/auth');
const router = express.Router();

const axios = require('axios');


const api = axios.create({ baseURL: process.env.BASEURL });

router.get('/', authenticateOptional, async (req, res) => {
    if (!req.user) {
        return res.redirect('/client/user/login');
    }
    try {
        const [cats, svcs] = await Promise.all([
            api.get('/categories'),
            api.get('/services/mine', {
                headers: { Authorization: `Bearer ${req.session.token}` }
            })
        ]);

        res.render('pages/manage-services', {
            user: req.user,
            categories: cats.data.categories,
            // services are fetched client‑side, so we just need categories here
        });
    } catch (err) {
        console.error(err);
        res.render('pages/manage-services', {
            user: req.user,
            categories: []
        });
    }
});

router.get('/create', authenticateOptional, async (req, res) => {
    if (!req.user) {
        return res.redirect('/client/user/login');
    }

    try {
        const [cats] = await Promise.all([
            api.get('/categories')
        ]);

        res.render('pages/createService', {
            user: req.user,
            categories: cats.data.categories,
        });
    } catch (err) {
        console.error(err);
        res.render('pages/createService', {
            user: req.user,
            categories: []
        });
    }

});



router.get('/edit/:id', authenticateOptional, async (req, res) => {
    if (!req.user) return res.redirect('/client/user/login');

    const serviceId = req.params.id;

    try {
        const [svcResp, catsResp] = await Promise.all([
            api.get(`/services/${serviceId}`),
            api.get(`/categories`)
        ]);

        const service = svcResp.data.service;

        console.log("\n\n\n\n\nservice user id:", String(service.provider._id), "\n\n REQ User id:", String(req.user._id), "\n\n\n\n\n")

        if (!service || String(service.provider._id) !== String(req.user._id)) {
            return res.redirect('/client/services/manage');
        }

        res.render('pages/editService', {
            user: req.user,
            service,
            categories: catsResp.data.categories
        });
    } catch (err) {

        console.error('Error loading edit page:', err);
        res.redirect('/client/services/manage');
    }
});



router.get('/requests/:id', authenticateOptional, async (req, res) => {
    if (!req.user) return res.redirect('/client/user/login');

    const serviceId = req.params.id;

    try {
        const [svcResp, apptResp] = await Promise.all([
            api.get(`/services/${serviceId}`),
            api.get(`/appointments?service_id=${serviceId}`, {
                headers: { Authorization: `Bearer ${req.session.token}` }
            })
        ]);

        const service = svcResp.data.service;


        if (!service || String(service.provider._id) !== String(req.user._id)) {
            console.log("not your servce?");
            return res.redirect('/client/services/manage');
        }

        console.log("\n\n\n\n\n\n\n",
            req.user,
            service,
            apptResp.data.appointments,
            "\n\n\n\n\n\n\n\n"

        )
        res.render('pages/reqService', {
            user: req.user,
            service,
            appointments: apptResp.data.appointments
        });
    } catch (err) {
        console.error('Error loading edit page:', err);
        res.redirect('/client/services/manage');
    }
});

module.exports = router;
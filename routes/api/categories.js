const express = require('express');
const router = express.Router();
const Category = require('../../models/Category');
const { authenticateRequired, requireAdmin } = require('../../middleware/auth');

// GET /api/categories
// Returns all categories (no pagination since it’s usually a small list)
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find().sort('name').lean();
        res.json({ categories });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// (Optional) Admin‐only: Create a new category
// POST /api/categories
// body: { name, icon, color }
router.post('/', authenticateRequired, requireAdmin, async (req, res) => {
    try {
        const cat = await Category.create(req.body);
        res.status(201).json({ category: cat });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// (Optional) Admin‐only: Update a category
// PUT /api/categories/:id
router.put('/:id', authenticateRequired, requireAdmin, async (req, res) => {
    try {
        const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!cat) return res.status(404).json({ message: 'Not found' });
        res.json({ category: cat });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// (Optional) Admin‐only: Delete a category
// DELETE /api/categories/:id
router.delete('/:id', authenticateRequired, requireAdmin, async (req, res) => {
    try {
        await Category.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;

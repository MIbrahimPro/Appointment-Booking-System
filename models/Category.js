// models/Category.js
const mongoose = require('mongoose');
const { Schema } = mongoose;
const imageCleanup = require("../middleware/imageCleanup");

const categorySchema = new Schema({
    name: { type: String, required: true, trim: true },
    icon: { type: String, trim: true },
    color: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: v => /^hsl\(\s*\d+,\s*\d+%,\s*(6[5-9]|[7-9]\d|100)%\s*\)$/.test(v),
            message: props => `${props.value} is not a valid HSL color with L ≥ 65%`
        }
        
    },
}, { timestamps: true });

categorySchema.plugin(imageCleanup, { field: "icon", folder: "icons" });

module.exports = mongoose.model('Category', categorySchema);

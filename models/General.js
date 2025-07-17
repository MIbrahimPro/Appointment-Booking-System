// models/General.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const generalSchema = new Schema({
    contactEmail: { type: String, trim: true },
    contactPhone: { type: String, trim: true },
    contactAddress: { type: String, trim: true },
    Instagram: { type: String, trim: true },
    Facebook: { type: String, trim: true },
    Twitter: { type: String, trim: true },
}, { timestamps: true });

module.exports = mongoose.model('General', generalSchema);

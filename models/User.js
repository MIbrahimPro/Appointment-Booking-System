// models/User.js
const mongoose = require('mongoose');
const { Schema } = mongoose;
const imageCleanup = require("../middleware/imageCleanup");

const userSchema = new Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    image: { type: String, trim: true },
    password: { type: String, required: true },
    phone: { type: String, trim: true },
    location: { type: String, trim: true, default: 'Unset' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    favorites: [{
        type: Schema.Types.ObjectId,
        ref: 'Service'
    }],
}, { timestamps: true });


userSchema.plugin(imageCleanup, { field: "image", folder: "users" });


module.exports = mongoose.model('User', userSchema);

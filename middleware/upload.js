// middleware/upload.js
const multer = require('multer');
const fs = require('fs');
const path = require('path');

/**
 * Ensure a directory exists; if not, create it (recursive).
 */
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

/**
 * Factory to create a multer middleware for a given folder & fieldname.
 * @param {string} folderName  e.g. 'icons', 'services', 'users'
 * @param {string} fieldName   the form-field name, e.g. 'icon', 'photos'
 * @param {Object} opts        { array: boolean, maxCount: number }
 */
function makeUpload(folderName, fieldName, opts = {}) {
    const uploadPath = path.join(__dirname, '..', 'uploads', folderName);
    ensureDir(uploadPath);

    const storage = multer.diskStorage({
        destination(req, file, cb) {
            cb(null, uploadPath);
        },
        filename(req, file, cb) {
            // e.g. icon-1627381923.png
            const ext = path.extname(file.originalname);
            const name = `${fieldName}-${Date.now()}${ext}`;
            cb(null, name);
        }
    });

    const middleware = multer({ storage });

    if (opts.array) {
        return middleware.array(fieldName, opts.maxCount || 5);
    } else {
        return middleware.single(fieldName);
    }
}

module.exports = {
    // category icons: field name = "icon"
    uploadCategoryIcon: makeUpload('icons', 'icon'),

    // user profile images: field name = "image"
    uploadUserImage: makeUpload('users', 'image'),

    // service photos: field name = "photos", up to 10 files
    uploadServicePhotos: makeUpload('services', 'photos', { array: true, maxCount: 10 }),
};

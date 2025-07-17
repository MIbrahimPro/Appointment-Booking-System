// middlewares/imageCleanup.js
const fs = require("fs");
const path = require("path");

/**
 * Mongoose plugin: automatically delete the old file on:
 *  • findOneAndDelete  → remove the document’s file
 *  • findOneAndUpdate  → if update[field] exists, remove the old file
 *
 * options:
 *  – field:  name of the schema property (e.g. 'imageUrl', 'videoUrl', 'pictureUrl')
 *  – folder: subfolder under /uploads (e.g. 'items', 'gallery', etc.)
 */
function imageCleanup(schema, options) {
    const { field, folder } = options;

    // helper to unlink, swallowing errors
    function tryUnlink(filename) {
        if (!filename) return;
        const file = path.join(__dirname, "../uploads", folder, filename);
        fs.unlink(file, () => { });
    }

    // BEFORE delete: grab doc, delete its file
    schema.pre("findOneAndDelete", async function (next) {
        const doc = await this.model.findOne(this.getFilter());
        if (doc) tryUnlink(doc[field]);
        next();
    });

    // BEFORE update: if the update contains a new file, delete the old one
    schema.pre("findOneAndUpdate", async function (next) {
        const upd = this.getUpdate();
        // if user is uploading a new filename
        if (upd[field]) {
            const doc = await this.model.findOne(this.getFilter());
            if (doc) tryUnlink(doc[field]);
        }
        next();
    });
}

module.exports = imageCleanup;

// middlewares/logger.js
function requestLogger(req, res, next) {
    console.log(`\n--- API Request ---`);
    console.log(`Method:    ${req.method}`);
    console.log(`URL:       ${req.originalUrl}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    next();
}

module.exports = requestLogger;



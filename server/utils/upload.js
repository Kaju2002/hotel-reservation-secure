// middleware/upload.js or utils/upload.js
const multer = require('multer');
const path = require('path');

// Multer configuration for file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads')); // Ensures path works on all systems
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// Middleware to handle file uploads
const upload = multer({ storage });

module.exports = upload;

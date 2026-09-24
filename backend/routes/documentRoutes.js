const express = require('express');
const { protect } = require('../middleware/auth');
const { uploadDocument } = require('../controllers/documentController');
const upload = require('../config/multer'); // ← This should point to config/multer.js
const router = express.Router();

router.post('/upload', protect, upload.single('document'), uploadDocument);

module.exports = router;
const express = require('express');
const { protect } = require('../middleware/auth');
const { getAllProgrammes } = require('../controllers/programmeController');
const router = express.Router();

router.get('/', protect, getAllProgrammes);

module.exports = router;
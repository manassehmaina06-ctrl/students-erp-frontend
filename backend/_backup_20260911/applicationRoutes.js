// paste the entire new content
const express = require('express');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { submitApplication, getMyApplications, getAllApplications } = require('../controllers/applicationController');
const router = express.Router();

router.post('/submit', protect, roleCheck(['student']), submitApplication);
router.get('/my', protect, roleCheck(['student']), getMyApplications);
router.get('/all', protect, roleCheck(['admissions']), getAllApplications);

module.exports = router;
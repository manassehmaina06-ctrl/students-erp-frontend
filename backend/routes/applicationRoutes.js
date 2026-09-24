const express = require('express');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const {
  submitApplication, getMyApplications, getAllApplications,
  getApplication, updateApplication, updateStatus,
  getMyApplicationSummary,
  getMyApplicationList,
} = require('../controllers/applicationController');

const router = express.Router();

router.post('/submit', protect, roleCheck(['student']), submitApplication);
router.get('/my',      protect, roleCheck(['student']), getMyApplications);
router.get('/me',      protect, roleCheck(['student']), getMyApplicationSummary);
router.get('/me/all',  protect, roleCheck(['student']), getMyApplicationList);   // ← NEW
router.get('/all',     protect, roleCheck(['admissions', 'academic', 'finance']), getAllApplications);
router.get('/:id',     protect, getApplication);
router.put('/:id',     protect, updateApplication);
router.patch('/:id/status', protect, updateStatus);

module.exports = router;

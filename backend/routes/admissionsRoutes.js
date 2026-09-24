const express = require('express');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const {
  getAllApplications,
  getApplicationById,
  updateApplicationStatus,
  getApplicationStats,
  updateStudentInfo
} = require('../controllers/admissionsController');
const router = express.Router();

router.get('/applications', protect, roleCheck(['admissions']), getAllApplications);
router.get('/applications/:id', protect, roleCheck(['admissions']), getApplicationById);
router.put('/applications/:id', protect, roleCheck(['admissions']), updateApplicationStatus);
router.get('/stats', protect, roleCheck(['admissions']), getApplicationStats);
router.put('/student/:id', protect, roleCheck(['admissions']), updateStudentInfo);

module.exports = router;

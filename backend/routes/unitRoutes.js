const express = require('express');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { getMyResources } = require('../controllers/resourceController');
const {
  getMyAttendanceSummary, getMyAttendanceDetail,
} = require('../controllers/attendanceController');

const router = express.Router();
const studentOnly = [protect, roleCheck(['student'])];

router.get('/me/attendance',          ...studentOnly, getMyAttendanceSummary);
router.get('/me/attendance/:unitId',  ...studentOnly, getMyAttendanceDetail);
router.get('/me/resources', ...studentOnly, getMyResources);

module.exports = router;
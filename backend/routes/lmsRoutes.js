const express = require('express');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const {
  getMyDashboard, getMyCourses,
} = require('../controllers/lmsController');

const {
  getMyAssignments, getAssignmentDetail,
  submitAssignment, withdrawSubmission,
} = require('../controllers/assignmentController');
const uploadSubmission = require('../config/multerSubmission');
const router = express.Router();
const studentOnly = [protect, roleCheck(['student'])];
const { getMyTimetable } = require('../controllers/timetableController');


router.get('/me/dashboard', ...studentOnly, getMyDashboard);
router.get('/me/courses',   ...studentOnly, getMyCourses);
router.get('/me/timetable', ...studentOnly, getMyTimetable);

router.get   ('/me/assignments',                 ...studentOnly, getMyAssignments);
router.get   ('/me/assignments/:id',             ...studentOnly, getAssignmentDetail);
router.post  ('/me/assignments/:id/submit',      ...studentOnly, uploadSubmission.single('file'), submitAssignment);
router.delete('/me/assignments/:id/submit',      ...studentOnly, withdrawSubmission);
module.exports = router;
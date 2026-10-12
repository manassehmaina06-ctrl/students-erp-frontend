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
const { getMyAnnouncements } = require('../controllers/announcementController');
const {
  getMyQuizzes, startQuiz, submitAttempt, getMyAttempt,
} = require('../controllers/quizController');


router.get('/me/dashboard', ...studentOnly, getMyDashboard);
router.get('/me/courses',   ...studentOnly, getMyCourses);
router.get('/me/timetable', ...studentOnly, getMyTimetable);
router.get('/me/announcements', ...studentOnly, getMyAnnouncements);

router.get   ('/me/assignments',                 ...studentOnly, getMyAssignments);
router.get   ('/me/assignments/:id',             ...studentOnly, getAssignmentDetail);
router.post  ('/me/assignments/:id/submit',      ...studentOnly, uploadSubmission.single('file'), submitAssignment);
router.delete('/me/assignments/:id/submit',      ...studentOnly, withdrawSubmission);

router.get ('/me/quizzes',                     ...studentOnly, getMyQuizzes);
router.post('/me/quizzes/:id/start',           ...studentOnly, startQuiz);
router.post('/me/quizzes/attempts/:id/submit', ...studentOnly, submitAttempt);
router.get ('/me/quizzes/attempts/:id',        ...studentOnly, getMyAttempt);

module.exports = router;
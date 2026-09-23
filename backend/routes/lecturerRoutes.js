const express = require('express');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const {
  getMyProfile, getMyUnits, getCurrentSemester,
} = require('../controllers/lecturerController');
const {
  listAssessments, createAssessment, updateAssessment, deleteAssessment,
  getMarksGrid, saveMarksBulk,
} = require('../controllers/marksController');
const {
  listSessions, createSession, getSession, saveSession, deleteSession,
} = require('../controllers/attendanceController');
const {
  listUnitResources, uploadResource, deleteResource,
} = require('../controllers/resourceController');
const uploadResourceMw = require('../config/multerResource');
const router = express.Router();
const lecturerOnly = [protect, roleCheck(['lecturer'])];

const {
  listUnitAssignments, createAssignment, updateAssignment, deleteAssignment,
  publishAssignment, hideAssignment, closeAssignment,
  listSubmissions, gradeSubmission,
} = require('../controllers/assignmentController');
const uploadAssignment = require('../config/multerAssignment');

// Profile
router.get('/me',                 ...lecturerOnly, getMyProfile);
router.get('/me/units',           ...lecturerOnly, getMyUnits);
router.get('/me/current-semester', ...lecturerOnly, getCurrentSemester);

// Assessments per unit
router.get   ('/units/:unitId/assessments', ...lecturerOnly, listAssessments);
router.post  ('/units/:unitId/assessments', ...lecturerOnly, createAssessment);
router.put   ('/assessments/:id',           ...lecturerOnly, updateAssessment);
router.delete('/assessments/:id',           ...lecturerOnly, deleteAssessment);

// Marks grid per unit
router.get ('/units/:unitId/marks', ...lecturerOnly, getMarksGrid);
router.post('/units/:unitId/marks', ...lecturerOnly, saveMarksBulk);

// Attendance sessions
router.get   ('/units/:unitId/sessions',            ...lecturerOnly, listSessions);
router.post  ('/units/:unitId/sessions',            ...lecturerOnly, createSession);
router.get   ('/units/:unitId/sessions/:sessionId', ...lecturerOnly, getSession);
router.put   ('/units/:unitId/sessions/:sessionId', ...lecturerOnly, saveSession);
router.delete('/units/:unitId/sessions/:sessionId', ...lecturerOnly, deleteSession);

// Resources
// Resources
router.get   ('/units/:unitId/resources', ...lecturerOnly, listUnitResources);
router.post  ('/units/:unitId/resources', ...lecturerOnly, uploadResourceMw.single('file'), uploadResource);
router.delete('/resources/:id',           ...lecturerOnly, deleteResource);

// Assignments (lecturer)
router.get   ('/units/:unitId/assignments',        ...lecturerOnly, listUnitAssignments);
router.post  ('/units/:unitId/assignments',        ...lecturerOnly, uploadAssignment.single('file'), createAssignment);
router.put   ('/assignments/:id',                  ...lecturerOnly, updateAssignment);
router.delete('/assignments/:id',                  ...lecturerOnly, deleteAssignment);
router.post  ('/assignments/:id/publish',          ...lecturerOnly, publishAssignment);
router.post  ('/assignments/:id/hide',             ...lecturerOnly, hideAssignment);
router.post  ('/assignments/:id/close',            ...lecturerOnly, closeAssignment);
router.get   ('/assignments/:id/submissions',      ...lecturerOnly, listSubmissions);
router.put   ('/submissions/:id',                  ...lecturerOnly, gradeSubmission);
module.exports = router;
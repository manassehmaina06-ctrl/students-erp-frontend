const express = require('express');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const {
  getStudentProfile,
  saveApplication,
  submitApplication,
  updateStudentById,
  getAllStudents,
  getStudentById,
  resetStudentPassword,
} = require('../controllers/studentController');


const router = express.Router();

// student actions
router.get('/profile', protect, getStudentProfile);
router.put('/application', protect, saveApplication);
router.post('/submit', protect, submitApplication);

// staff list — must come BEFORE /:id
router.get('/', protect, roleCheck(['admissions', 'academic', 'finance']), getAllStudents);
router.get('/id/:id', protect, roleCheck(['admissions', 'academic', 'finance']), getStudentById);

// admissions / academic can edit a student
router.put('/:id', protect, roleCheck(['admissions', 'academic']), updateStudentById);
router.post('/:id/reset-password', protect, roleCheck(['admissions', 'academic']), resetStudentPassword);
module.exports = router;

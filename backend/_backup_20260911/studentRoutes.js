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
} = require('../controllers/studentController');

const router = express.Router();

router.get('/profile', protect, getStudentProfile);
router.put('/application', protect, saveApplication);
router.post('/submit', protect, submitApplication);

// staff list — must come BEFORE /:id so /:id doesn't swallow "id"
router.get('/',   protect, roleCheck(['admissions', 'academic', 'finance']), getAllStudents);
router.get('/id/:id', protect, roleCheck(['admissions', 'academic', 'finance']), getStudentById);

// admissions / academic can edit
router.put('/:id', protect, roleCheck(['admissions', 'academic']), updateStudentById);

module.exports = router;

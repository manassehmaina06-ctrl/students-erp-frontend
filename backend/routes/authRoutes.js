const express = require('express');
const {
  registerStudent, registerStaff, login, studentLogin, getMe, changePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.post('/register',       registerStudent);
router.post('/register-staff', registerStaff);
router.post('/login',          login);
router.post('/student-login',  studentLogin);
router.get ('/me',             protect, getMe);
router.put ('/change-password', protect, changePassword);

module.exports = router;
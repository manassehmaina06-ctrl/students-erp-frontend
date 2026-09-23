const User = require('../models/User');
const Student = require('../models/Student');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

exports.registerStudent = async (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({ email, password, role: 'student' });
    const student = await Student.create({
      userId: user._id,
      personalInfo: { firstName, lastName },
    });

    res.status(201).json({
      _id: user._id,
      email: user.email,
      role: user.role,
      studentId: student._id,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  // Applicant / staff login — email + personal password ONLY.
  // Enrolled students use /auth/student-login (student number or school email + ID number).
  const identifier = (req.body.login || req.body.email || '').trim();
  const { password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ message: 'Credentials required' });
  }

  try {
    const user = await User.findOne({
      email: identifier.toLowerCase(),
    });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    res.json({
      _id:       user._id,
      email:     user.email,
      username:  user.username || null,
      role:      user.role,
      enrolled:  user.enrolled || false,
      studentId: user.studentId || null,
      token:     generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// ---------------------------------------------------------------------------
// GET CURRENT USER (for AuthContext on page refresh)
// ---------------------------------------------------------------------------
exports.getMe = async (req, res) => {
  try {
    const user = await require('../models/User').findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      _id:       user._id,
      email:     user.email,
      username:  user.username || null,
      role:      user.role,
      enrolled:  user.enrolled || false,
      studentId: user.studentId || null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------------------------------------
// ADMIN: create a staff account (lecturer, academic, finance, admissions)
// POST /api/auth/register-staff
// In production this would be admin-only; for now open so you can seed.
// ---------------------------------------------------------------------------
exports.registerStaff = async (req, res) => {
  try {
    const { email, password, role, firstName, lastName } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ message: 'email, password, role required' });
    }
    if (!['lecturer', 'academic', 'finance', 'admissions'].includes(role)) {
      return res.status(400).json({ message: 'Invalid staff role' });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({
      email:    email.toLowerCase(),
      password,
      role,
    });

    res.status(201).json({
      _id:      user._id,
      email:    user.email,
      username: user.username || null,
      role:     user.role,
      enrolled: user.enrolled || false,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// ---------------------------------------------------------------------------
// ENROLLED STUDENT LOGIN
// POST /api/auth/student-login   { studentNumber, idNumber }
// ---------------------------------------------------------------------------
exports.studentLogin = async (req, res) => {
  try {
    const studentNumber = (req.body.studentNumber || '').trim();
    const idNumber      = (req.body.idNumber || '').trim();

    if (!studentNumber || !idNumber) {
      return res.status(400).json({ message: 'Student number / school email and ID number required' });
    }

    // 1. Find by student number (username) OR school email
    const user = await User.findOne({
      $or: [
        { username: studentNumber },
        { schoolEmail: studentNumber.toLowerCase() },
      ],
    });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // 2. Verify ID number against studentPassword (set at enrollment)
    const isMatch = await user.matchStudentPassword(idNumber);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // 3. Require the account to be enrolled
    if (!user.enrolled) {
      return res.status(403).json({
        message: 'Your account is not yet enrolled. Track your application at /login.',
      });
    }

    // 4. Issue token
    res.json({
      _id:       user._id,
      email:     user.email,
      username:  user.username,
      role:      user.role,
      enrolled:  user.enrolled,
      studentId: user.studentId || null,
      token:     generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
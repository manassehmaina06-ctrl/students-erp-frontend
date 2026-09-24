const Student = require('../models/Student');

exports.getStudentProfile = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id })
      .populate('programmeInfo.programme')
      .populate('documents');
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.saveApplication = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const {
      personalInfo, programmeInfo, guardianInfo,
      highSchoolInfo, educationBackground, experience,
    } = req.body;

    if (personalInfo) student.personalInfo = { ...student.personalInfo, ...personalInfo };
    if (programmeInfo) student.programmeInfo = { ...student.programmeInfo, ...programmeInfo };
    if (guardianInfo) student.guardianInfo = { ...student.guardianInfo, ...guardianInfo };
    if (highSchoolInfo) student.highSchoolInfo = highSchoolInfo;
    if (educationBackground) student.educationBackground = educationBackground;
    if (experience) student.experience = experience;

    await student.save();
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.submitApplication = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const year = new Date().getFullYear();
    const random = Math.floor(10000 + Math.random() * 90000);
    const applicationNumber = `APP-${year}-${random}`;

    student.applicationNumber = applicationNumber;
    student.applicationStatus = 'pending_app_fee';
    student.feeStatus = 'pending';
    await student.save();

    res.json({
      message: 'Application submitted. Please pay the application fee.',
      applicationNumber,
      student,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const updates = { ...req.body };

  

    // Apply allowed fields
    if (updates.personalInfo)  student.personalInfo  = { ...student.personalInfo,  ...updates.personalInfo };
    if (updates.guardianInfo)  student.guardianInfo  = { ...student.guardianInfo,  ...updates.guardianInfo };
    if (updates.highSchoolInfo)student.highSchoolInfo= { ...student.highSchoolInfo,...updates.highSchoolInfo };
    if (updates.educationBackground) student.educationBackground = updates.educationBackground;
    if (updates.experience)    student.experience    = updates.experience;
    if (updates.programmeInfo) student.programmeInfo = { ...student.programmeInfo, ...updates.programmeInfo };

    await student.save();
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/students?enrolledOnly=true — staff list
exports.getAllStudents = async (req, res) => {
  try {
    const filter = {};
    if (req.query.enrolledOnly === 'true') {
      filter.studentNumber = { $exists: true, $ne: null };
    }
    const students = await Student.find(filter)
      .populate('userId', 'email role')
      .populate('programmeInfo.programme')
      .sort({ studentNumber: -1, createdAt: -1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/students/id/:id — one student with full details
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('userId', 'email role')
      .populate('programmeInfo.programme')
      .populate('documents');
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.resetStudentPassword = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const idNumber = (student.personalInfo?.idNumber || student.personalInfo?.birthCertNo || '').trim();
    if (!idNumber) {
      return res.status(400).json({ message: 'No ID number on record. Update the application first.' });
    }

    const user = await require('../models/User').findById(student.userId);
    if (!user) return res.status(404).json({ message: 'Linked user account not found' });

       user.studentPassword = idNumber;   // bcrypt hashed by pre-save hook // bcrypt hashed by pre-save hook
    await user.save();

    res.json({
      message: 'Password reset',
      username: user.username,
      passwordSource: 'ID number',
      passwordHint: `Password is now: ${idNumber}`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
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

// ---------------------------------------------------------------------------
// PUT /api/students/:id  — admissions/academic only
// Body: { personalInfo?, highSchoolInfo?, programmeInfo?, guardianInfo? }
// ---------------------------------------------------------------------------
exports.updateStudentById = async (req, res) => {
  try {
    const { personalInfo, highSchoolInfo, programmeInfo, guardianInfo } = req.body;
    const update = {};
    if (personalInfo)   update.personalInfo   = personalInfo;
    if (highSchoolInfo) update.highSchoolInfo = highSchoolInfo;
    if (programmeInfo)  update.programmeInfo  = programmeInfo;
    if (guardianInfo)   update.guardianInfo   = guardianInfo;

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------------------------------------
// GET /api/students  — staff list (admissions, academic, finance)
// Query: ?enrolledOnly=true to filter by studentNumber presence
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// GET /api/students/id/:id  — full record with programme + docs populated
// ---------------------------------------------------------------------------
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

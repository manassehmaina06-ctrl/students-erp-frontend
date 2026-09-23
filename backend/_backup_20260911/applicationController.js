const Application = require('../models/Application');
const Student = require('../models/Student');

exports.submitApplication = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    const application = new Application({
      studentId: student._id,
      programmeId: student.programme,
      status: 'pending',
      submittedAt: new Date(),
    });
    await application.save();
    student.applicationStatus = 'submitted';
    await student.save();
    res.status(201).json(application);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyApplications = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const apps = await Application.find({ studentId: student._id })
      .populate('programmeId')
      .sort({ createdAt: -1 });

    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllApplications = async (req, res) => {
  try {
    const apps = await Application.find().populate('studentId').populate('programmeId');
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
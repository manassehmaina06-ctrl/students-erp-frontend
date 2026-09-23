const Application = require('../models/Application');
const Student = require('../models/Student');

// Get all applications
exports.getAllApplications = async (req, res) => {
  try {
    const applications = await Application.find()
      .populate({
        path: 'studentId',
        populate: { path: 'userId', select: 'email' }
      })
      .populate('programmeId')
      .sort({ submittedAt: -1 });
    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get a single application by ID
exports.getApplicationById = async (req, res) => {
  const { id } = req.params;
  try {
    const application = await Application.findById(id)
      .populate({
        path: 'studentId',
        populate: { path: 'userId', select: 'email' }
      })
      .populate('programmeId');
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    res.json(application);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update application status
exports.updateApplicationStatus = async (req, res) => {
  const { id } = req.params;
  const { status, comments } = req.body;
  
  if (!['pending', 'reviewed', 'accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const app = await Application.findById(id);
    if (!app) return res.status(404).json({ message: 'Application not found' });

    app.status = status;
    app.reviewedBy = req.user._id;
    if (comments) app.comments = comments;
    await app.save();

    if (status === 'accepted') {
      await Student.findByIdAndUpdate(app.studentId, { applicationStatus: 'accepted' });
    } else if (status === 'rejected') {
      await Student.findByIdAndUpdate(app.studentId, { applicationStatus: 'rejected' });
    }

    res.json(app);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get application statistics
exports.getApplicationStats = async (req, res) => {
  try {
    const total = await Application.countDocuments();
    const pending = await Application.countDocuments({ status: 'pending' });
    const accepted = await Application.countDocuments({ status: 'accepted' });
    const rejected = await Application.countDocuments({ status: 'rejected' });
    
    res.json({ total, pending, accepted, rejected });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update student info from admissions
exports.updateStudentInfo = async (req, res) => {
  const { id } = req.params;
  const { personalInfo, academicInfo } = req.body;
  
  try {
    const student = await Student.findById(id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    if (personalInfo) {
      student.personalInfo = { ...student.personalInfo, ...personalInfo };
    }
    if (academicInfo) {
      student.academicInfo = { ...student.academicInfo, ...academicInfo };
    }
    
    await student.save();
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

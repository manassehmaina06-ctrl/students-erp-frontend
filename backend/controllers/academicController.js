const Student   = require('../models/Student');
const Programme = require('../models/Programme');
const Semester = require('../models/Semester');
const Unit     = require('../models/Unit');

exports.listStudents = async (req, res) => {
  try {
    const students = await Student.find({ enrolledAt: { $exists: true } })
      .populate('userId', 'email username')
      .populate('programmeInfo.programme')
      .sort({ studentNumber: 1 })
      .lean();

    const rows = students.map((s) => ({
      _id:           s._id,
      studentNumber: s.studentNumber,
      name:          [s.personalInfo?.title, s.personalInfo?.surname, s.personalInfo?.lastName]
                       .filter(Boolean).join(' ') || 'Unnamed',
      email:         s.personalInfo?.email || s.userId?.email || '—',
      campus:        s.personalInfo?.campus || '—',
      modeOfStudy:   s.programmeInfo?.modeOfStudy || '—',
      programme:     s.programmeInfo?.programme?.name || '—',
      programmeCode: s.programmeInfo?.programme?.code || '',
      enrolledAt:    s.enrolledAt,
      feeStatus:     s.feeStatus || 'pending',
    }));

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.listProgrammes = async (req, res) => {
  try {
    const programmes = await Programme.find().sort({ name: 1 }).lean();
    const counts = await Student.aggregate([
      { $match: { enrolledAt: { $exists: true }, 'programmeInfo.programme': { $ne: null } } },
      { $group: { _id: '$programmeInfo.programme', n: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));

    res.json(programmes.map((p) => ({
      _id:           p._id,
      name:          p.name,
      code:          p.code,
      department:    p.department || '',
      duration:      p.duration || null,
      enrolledCount: countMap[String(p._id)] || 0,
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.summary = async (req, res) => {
  try {
    const totalStudents   = await Student.countDocuments({ enrolledAt: { $exists: true } });
    const totalProgrammes = await Programme.countDocuments();
    res.json({ totalStudents, totalProgrammes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------------------------------------
// SEMESTERS
// ---------------------------------------------------------------------------

// GET /api/academic/semesters
exports.listSemesters = async (req, res) => {
  try {
    const semesters = await Semester.find().sort({ code: -1 }).lean();
    res.json(semesters);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/academic/semesters
exports.createSemester = async (req, res) => {
  try {
    const { code, academicYear, startDate, endDate, registrationOpen, isCurrent } = req.body;
    if (!code || !academicYear) {
      return res.status(400).json({ message: 'code and academicYear required' });
    }
    const semester = await Semester.create({
      code: code.trim(),
      academicYear: academicYear.trim(),
      startDate: startDate || null,
      endDate: endDate || null,
      registrationOpen: !!registrationOpen,
      isCurrent: !!isCurrent,
    });
    res.status(201).json(semester);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Semester code already exists' });
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/academic/semesters/:id
exports.updateSemester = async (req, res) => {
  try {
    const semester = await Semester.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { returnDocument: 'after', runValidators: true }
    );
    if (!semester) return res.status(404).json({ message: 'Semester not found' });
    res.json(semester);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/academic/semesters/:id/set-current
exports.setCurrentSemester = async (req, res) => {
  try {
    await Semester.updateMany({ _id: { $ne: req.params.id } }, { $set: { isCurrent: false } });
    const semester = await Semester.findByIdAndUpdate(
      req.params.id,
      { $set: { isCurrent: true } },
      { returnDocument: 'after' }
    );
    if (!semester) return res.status(404).json({ message: 'Semester not found' });
    res.json(semester);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------------------------------------
// UNITS
// ---------------------------------------------------------------------------

// GET /api/academic/units
exports.listUnits = async (req, res) => {
  try {
    const { programmeId, semester, lecturerId } = req.query;
    const filter = {};
    if (programmeId) filter.programmeIds = programmeId;
    if (semester)    filter.semester = Number(semester);
    if (lecturerId)  filter.lecturerId = lecturerId;

    const units = await Unit.find(filter)
      .populate('programmeIds', 'name code')
      .populate('lecturerId', 'email username')
      .sort({ code: 1 })
      .lean();
    res.json(units);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/academic/units/:id
exports.getUnit = async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id)
      .populate('programmeIds', 'name code')
      .populate('lecturerId', 'email username');
    if (!unit) return res.status(404).json({ message: 'Unit not found' });
    res.json(unit);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/academic/units
exports.createUnit = async (req, res) => {
  try {
    const { code, name, programmeIds, semester, credits, type, description, lecturerId } = req.body;
    if (!code || !name || !semester) {
      return res.status(400).json({ message: 'code, name, and semester required' });
    }
    const unit = await Unit.create({
      code: code.trim().toUpperCase(),
      name: name.trim(),
      programmeIds: Array.isArray(programmeIds) ? programmeIds : [],
      semester: Number(semester),
      credits: credits != null ? Number(credits) : 3,
      type: type || 'core',
      description: description || '',
      lecturerId: lecturerId || null,
    });
    const populated = await Unit.findById(unit._id)
      .populate('programmeIds', 'name code')
      .populate('lecturerId', 'email username');
    res.status(201).json(populated);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Unit code already exists' });
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/academic/units/:id
exports.updateUnit = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.code) updates.code = updates.code.trim().toUpperCase();
    if (updates.semester != null) updates.semester = Number(updates.semester);
    if (updates.credits != null)  updates.credits  = Number(updates.credits);

    const unit = await Unit.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { returnDocument: 'after', runValidators: true }
    )
      .populate('programmeIds', 'name code')
      .populate('lecturerId', 'email username');

    if (!unit) return res.status(404).json({ message: 'Unit not found' });
    res.json(unit);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Unit code already exists' });
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/academic/units/:id
exports.deleteUnit = async (req, res) => {
  try {
    const result = await Unit.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: 'Unit not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/academic/lecturers   — list all users with role=lecturer (for dropdowns)
exports.listLecturers = async (req, res) => {
  try {
    const User = require('../models/User');
    const lecturers = await User.find({ role: 'lecturer' })
      .select('_id email username')
      .sort({ email: 1 })
      .lean();
    res.json(lecturers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

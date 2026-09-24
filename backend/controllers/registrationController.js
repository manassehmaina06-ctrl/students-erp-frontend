const UnitRegistration = require('../models/UnitRegistration');
const Unit             = require('../models/Unit');
const Student          = require('../models/Student');
const Semester         = require('../models/Semester');
const { notify }       = require('../utils/notify');
const {
  MIN_UNITS, MAX_UNITS, validateUnitCount,
} = require('../utils/registrationHelpers');

// ---------------------------------------------------------------------------
// STUDENT
// ---------------------------------------------------------------------------

// GET /api/registrations/me
// Returns the student's registration for the current semester (any status).
exports.getMine = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const semester = await Semester.findOne({ isCurrent: true });
    if (!semester) return res.json({ semester: null, registration: null });

    const reg = await UnitRegistration.findOne({
      studentId: student._id,
      semester: semester.code,
    }).populate('unitIds', 'code name credits semester type');

    res.json({
      semester,
      registration: reg || null,
      limits: { min: MIN_UNITS, max: MAX_UNITS },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/registrations/available-units
// Lists units the student can pick for the current semester
// (matches their programme, not exempted, and not already in their registration).
exports.getAvailableUnits = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const programmeId = student.programmeInfo?.programme;
    if (!programmeId) return res.json([]);

    const semester = await Semester.findOne({ isCurrent: true });
    if (!semester) return res.json([]);

    const reg = await UnitRegistration.findOne({
      studentId: student._id,
      semester: semester.code,
    });
    const alreadyIn = (reg?.unitIds || []).map((id) => String(id));
    const exempted  = (student.exemptedUnitIds || []).map((id) => String(id));

    const units = await Unit.find({ programmeIds: programmeId })
      .populate('lecturerId', 'email')
      .sort({ semester: 1, code: 1 })
      .lean();

    res.json(units.map((u) => ({
      ...u,
      alreadyEnrolled: alreadyIn.includes(String(u._id)),
      exempted:        exempted.includes(String(u._id)),
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/registrations/me/start
// Creates a draft registration if none exists.
exports.startMine = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const semester = await Semester.findOne({ isCurrent: true });
    if (!semester) return res.status(400).json({ message: 'No current semester' });
    if (!semester.registrationOpen) {
      return res.status(403).json({ message: 'Registration is closed for this semester' });
    }

    let reg = await UnitRegistration.findOne({
      studentId: student._id,
      semester: semester.code,
    });

    if (reg && reg.status !== 'draft') {
      return res.status(400).json({
        message: `Registration is already ${reg.status}`,
        registration: reg,
      });
    }

    if (!reg) {
      reg = await UnitRegistration.create({
        studentId:     student._id,
        studentNumber: student.studentNumber,
        semester:      semester.code,
        academicYear:  semester.academicYear,
        unitIds:       [],
        status:        'draft',
        source:        'self',
      });
    }

    res.json(reg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/registrations/me/units  { unitId }
exports.addUnit = async (req, res) => {
  try {
    const { unitId } = req.body;
    if (!unitId) return res.status(400).json({ message: 'unitId required' });

    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const semester = await Semester.findOne({ isCurrent: true });
    if (!semester || !semester.registrationOpen) {
      return res.status(403).json({ message: 'Registration is closed' });
    }

    const reg = await UnitRegistration.findOne({
      studentId: student._id,
      semester: semester.code,
    });
    if (!reg) return res.status(404).json({ message: 'Start a registration first' });
    if (reg.status !== 'draft') return res.status(400).json({ message: `Registration is already ${reg.status}` });

    if (reg.unitIds.length >= MAX_UNITS) {
      return res.status(400).json({ message: `Maximum ${MAX_UNITS} units allowed` });
    }

    const exempted = (student.exemptedUnitIds || []).map((id) => String(id));
    if (exempted.includes(String(unitId))) {
      return res.status(400).json({ message: 'You are exempted from this unit' });
    }

    // Verify unit belongs to their programme
    const unit = await Unit.findById(unitId);
    if (!unit) return res.status(404).json({ message: 'Unit not found' });
    const programmeId = student.programmeInfo?.programme;
    const belongsToProgramme = (unit.programmeIds || []).some((p) => String(p) === String(programmeId));
    if (!belongsToProgramme) {
      return res.status(400).json({ message: 'Unit is not part of your programme' });
    }

    if (reg.unitIds.some((id) => String(id) === String(unitId))) {
      return res.status(400).json({ message: 'Unit already added' });
    }

    reg.unitIds.push(unitId);
    await reg.save();
    res.json(reg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/registrations/me/units/:unitId
exports.dropUnit = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const semester = await Semester.findOne({ isCurrent: true });
    if (!semester || !semester.registrationOpen) {
      return res.status(403).json({ message: 'Registration is closed' });
    }

    const reg = await UnitRegistration.findOne({
      studentId: student._id,
      semester: semester.code,
    });
    if (!reg) return res.status(404).json({ message: 'No registration' });
    if (reg.status !== 'draft') return res.status(400).json({ message: `Registration is already ${reg.status}` });

    reg.unitIds = reg.unitIds.filter((id) => String(id) !== String(req.params.unitId));
    await reg.save();
    res.json(reg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/registrations/me
// Drops the whole draft (or pending) registration for the current semester.
exports.resetMine = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const semester = await Semester.findOne({ isCurrent: true });
    if (!semester || !semester.registrationOpen) {
      return res.status(403).json({ message: 'Registration is closed' });
    }

    const reg = await UnitRegistration.findOneAndDelete({
      studentId: student._id,
      semester: semester.code,
      status: { $in: ['draft', 'pending'] },
    });

    if (!reg) return res.status(404).json({ message: 'No registration to reset' });
    res.json({ message: 'Registration cleared', deletedId: reg._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/registrations/me/submit
exports.submitMine = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const semester = await Semester.findOne({ isCurrent: true });
    if (!semester || !semester.registrationOpen) {
      return res.status(403).json({ message: 'Registration is closed' });
    }

    const reg = await UnitRegistration.findOne({
      studentId: student._id,
      semester: semester.code,
    });
    if (!reg) return res.status(404).json({ message: 'No registration' });
    if (reg.status !== 'draft') return res.status(400).json({ message: `Already ${reg.status}` });

    const validation = validateUnitCount(reg);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.reason });
    }

    // Q2=C: auto-approve if valid
    reg.status      = 'approved';
    reg.submittedAt = new Date();
    reg.approvedAt  = new Date();
    await reg.save();

    await notify(student.userId, {
      type:  'registration.approved',
      title: 'Unit registration approved',
      body:  `${reg.unitIds.length} units registered for ${reg.semester}.`,
      link:  '/portal/registration',
    });

    res.json(reg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------------------------------------
// ACADEMIC
// ---------------------------------------------------------------------------

// GET /api/academic/registrations?status=pending
exports.listAll = async (req, res) => {
  try {
    const { status, semester } = req.query;
    const filter = {};
    if (status)   filter.status = status;
    if (semester) filter.semester = semester;

    const regs = await UnitRegistration.find(filter)
      .populate('studentId', 'personalInfo studentNumber programmeInfo')
      .populate('unitIds', 'code name')
      .sort({ updatedAt: -1 })
      .limit(200);

    res.json(regs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/academic/registrations/:id/approve
exports.approve = async (req, res) => {
  try {
    const reg = await UnitRegistration.findById(req.params.id);
    if (!reg) return res.status(404).json({ message: 'Registration not found' });

    reg.status     = 'approved';
    reg.approvedAt = new Date();
    reg.approvedBy = req.user._id;
    await reg.save();

    const student = await Student.findById(reg.studentId).select('userId');
    if (student) {
      await notify(student.userId, {
        type:  'registration.approved',
        title: 'Unit registration approved by academics',
        body:  `${reg.unitIds.length} units approved for ${reg.semester}.`,
        link:  '/portal/registration',
      });
    }

    res.json(reg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/academic/registrations/:id/reject  { reason }
exports.reject = async (req, res) => {
  try {
    const { reason } = req.body || {};
    if (!reason) return res.status(400).json({ message: 'reason required' });

    const reg = await UnitRegistration.findById(req.params.id);
    if (!reg) return res.status(404).json({ message: 'Registration not found' });

    reg.status          = 'rejected';
    reg.rejectionReason = reason;
    await reg.save();

    const student = await Student.findById(reg.studentId).select('userId');
    if (student) {
      await notify(student.userId, {
        type:  'registration.rejected',
        title: 'Unit registration rejected',
        body:  reason,
        link:  '/portal/registration',
      });
    }

    res.json(reg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/academic/students/:id/exemptions   { unitIds: [...] }
exports.setExemptions = async (req, res) => {
  try {
    const { unitIds } = req.body || {};
    if (!Array.isArray(unitIds)) return res.status(400).json({ message: 'unitIds array required' });

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { $set: { exemptedUnitIds: unitIds } },
      { returnDocument: 'after' }
    ).select('studentNumber exemptedUnitIds');
    if (!student) return res.status(404).json({ message: 'Student not found' });

    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/academic/registrations/for-student  { studentId }
// Academic creates a draft registration on behalf of a student
exports.startForStudent = async (req, res) => {
  try {
    const { studentId } = req.body || {};
    if (!studentId) return res.status(400).json({ message: 'studentId required' });

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const semester = await Semester.findOne({ isCurrent: true });
    if (!semester) return res.status(400).json({ message: 'No current semester' });

    let reg = await UnitRegistration.findOne({
      studentId: student._id,
      semester: semester.code,
    });

    if (reg) return res.json(reg);

    reg = await UnitRegistration.create({
      studentId:     student._id,
      studentNumber: student.studentNumber,
      semester:      semester.code,
      academicYear:  semester.academicYear,
      unitIds:       [],
      status:        'draft',
      source:        'academic',
    });

    res.json(reg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/academic/registrations/:id/units  { unitIds: [...] }
// Academic replaces the whole unit list on a registration
exports.replaceUnits = async (req, res) => {
  try {
    const { unitIds } = req.body || {};
    if (!Array.isArray(unitIds)) return res.status(400).json({ message: 'unitIds array required' });

    const reg = await UnitRegistration.findById(req.params.id);
    if (!reg) return res.status(404).json({ message: 'Registration not found' });

    reg.unitIds = unitIds;
    await reg.save();
    res.json(reg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/academic/registrations/:id/exemption  { approved, reason }
exports.setExemption = async (req, res) => {
  try {
    const { approved, reason } = req.body || {};
    const reg = await UnitRegistration.findById(req.params.id);
    if (!reg) return res.status(404).json({ message: 'Registration not found' });

    reg.exemptionApproved = !!approved;
    reg.exemptionReason   = approved ? (reason || '') : '';
    await reg.save();
    res.json(reg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

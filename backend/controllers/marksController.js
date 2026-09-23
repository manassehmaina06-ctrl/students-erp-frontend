const Assessment = require('../models/Assessment');
const Mark       = require('../models/Mark');
const Unit       = require('../models/Unit');
const Student    = require('../models/Student');
const Semester   = require('../models/Semester');
const UnitRegistration = require('../models/UnitRegistration');
const {
  computeGrade, validateWeights, computeStudentUnitResult,
} = require('../utils/gradeHelpers');
const { notify } = require('../utils/notify');

// ---------------------------------------------------------------------------
// LECTURER
// ---------------------------------------------------------------------------

async function assertUnitOwnedByLecturer(req, res, unitId) {
  const unit = await Unit.findById(unitId);
  if (!unit) { res.status(404).json({ message: 'Unit not found' }); return null; }
  if (String(unit.lecturerId) !== String(req.user._id)) {
    res.status(403).json({ message: 'You do not teach this unit' });
    return null;
  }
  return unit;
}

// GET /api/lecturer/units/:unitId/assessments
exports.listAssessments = async (req, res) => {
  try {
    const unit = await assertUnitOwnedByLecturer(req, res, req.params.unitId);
    if (!unit) return;

    const semester = await Semester.findOne({ isCurrent: true });
    if (!semester) return res.status(400).json({ message: 'No current semester' });

    const assessments = await Assessment
      .find({ unitId: unit._id, semester: semester.code })
      .sort({ type: 1, number: 1, name: 1 });

    const { total, valid } = validateWeights(assessments);
    res.json({ semester: semester.code, assessments, weightTotal: total, weightsValid: valid });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/lecturer/units/:unitId/assessments
exports.createAssessment = async (req, res) => {
  try {
    const unit = await assertUnitOwnedByLecturer(req, res, req.params.unitId);
    if (!unit) return;

    const semester = await Semester.findOne({ isCurrent: true });
    if (!semester) return res.status(400).json({ message: 'No current semester' });

    const { name, type, number, weight, maxScore } = req.body;
    if (!name || !type || weight == null) {
      return res.status(400).json({ message: 'name, type, weight required' });
    }

    const assessment = await Assessment.create({
      unitId: unit._id,
      semester: semester.code,
      name: name.trim(),
      type,
      number: number || 1,
      weight: Number(weight),
      maxScore: maxScore != null ? Number(maxScore) : 100,
      createdBy: req.user._id,
    });

    // Return the updated list + validity
    const all = await Assessment.find({ unitId: unit._id, semester: semester.code });
    const { total, valid } = validateWeights(all);
    res.status(201).json({ assessment, weightTotal: total, weightsValid: valid });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Assessment name already exists' });
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/lecturer/assessments/:id
exports.updateAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) return res.status(404).json({ message: 'Assessment not found' });
    const unit = await assertUnitOwnedByLecturer(req, res, assessment.unitId);
    if (!unit) return;

    ['name', 'type', 'number', 'weight', 'maxScore'].forEach((k) => {
      if (req.body[k] != null) assessment[k] = k === 'weight' || k === 'maxScore' || k === 'number'
        ? Number(req.body[k]) : req.body[k];
    });
    await assessment.save();

    const all = await Assessment.find({ unitId: assessment.unitId, semester: assessment.semester });
    const { total, valid } = validateWeights(all);
    res.json({ assessment, weightTotal: total, weightsValid: valid });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/lecturer/assessments/:id
exports.deleteAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) return res.status(404).json({ message: 'Assessment not found' });
    const unit = await assertUnitOwnedByLecturer(req, res, assessment.unitId);
    if (!unit) return;

    await Assessment.findByIdAndDelete(assessment._id);
    await Mark.deleteMany({ assessmentId: assessment._id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/lecturer/units/:unitId/marks
// Grid: enrolled students x assessments x scores
exports.getMarksGrid = async (req, res) => {
  try {
    const unit = await assertUnitOwnedByLecturer(req, res, req.params.unitId);
    if (!unit) return;

    const semester = await Semester.findOne({ isCurrent: true });
    if (!semester) return res.status(400).json({ message: 'No current semester' });

    const assessments = await Assessment
      .find({ unitId: unit._id, semester: semester.code })
      .sort({ type: 1, number: 1, name: 1 });

    // Get enrolled students for this unit
    const enrollments = await UnitRegistration
      .find({ unitIds: unit._id, semester: semester.code, status: 'approved' })
      .populate('studentId', 'studentNumber personalInfo');

    const students = enrollments
      .map((e) => e.studentId)
      .filter(Boolean);

    // Get existing marks
    const marks = await Mark.find({
      unitId: unit._id,
      semester: semester.code,
    });

    // Group marks by student
    const byStudent = {};
    for (const m of marks) {
      const sid = String(m.studentId);
      byStudent[sid] = byStudent[sid] || {};
      byStudent[sid][String(m.assessmentId)] = m.score;
    }

    res.json({
      semester: semester.code,
      unit: { _id: unit._id, code: unit.code, name: unit.name },
      assessments,
      students: students.map((s) => ({
        _id:     s._id,
        studentNumber: s.studentNumber,
        name:    [s.personalInfo?.title, s.personalInfo?.surname, s.personalInfo?.lastName]
                   .filter(Boolean).join(' ') || 'Unnamed',
        marks:   byStudent[String(s._id)] || {},
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/lecturer/units/:unitId/marks
// Body: { marks: [{ studentId, assessmentId, score }] }
exports.saveMarksBulk = async (req, res) => {
  try {
    const unit = await assertUnitOwnedByLecturer(req, res, req.params.unitId);
    if (!unit) return;

    const semester = await Semester.findOne({ isCurrent: true });
    if (!semester) return res.status(400).json({ message: 'No current semester' });

    const { marks } = req.body || {};
    if (!Array.isArray(marks)) return res.status(400).json({ message: 'marks array required' });

    // Load all assessments for validation
    const assessments = await Assessment.find({ unitId: unit._id, semester: semester.code });
    const assessMap = Object.fromEntries(assessments.map((a) => [String(a._id), a]));

    let saved = 0;
    const errors = [];

    for (const row of marks) {
      const { studentId, assessmentId, score } = row;
      if (!studentId || !assessmentId) continue;

      const assessment = assessMap[String(assessmentId)];
      if (!assessment) { errors.push(`Unknown assessment ${assessmentId}`); continue; }

      // Allow null score to delete existing mark
      if (score === null || score === '') {
        await Mark.deleteOne({ studentId, assessmentId });
        continue;
      }

      const numeric = Number(score);
      if (isNaN(numeric) || numeric < 0 || numeric > assessment.maxScore) {
        errors.push(`Invalid score for ${assessment.name} (max ${assessment.maxScore})`);
        continue;
      }

      await Mark.findOneAndUpdate(
        { studentId, assessmentId },
        {
          $set: {
            unitId: unit._id,
            semester: semester.code,
            score: numeric,
            gradedBy: req.user._id,
            gradedAt: new Date(),
          },
        },
        { upsert: true }
      );
      saved++;
    }

    // Notify enrolled students that marks are updated
    const enrollments = await UnitRegistration.find({
      unitIds: unit._id, semester: semester.code, status: 'approved',
    }).populate('studentId', 'userId');
    for (const e of enrollments) {
      if (e.studentId?.userId) {
        await notify(e.studentId.userId, {
          type:  'marks.updated',
          title: `Marks updated for ${unit.code}`,
          body:  'New marks posted. Check your marks page.',
          link:  '/portal/marks',
        });
      }
    }

    res.json({ saved, errors });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------------------------------------
// STUDENT
// ---------------------------------------------------------------------------

// GET /api/registrations/me/marks
exports.getMyMarks = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const semester = await Semester.findOne({ isCurrent: true });
    if (!semester) return res.json({ semester: null, units: [] });

    // Find the student's approved registration this semester
    const reg = await UnitRegistration.findOne({
      studentId: student._id,
      semester: semester.code,
      status: 'approved',
    }).populate('unitIds', 'code name credits semester');

    if (!reg) return res.json({ semester: semester.code, units: [] });

    const results = [];

    for (const unit of reg.unitIds) {
      const assessments = await Assessment.find({ unitId: unit._id, semester: semester.code })
        .sort({ type: 1, number: 1, name: 1 });

      const marks = await Mark.find({
        studentId: student._id,
        unitId: unit._id,
        semester: semester.code,
      });

      const computed = computeStudentUnitResult(assessments, marks);

      results.push({
        unit: { _id: unit._id, code: unit.code, name: unit.name, credits: unit.credits },
        assessments: assessments.map((a) => {
          const m = marks.find((x) => String(x.assessmentId) === String(a._id));
          return {
            _id: a._id,
            name: a.name,
            type: a.type,
            weight: a.weight,
            maxScore: a.maxScore,
            score: m ? m.score : null,
            comment: m?.comment || null,
          };
        }),
        summary: computed,
      });
    }

    res.json({ semester: semester.code, units: results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------------------------------------
// ACADEMIC (read-only oversight)
// ---------------------------------------------------------------------------

// GET /api/academic/units/:unitId/marks
exports.viewUnitMarksAcademic = async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.unitId);
    if (!unit) return res.status(404).json({ message: 'Unit not found' });

    const semester = await Semester.findOne({ isCurrent: true });
    if (!semester) return res.status(400).json({ message: 'No current semester' });

    const assessments = await Assessment
      .find({ unitId: unit._id, semester: semester.code })
      .sort({ type: 1, number: 1, name: 1 });

    const enrollments = await UnitRegistration
      .find({ unitIds: unit._id, semester: semester.code, status: 'approved' })
      .populate('studentId', 'studentNumber personalInfo');

    const students = enrollments.map((e) => e.studentId).filter(Boolean);
    const marks = await Mark.find({ unitId: unit._id, semester: semester.code });

    const rows = students.map((s) => {
      const studentMarks = marks.filter((m) => String(m.studentId) === String(s._id));
      const computed = computeStudentUnitResult(assessments, studentMarks);
      return {
        student: {
          _id: s._id,
          studentNumber: s.studentNumber,
          name: [s.personalInfo?.title, s.personalInfo?.surname, s.personalInfo?.lastName]
                   .filter(Boolean).join(' ') || 'Unnamed',
        },
        marks: Object.fromEntries(
          assessments.map((a) => {
            const m = studentMarks.find((x) => String(x.assessmentId) === String(a._id));
            return [String(a._id), m ? m.score : null];
          })
        ),
        summary: computed,
      };
    });

    res.json({
      semester: semester.code,
      unit: { _id: unit._id, code: unit.code, name: unit.name },
      assessments,
      rows,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

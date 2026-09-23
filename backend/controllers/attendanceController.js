const AttendanceSession = require('../models/AttendanceSession');
const AttendanceRecord  = require('../models/AttendanceRecord');
const Unit              = require('../models/Unit');
const Student           = require('../models/Student');
const UnitRegistration  = require('../models/UnitRegistration');
const Semester          = require('../models/Semester');

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

// Verify that the requesting user is the lecturer for this unit.
async function assertLecturerOwnsUnit(req, res, unitId) {
  const unit = await Unit.findById(unitId);
  if (!unit) { res.status(404).json({ message: 'Unit not found' }); return null; }
  if (String(unit.lecturerId) !== String(req.user._id)) {
    res.status(403).json({ message: 'You do not teach this unit' });
    return null;
  }
  return unit;
}

// Get the list of students enrolled in a unit for the current semester.
async function getEnrolledStudents(unitId, semester) {
  const enrollments = await UnitRegistration.find({
    unitIds: unitId,
    semester,
    status: 'approved',
  }).populate('studentId', 'studentNumber personalInfo');
  return enrollments.map((e) => e.studentId).filter(Boolean);
}

// ---------------------------------------------------------------------------
// LECTURER
// ---------------------------------------------------------------------------

// GET /api/lecturer/units/:unitId/sessions
exports.listSessions = async (req, res) => {
  try {
    const unit = await assertLecturerOwnsUnit(req, res, req.params.unitId);
    if (!unit) return;

    const semester = await Semester.findOne({ isCurrent: true });
    if (!semester) return res.status(400).json({ message: 'No current semester' });

    const sessions = await AttendanceSession
      .find({ unitId: unit._id, semester: semester.code })
      .sort({ date: -1 });

    // Attach attendance count per session
    const sessionIds = sessions.map((s) => s._id);
    const counts = await AttendanceRecord.aggregate([
      { $match: { sessionId: { $in: sessionIds }, status: { $in: ['present', 'late'] } } },
      { $group: { _id: '$sessionId', n: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));

    const total = (await getEnrolledStudents(unit._id, semester.code)).length;

    res.json({
      semester: semester.code,
      unit: { _id: unit._id, code: unit.code, name: unit.name },
      totalStudents: total,
      sessions: sessions.map((s) => ({
        _id: s._id,
        date: s.date,
        topic: s.topic,
        note: s.note,
        markedAt: s.markedAt,
        presentCount: countMap[String(s._id)] || 0,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/lecturer/units/:unitId/sessions   { date, topic?, note? }
exports.createSession = async (req, res) => {
  try {
    const unit = await assertLecturerOwnsUnit(req, res, req.params.unitId);
    if (!unit) return;

    const semester = await Semester.findOne({ isCurrent: true });
    if (!semester) return res.status(400).json({ message: 'No current semester' });

    const { date, topic, note } = req.body;
    if (!date) return res.status(400).json({ message: 'date required' });

    const session = await AttendanceSession.create({
      unitId: unit._id,
      semester: semester.code,
      date: new Date(date),
      topic: (topic || '').trim(),
      note:  (note || '').trim(),
      markedBy: req.user._id,
    });

    res.status(201).json(session);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'A session already exists for this date' });
    }
    res.status(500).json({ message: err.message });
  }
};

// GET /api/lecturer/units/:unitId/sessions/:sessionId
// Returns the session + all enrolled students + their current status.
exports.getSession = async (req, res) => {
  try {
    const unit = await assertLecturerOwnsUnit(req, res, req.params.unitId);
    if (!unit) return;

    const session = await AttendanceSession.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const students = await getEnrolledStudents(unit._id, session.semester);
    const records = await AttendanceRecord.find({ sessionId: session._id });
    const statusMap = Object.fromEntries(records.map((r) => [String(r.studentId), r.status]));

    res.json({
      session: {
        _id: session._id,
        date: session.date,
        topic: session.topic,
        note: session.note,
        markedAt: session.markedAt,
      },
      students: students.map((s) => ({
        _id: s._id,
        studentNumber: s.studentNumber,
        name: [s.personalInfo?.title, s.personalInfo?.surname, s.personalInfo?.lastName]
          .filter(Boolean).join(' ') || 'Unnamed',
        status: statusMap[String(s._id)] || 'present',   // default present
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/lecturer/units/:unitId/sessions/:sessionId
// Body: { records: [{ studentId, status, note? }] }
exports.saveSession = async (req, res) => {
  try {
    const unit = await assertLecturerOwnsUnit(req, res, req.params.unitId);
    if (!unit) return;

    const session = await AttendanceSession.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const { records } = req.body || {};
    if (!Array.isArray(records)) {
      return res.status(400).json({ message: 'records array required' });
    }

    let saved = 0;
    for (const r of records) {
      if (!r.studentId) continue;
      const status = ['present', 'absent', 'late', 'excused'].includes(r.status)
        ? r.status : 'present';

      await AttendanceRecord.findOneAndUpdate(
        { sessionId: session._id, studentId: r.studentId },
        {
          $set: {
            unitId: unit._id,
            status,
            note: r.note || '',
            markedBy: req.user._id,
            markedAt: new Date(),
          },
        },
        { upsert: true, returnDocument: 'after' }
      );
      saved++;
    }

    session.markedAt = new Date();
    session.markedBy = req.user._id;
    await session.save();

    res.json({ saved });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/lecturer/units/:unitId/sessions/:sessionId
exports.deleteSession = async (req, res) => {
  try {
    const unit = await assertLecturerOwnsUnit(req, res, req.params.unitId);
    if (!unit) return;

    const session = await AttendanceSession.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    await AttendanceRecord.deleteMany({ sessionId: session._id });
    await AttendanceSession.findByIdAndDelete(session._id);

    res.json({ message: 'Session deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------------------------------------
// STUDENT
// ---------------------------------------------------------------------------

// GET /api/units/me/attendance
// Percentage summary per registered unit.
exports.getMyAttendanceSummary = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const semester = await Semester.findOne({ isCurrent: true });
    if (!semester) return res.json({ semester: null, units: [] });

    const reg = await UnitRegistration.findOne({
      studentId: student._id,
      semester: semester.code,
      status: 'approved',
    }).populate('unitIds', 'code name credits');

    if (!reg) return res.json({ semester: semester.code, units: [] });

    const results = [];

    for (const unit of reg.unitIds) {
      const totalSessions = await AttendanceSession.countDocuments({
        unitId: unit._id,
        semester: semester.code,
      });

      const myRecords = await AttendanceRecord.find({
        unitId: unit._id,
        studentId: student._id,
      });

      const attended = myRecords.filter((r) => r.status === 'present' || r.status === 'late').length;
      const percentage = totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : null;

      results.push({
        unit: { _id: unit._id, code: unit.code, name: unit.name, credits: unit.credits },
        totalSessions,
        attended,
        percentage,
      });
    }

    res.json({ semester: semester.code, units: results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/units/me/attendance/:unitId
// Full session list for one unit + this student's status in each.
exports.getMyAttendanceDetail = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const unit = await Unit.findById(req.params.unitId);
    if (!unit) return res.status(404).json({ message: 'Unit not found' });

    const semester = await Semester.findOne({ isCurrent: true });
    if (!semester) return res.status(400).json({ message: 'No current semester' });

    const sessions = await AttendanceSession
      .find({ unitId: unit._id, semester: semester.code })
      .sort({ date: -1 });

    const records = await AttendanceRecord.find({
      unitId: unit._id,
      studentId: student._id,
    });
    const statusMap = Object.fromEntries(records.map((r) => [String(r.sessionId), r.status]));

    res.json({
      unit: { _id: unit._id, code: unit.code, name: unit.name },
      sessions: sessions.map((s) => ({
        _id: s._id,
        date: s.date,
        topic: s.topic,
        status: statusMap[String(s._id)] || 'unmarked',
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
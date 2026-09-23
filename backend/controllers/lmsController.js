const Student          = require('../models/Student');
const Semester         = require('../models/Semester');
const UnitRegistration = require('../models/UnitRegistration');
const Unit             = require('../models/Unit');
const Programme        = require('../models/Programme');

// ---------------------------------------------------------------------------
// GET /api/lms/me/dashboard
// Student overview: name, programme, semester, course count, placeholder
// data for upcoming deadlines / announcements / today's classes.
// ---------------------------------------------------------------------------
exports.getMyDashboard = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id })
      .populate('programmeInfo.programme');
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const semester = await Semester.findOne({ isCurrent: true });
    if (!semester) {
      return res.json({
        student: { name: '', studentNumber: student.studentNumber, semester: null },
        coursesCount: 0,
        recentAnnouncements: [],
        upcomingDeadlines: [],
        todayClasses: [],
      });
    }

    const reg = await UnitRegistration.findOne({
      studentId: student._id,
      semester: semester.code,
      status: 'approved',
    }).populate('unitIds', 'code name credits');

    const coursesCount = reg?.unitIds?.length || 0;

    const name = [
      student.personalInfo?.title,
      student.personalInfo?.surname,
      student.personalInfo?.lastName,
    ].filter(Boolean).join(' ') || 'Student';

    res.json({
      student: {
        name,
        studentNumber: student.studentNumber,
        schoolEmail: student.schoolEmail,
        semester: semester.code,
        academicYear: semester.academicYear,
        programme: student.programmeInfo?.programme
          ? { name: student.programmeInfo.programme.name, code: student.programmeInfo.programme.code }
          : null,
      },
      coursesCount,
      recentAnnouncements: [],  // filled in Phase J
      upcomingDeadlines:   [],  // filled in Phase I (Assignments)
      todayClasses:        [],  // filled in Phase H (Timetable)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------------------------------------
// GET /api/lms/me/courses
// Student's approved units for the current semester, with lecturer info
// and enrolled-at timestamp.
// ---------------------------------------------------------------------------
exports.getMyCourses = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const semester = await Semester.findOne({ isCurrent: true });
    if (!semester) return res.json({ semester: null, courses: [] });

    const reg = await UnitRegistration.findOne({
      studentId: student._id,
      semester: semester.code,
      status: 'approved',
    })
      .populate({
        path: 'unitIds',
        select: 'code name credits semester type lecturerId programmeIds',
        populate: { path: 'lecturerId', select: 'email username schoolEmail' },
      });

    if (!reg || !reg.unitIds) return res.json({ semester: semester.code, courses: [] });

    const courses = reg.unitIds.map((unit) => ({
      unit: {
        _id:     unit._id,
        code:    unit.code,
        name:    unit.name,
        credits: unit.credits,
        type:    unit.type,
        semester: unit.semester,
      },
      lecturer: unit.lecturerId ? {
        email:       unit.lecturerId.email,
        username:    unit.lecturerId.username,
        schoolEmail: unit.lecturerId.schoolEmail,
      } : null,
      schedule:  [],   // filled in Phase H (Timetable)
    }));

    res.json({
      semester: semester.code,
      academicYear: semester.academicYear,
      courses,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const Unit             = require('../models/Unit');
const Semester         = require('../models/Semester');
const UnitRegistration = require('../models/UnitRegistration');
const Student          = require('../models/Student');

const MIN_UNITS = 6;
const MAX_UNITS = 8;

// Validate a registration's unit count against the min/max rules.
// Returns { valid, reason } — reason is null if valid.
function validateUnitCount(registration) {
  const count = (registration.unitIds || []).length;

  if (count > MAX_UNITS) {
    return { valid: false, reason: `Maximum ${MAX_UNITS} units allowed (you have ${count})` };
  }

  if (count < MIN_UNITS && !registration.exemptionApproved) {
    return {
      valid: false,
      reason: `Minimum ${MIN_UNITS} units required (you have ${count}). Contact academics if you have unit exemptions.`,
    };
  }

  return { valid: true, reason: null };
}

// Auto-create a registration for a student at enrollment time.
// Enrolls to all core units for their programme in the current semester,
// skipping any exempted units. Returns the created registration or null.
async function autoEnrollNewStudent(student) {
  try {
    // Requires a programme on the student
    const programmeId = student.programmeInfo?.programme;
    if (!programmeId) return null;

    // Requires a current semester
    const semester = await Semester.findOne({ isCurrent: true });
    if (!semester) return null;

    // Find core units for that programme in the "semester number" the student starts at.
    // For a brand-new student we assume semester 1 of the programme.
    // (Change this to use student.programmeInfo.currentSemester if you track that.)
    const units = await Unit.find({
      programmeIds: programmeId,
      semester: 1,
      type: 'core',
    }).select('_id');

    const exempted = (student.exemptedUnitIds || []).map((id) => String(id));
    const eligible = units
      .map((u) => u._id)
      .filter((id) => !exempted.includes(String(id)));

    // Create a registration, pre-approved, marked as auto
    const reg = await UnitRegistration.create({
      studentId:     student._id,
      studentNumber: student.studentNumber,
      semester:      semester.code,
      academicYear:  semester.academicYear,
      unitIds:       eligible,
      status:        'approved',
      approvedAt:    new Date(),
      source:        'auto',
    });

    return reg;
  } catch (err) {
    // Duplicate key = already registered; ignore
    if (err.code === 11000) return null;
    console.error('autoEnrollNewStudent failed:', err.message);
    return null;
  }
}

module.exports = {
  MIN_UNITS,
  MAX_UNITS,
  validateUnitCount,
  autoEnrollNewStudent,
};

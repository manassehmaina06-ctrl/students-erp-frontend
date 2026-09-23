const Unit          = require('../models/Unit');
const UnitEnrollment = require('../models/UnitEnrollment');
const Semester      = require('../models/Semester');

// GET /api/lecturer/me
exports.getMyProfile = async (req, res) => {
  res.json({
    _id:      req.user._id,
    email:    req.user.email,
    username: req.user.username,
    role:     req.user.role,
  });
};

// GET /api/lecturer/me/units
exports.getMyUnits = async (req, res) => {
  try {
    const units = await Unit.find({ lecturerId: req.user._id })
      .populate('programmeIds', 'name code')
      .sort({ code: 1 })
      .lean();

    // Attach enrollment count per unit
    const unitIds = units.map((u) => u._id);
    const counts = await UnitEnrollment.aggregate([
      { $match: { unitId: { $in: unitIds }, status: 'enrolled' } },
      { $group: { _id: '$unitId', n: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));

    res.json(units.map((u) => ({
      ...u,
      enrolledCount: countMap[String(u._id)] || 0,
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/lecturer/me/current-semester
exports.getCurrentSemester = async (req, res) => {
  try {
    const sem = await Semester.findOne({ isCurrent: true }).lean();
    res.json(sem || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

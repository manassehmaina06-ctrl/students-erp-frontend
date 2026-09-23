const mongoose = require('mongoose');

const UnitEnrollmentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  unitId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Unit',    required: true, index: true },

  semester:     { type: String, required: true, index: true }, // "2026-S1"
  academicYear: String,

  status: {
    type: String,
    enum: ['enrolled', 'dropped', 'completed'],
    default: 'enrolled',
  },

  enrolledAt:  { type: Date, default: Date.now },
  droppedAt:   Date,
});

// Prevent duplicate enrollment for the same student+unit+semester
UnitEnrollmentSchema.index({ studentId: 1, unitId: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('UnitEnrollment', UnitEnrollmentSchema);

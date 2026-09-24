const mongoose = require('mongoose');

const AttendanceRecordSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AttendanceSession', required: true, index: true },
  unitId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true, index: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },

  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'excused'],
    default: 'present',
  },

  note: String,

  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  markedAt: { type: Date, default: Date.now },
});

// One record per student per session
AttendanceRecordSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });

// Common aggregate: attendance per student per unit
AttendanceRecordSchema.index({ studentId: 1, unitId: 1 });

module.exports = mongoose.model('AttendanceRecord', AttendanceRecordSchema);

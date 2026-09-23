const mongoose = require('mongoose');

const AttendanceSessionSchema = new mongoose.Schema({
  unitId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true, index: true },
  semester:  { type: String, required: true, index: true },

  date:  { type: Date, required: true },
  topic: { type: String, trim: true },   // e.g. "Introduction to loops"
  note:  String,

  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  markedAt: { type: Date, default: Date.now },

  createdAt: { type: Date, default: Date.now },
});

// One session per unit per date
AttendanceSessionSchema.index({ unitId: 1, semester: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('AttendanceSession', AttendanceSessionSchema);
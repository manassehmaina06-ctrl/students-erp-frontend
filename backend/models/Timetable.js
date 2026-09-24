const mongoose = require('mongoose');

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const TimetableSchema = new mongoose.Schema({
  unitId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true, index: true },
  semester: { type: String, required: true, index: true },

  day:       { type: String, enum: DAYS, required: true },
  startTime: { type: String, required: true },   // "HH:MM" 24h
  endTime:   { type: String, required: true },   // "HH:MM"

  room:     { type: String, trim: true },
  building: { type: String, trim: true },
  note:     String,

  lecturerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

// Fast lookup: all slots for a unit + semester
TimetableSchema.index({ unitId: 1, semester: 1, day: 1, startTime: 1 });

TimetableSchema.statics.DAYS = DAYS;

module.exports = mongoose.model('Timetable', TimetableSchema);
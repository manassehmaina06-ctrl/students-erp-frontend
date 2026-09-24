const mongoose = require('mongoose');

const AssessmentSchema = new mongoose.Schema({
  unitId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true, index: true },
  semester: { type: String, required: true, index: true },

  name: { type: String, required: true, trim: true },  // "Assignment 1", "CAT 2", "Final Exam"

  type: {
    type: String,
    enum: ['assignment', 'cat', 'exam', 'project', 'practical'],
    required: true,
  },

  number: { type: Number, default: 1 },   // Ass 1, Ass 2, ...
  weight: { type: Number, required: true, min: 0, max: 100 },  // percent
  maxScore: { type: Number, default: 100, min: 1 },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

// One assessment with the same name per unit+semester
AssessmentSchema.index({ unitId: 1, semester: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Assessment', AssessmentSchema);

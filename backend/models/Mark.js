const mongoose = require('mongoose');

const MarkSchema = new mongoose.Schema({
  studentId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  unitId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true, index: true },
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true, index: true },
  semester:     { type: String, required: true, index: true },

  score:   { type: Number, min: 0 },     // raw score, validated <= assessment.maxScore in controller
  comment: String,                        // lecturer feedback

  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  gradedAt: { type: Date, default: Date.now },
});

// One mark per student per assessment
MarkSchema.index({ studentId: 1, assessmentId: 1 }, { unique: true });

module.exports = mongoose.model('Mark', MarkSchema);

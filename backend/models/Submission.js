const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true, index: true },
  studentId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  unitId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true, index: true },
  semester:     { type: String, required: true, index: true },

  filePath: String,
  fileName: String,
  fileSize: Number,
  mimeType: String,
  note:     String,

  submittedAt: { type: Date, default: Date.now },
  isLate:      { type: Boolean, default: false },

  // Grading
  score:    { type: Number, default: null },   // 0..maxScore
  feedback: String,
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  gradedAt: Date,

  status: {
    type: String,
    enum: ['submitted', 'graded'],
    default: 'submitted',
    index: true,
  },
});

// One submission per student per assignment (resubmission replaces the same doc)
SubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('Submission', SubmissionSchema);
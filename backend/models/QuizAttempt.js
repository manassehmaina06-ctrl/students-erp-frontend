const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuizQuestion', required: true },
  // For mcq/tf: index chosen. For short: text
  selectedIndex: { type: Number, default: null },
  text:          { type: String, default: '' },
  // Grading
  autoScore:  { type: Number, default: 0 },
  manualScore: { type: Number, default: null },
  feedback:   { type: String, default: '' },
}, { _id: false });

const QuizAttemptSchema = new mongoose.Schema({
  quizId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  unitId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true, index: true },
  semester:  { type: String, required: true },

  answers: [AnswerSchema],

  startedAt:   { type: Date, default: Date.now },
  submittedAt: Date,
  expiresAt:   { type: Date, required: true },

  // Scoring
  autoScore:   { type: Number, default: 0 },   // sum of auto points
  manualScore: { type: Number, default: 0 },   // sum of manual points (graded by lecturer)
  maxScore:    { type: Number, default: 0 },
  percent:     { type: Number, default: 0 },

  status: {
    type: String,
    enum: ['in-progress', 'submitted', 'graded', 'expired'],
    default: 'in-progress',
    index: true,
  },

  gradedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  gradedAt:  Date,
});

QuizAttemptSchema.index({ quizId: 1, studentId: 1 });

module.exports = mongoose.model('QuizAttempt', QuizAttemptSchema);

const mongoose = require('mongoose');

const QuizSchema = new mongoose.Schema({
  unitId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true, index: true },
  semester:   { type: String, required: true, index: true },
  createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  title:       { type: String, required: true, trim: true },
  description: String,

  // Timing
  durationMinutes: { type: Number, required: true, default: 30 },
  startAt:         Date,
  endAt:           Date,

  // Rules
  maxAttempts:  { type: Number, default: 1, min: 1, max: 5 },
  passScore:    { type: Number, default: 50 }, // percent
  shuffleQuestions: { type: Boolean, default: false },
  showScoreImmediately: { type: Boolean, default: true },
  showCorrectAnswers:   { type: Boolean, default: false },

  // Marks integration
  linkToAssessment: { type: Boolean, default: false },
  assessmentId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', default: null },
  weight:           { type: Number, default: 0 },

  status: {
    type: String,
    enum: ['draft', 'published', 'closed'],
    default: 'draft',
    index: true,
  },

  publishedAt: Date,
  createdAt:   { type: Date, default: Date.now },
  updatedAt:   { type: Date, default: Date.now },
});

module.exports = mongoose.model('Quiz', QuizSchema);

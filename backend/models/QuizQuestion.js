const mongoose = require('mongoose');

const QuizQuestionSchema = new mongoose.Schema({
  quizId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
  order:   { type: Number, required: true, default: 1 },

  type: {
    type: String,
    enum: ['mcq', 'truefalse', 'short'],
    required: true,
  },

  question: { type: String, required: true },

  // For MCQ: array of options. For truefalse: [{label:'True'},{label:'False'}]
  options: [{ label: String }],

  // For MCQ/TF: index of correct option. For short: not used.
  correctIndex: { type: Number, default: null },

  // For short answer: model answer (for reference only, not auto-graded)
  expectedAnswer: String,

  points: { type: Number, required: true, default: 1 },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('QuizQuestion', QuizQuestionSchema);

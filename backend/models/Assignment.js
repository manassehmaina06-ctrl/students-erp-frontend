const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
  unitId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true, index: true },
  semester: { type: String, required: true, index: true },

  title:       { type: String, required: true, trim: true },
  description: String,

  dueDate:  { type: Date, required: true },
  maxScore: { type: Number, default: 100, min: 1 },

  // Lecturer's optional attachment (brief, rubric, etc.)
  attachmentPath: String,
  attachmentName: String,
  attachmentSize: Number,
  attachmentType: String,

  // Lifecycle
  //   'draft'     → visible only to the lecturer
  //   'published' → visible to students, accepts submissions
  //   'closed'    → visible, no more submissions
  status: {
    type: String,
    enum: ['draft', 'published', 'closed'],
    default: 'draft',
    index: true,
  },
  publishedAt: Date,
  closedAt:    Date,

  // Marks integration — when linked, this assignment creates/updates an Assessment
  linkToAssessment: { type: Boolean, default: false },
  assessmentId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', default: null },
  weight:           { type: Number, default: 0, min: 0, max: 100 },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

// Same title can't repeat within a unit + semester
AssignmentSchema.index({ unitId: 1, semester: 1, title: 1 }, { unique: true });

module.exports = mongoose.model('Assignment', AssignmentSchema);
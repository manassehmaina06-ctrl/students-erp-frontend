const mongoose = require('mongoose');

const UnitSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true }, // "CS101"
  name: { type: String, required: true, trim: true },

  // D4=B: units can serve multiple programmes
  programmeIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Programme', index: true }],

  semester: { type: Number, required: true, min: 1 },  // which semester of the programme it's taught
  credits:  { type: Number, default: 3, min: 0 },

  type:        { type: String, enum: ['core', 'elective'], default: 'core' },
  description: String,

  // D3=A: one primary lecturer
  lecturerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Unit', UnitSchema);

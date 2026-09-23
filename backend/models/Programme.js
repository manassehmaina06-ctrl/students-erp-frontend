const mongoose = require('mongoose');

const ProgrammeSchema = new mongoose.Schema({
  name: String,
  code: String,
  department: String,
  duration: Number, // semesters
  fee: Number,
  description: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Programme', ProgrammeSchema);
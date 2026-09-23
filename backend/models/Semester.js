const mongoose = require('mongoose');

const SemesterSchema = new mongoose.Schema({
  code:         { type: String, required: true, unique: true }, // "2026-S1"
  academicYear: { type: String, required: true },                // "2026/2027"

  startDate: Date,
  endDate:   Date,

  registrationOpen:   { type: Boolean, default: false },
  registrationOpensAt: Date,
  registrationClosesAt: Date,

  isCurrent: { type: Boolean, default: false, index: true },

  createdAt: { type: Date, default: Date.now },
});

// Enforce only one current semester at a time
SemesterSchema.pre('save', async function () {
  if (this.isModified('isCurrent') && this.isCurrent) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { $set: { isCurrent: false } }
    );
  }
});

module.exports = mongoose.model('Semester', SemesterSchema);

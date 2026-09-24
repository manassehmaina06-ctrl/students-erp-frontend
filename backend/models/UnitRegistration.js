const mongoose = require('mongoose');

const UnitRegistrationSchema = new mongoose.Schema({
  studentId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  studentNumber: String,

  semester:     { type: String, required: true, index: true }, // "2026-S1"
  academicYear: String,

  unitIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Unit' }],

  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected'],
    default: 'draft',
    index: true,
  },

  // Set when a student's unit count is below 6 with approval (exemptions)
  exemptionApproved: { type: Boolean, default: false },
  exemptionReason:   String,

  // Audit
  submittedAt:  Date,
  approvedAt:   Date,
  approvedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: String,

  // How this registration was created
  //   'auto'     → system auto-enrolled at student enrollment
  //   'self'     → student used the portal
  //   'academic' → academic registered on behalf of the student
  source: {
    type: String,
    enum: ['auto', 'self', 'academic'],
    default: 'self',
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

UnitRegistrationSchema.pre('save', function () {
  this.updatedAt = new Date();
});

// One registration per student per semester
UnitRegistrationSchema.index({ studentId: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('UnitRegistration', UnitRegistrationSchema);

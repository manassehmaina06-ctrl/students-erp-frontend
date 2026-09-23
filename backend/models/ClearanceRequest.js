const mongoose = require('mongoose');

const OFFICES = ['finance', 'library', 'exam', 'hostel', 'department', 'registrar'];

const OfficeSchema = new mongoose.Schema({
  office: { type: String, enum: OFFICES, required: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  note:    String,
  actedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  actedAt: Date,

  autoFilled:    { type: Boolean, default: false },
  autoVerdict:   String,
  autoBreakdown: Object,
}, { _id: false });

const ClearanceRequestSchema = new mongoose.Schema({
  studentId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  studentNumber: String,

  reason: {
    type: String,
    enum: ['graduation', 'end_of_semester', 'leave_of_absence', 'transfer'],
    required: true,
  },
  note: String,

  semester:     String,
  academicYear: String,

  status: {
    type: String,
    enum: ['pending', 'cleared', 'rejected', 'cancelled'],
    default: 'pending',
    index: true,
  },

  offices: { type: [OfficeSchema], default: [] },

  certificateNumber:   { type: String, unique: true, sparse: true },
  certificateIssuedAt: Date,
  certificatePayload:  Object,

  requestedAt: { type: Date, default: Date.now },
  completedAt: Date,
});

ClearanceRequestSchema.index({ studentId: 1, status: 1 });

ClearanceRequestSchema.statics.OFFICES = OFFICES;

module.exports = mongoose.model('ClearanceRequest', ClearanceRequestSchema);

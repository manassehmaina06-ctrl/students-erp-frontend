const mongoose = require('mongoose');

const STATUSES = [
  'draft', 'submitted', 'pending_approval', 'approved',
  'finance_review', 'payment_validated', 'admitted',
  'rejected', 'enrolled',
];

const ApplicationSchema = new mongoose.Schema({
  studentId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  programmeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Programme' },

  applicationNumber: { type: String, unique: true, index: true, sparse: true },
  studentNumber:     { type: String, unique: true, index: true, sparse: true },

  // Application fee (Stage 1) — set by finance during payment_validated
  applicationFeeCode: { type: String, unique: true, index: true, sparse: true },
  applicationFee:     { type: Number, default: 0 },
  applicationFeePaid: { type: Number, default: 0 },

  status: { type: String, enum: STATUSES, default: 'draft' },
  statusHistory: [{
    status: String,
    by:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role:   String,
    at:     { type: Date, default: Date.now },
    note:   String,
  }],

  submittedAt:  Date,
  reviewedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt:   Date,
  admittedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  admittedAt:   Date,

  paymentValidatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  paymentValidatedAt: Date,
  paidAt:             Date,

  comments: String,
  createdAt: { type: Date, default: Date.now },
});

ApplicationSchema.statics.STATUSES = STATUSES;

module.exports = mongoose.model('Application', ApplicationSchema);

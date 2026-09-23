const mongoose = require('mongoose');

const SubjectGradeSchema = new mongoose.Schema({ subject: String, grade: String });
const EducationSchema = new mongoose.Schema({
  course: String, institution: String, qualification: String, year: Number,
});
const ExperienceSchema = new mongoose.Schema({
  company: String, jobTitle: String, years: Number,
});

const PaymentSchema = new mongoose.Schema({
  amount:     { type: Number, required: true },
  method:     { type: String, enum: ['bank', 'mpesa', 'cheque'], required: true },
  reference:  String,
  note:       String,

  // Workflow status
  //   'pending'   → student submitted, awaiting finance confirmation
  //   'confirmed' → finance approved, counts toward balance
  //   'rejected'  → finance rejected, does NOT count
  // Default 'confirmed' keeps existing finance-created payments counting.
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'rejected'],
    default: 'confirmed',
  },
  submittedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  recordedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  confirmedAt:     Date,
  rejectionReason: String,
// NEW — receipt issued on confirmation
  receiptNumber:   { type: String, unique: true, sparse: true, index: true },
  receiptIssuedAt: Date,
  receiptIssuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  paidAt: { type: Date, default: Date.now },
});

const BillingSchema = new mongoose.Schema({
  reference: String,
  label:     String,
  amount:    { type: Number, default: 0 },

  // Semester tagging
  semester:     String,   // e.g. "2026-S1"
  academicYear: String,   // e.g. "2026/2027"

  // Student-facing detail
  description: String,
  category:    { type: String, default: 'General' },
  dueDate:     Date,

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});

const StudentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  applicationNumber: { type: String, unique: true, sparse: true },
  studentNumber:     { type: String, unique: true, sparse: true, index: true },

  personalInfo: {
    title: String, surname: String, lastName: String, dob: Date,
    gender: String, maritalStatus: String, nationality: String,
    countryOfOrigin: String, homeTown: String, mobile: String, email: String,
    address: String, idNumber: String, birthCertNo: String, campus: String,
  },
  enrolledAt:      Date,
  currentSemester: String,   // e.g. "2026-S1"
  createdAt:       { type: Date, default: Date.now },
  programmeInfo: {
    modeOfStudy: String,
    programme: { type: mongoose.Schema.Types.ObjectId, ref: 'Programme' },
  },
  enrolledAt:      Date,
  currentSemester: String,   // e.g. "2026-S1"
  exemptedUnitIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Unit' }],  // ← add this
  createdAt:       { type: Date, default: Date.now },
  guardianInfo: { name: String, mobile: String, relationship: String },

  highSchoolInfo: {
    highSchool: String, examBody: String, yearOfExam: Number,
    level: String, meanGrade: String,
    subjects: [SubjectGradeSchema],
  },

  educationBackground: [EducationSchema],
  experience: [ExperienceSchema],
  documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],

  applicationStatus: {
    type: String,
    enum: ['draft', 'pending_app_fee', 'submitted', 'reviewing', 'accepted', 'rejected'],
    default: 'draft',
  },

  feeStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'waived'],
    default: 'pending',
  },

  fees: {
    total:    { type: Number, default: 0 },
    paid:     { type: Number, default: 0 },
    balance:  { type: Number, default: 0 },
    currency: { type: String, default: 'KES' },
  },
schoolEmail: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  billings: [BillingSchema],
  payments: [PaymentSchema],

  enrolledAt: Date,
  createdAt:  { type: Date, default: Date.now },
});

module.exports = mongoose.model('Student', StudentSchema);

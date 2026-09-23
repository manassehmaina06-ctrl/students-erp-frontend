const mongoose = require('mongoose');

const SubjectGradeSchema = new mongoose.Schema({
  subject: String,
  grade: String,
});

const EducationSchema = new mongoose.Schema({
  course: String,
  institution: String,
  qualification: String,
  year: Number,
});

const ExperienceSchema = new mongoose.Schema({
  company: String,
  jobTitle: String,
  years: Number,

});

const StudentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  applicationNumber: { type: String, unique: true, sparse: true },
  studentNumber:     { type: String, unique: true, sparse: true, index: true },
  personalInfo: {
    title: String,
    surname: String,
    lastName: String,
    dob: Date,
    gender: String,
    maritalStatus: String,
    nationality: String,
    countryOfOrigin: String,
    homeTown: String,
    mobile: String,
    email: String,
    address: String,
    idNumber: String,
    birthCertNo: String,
    campus: String,
  },

  programmeInfo: {
    modeOfStudy: String,
    programme: { type: mongoose.Schema.Types.ObjectId, ref: 'Programme' },
  },

  guardianInfo: {
    name: String,
    mobile: String,
    relationship: String,
  },

  highSchoolInfo: {
    highSchool: String,
    examBody: String,
    yearOfExam: Number,
    level: String,
    meanGrade: String,
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
    enum: ['pending', 'paid', 'waived'],
    default: 'pending',
  },

  createdAt: { type: Date, default: Date.now },
});
  feeStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'waived'],
    default: 'pending',
  },

  fees: {
    total:   { type: Number, default: 0 },
    paid:    { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    currency:{ type: String, default: 'KES' },
    items: [{
      label:  String,
      amount: Number,
      paid:   { type: Number, default: 0 },
    }],
  },

  billings: [{
    reference: String,
    amount:    Number,
    status:    { type: String, enum: ['unpaid', 'paid', 'waived'], default: 'unpaid' },
    dueDate:   Date,
    paidAt:    Date,
    createdAt: { type: Date, default: Date.now },
  }],

  enrolledAt: Date,
module.exports = mongoose.model('Student', StudentSchema);

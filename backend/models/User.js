const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  username: { type: String, unique: true, sparse: true, trim: true }, 
  schoolEmail: { type: String, unique: true, sparse: true, lowercase: true, trim: true }, // = studentNumber after enrollment
password:        { type: String, required: true },
studentPassword: { type: String },   // set at enrollment; used for student number + school email login
  role: {
    type: String,
    enum: ['student', 'admissions', 'academic', 'finance', 'lecturer'],
    default: 'student',
  },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  enrolled:  { type: Boolean, default: false },  // true once finance enrolls them
  createdAt: { type: Date, default: Date.now },
});

UserSchema.pre('save', async function () {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  if (this.isModified('studentPassword') && this.studentPassword) {
    const salt = await bcrypt.genSalt(10);
    this.studentPassword = await bcrypt.hash(this.studentPassword, salt);
  }
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.matchStudentPassword = async function (enteredPassword) {
  if (!this.studentPassword) return false;
  return await bcrypt.compare(enteredPassword, this.studentPassword);
};

module.exports = mongoose.model('User', UserSchema);
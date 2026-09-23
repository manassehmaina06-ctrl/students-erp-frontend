const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  name: String,
  filePath: String,
  fileType: String,
  uploadedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Document', DocumentSchema);
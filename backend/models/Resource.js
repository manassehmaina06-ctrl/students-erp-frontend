const mongoose = require('mongoose');

const CATEGORIES = ['lecture_notes', 'past_papers', 'slides', 'reading_list', 'other'];

const ResourceSchema = new mongoose.Schema({
  unitId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true, index: true },
  semester: { type: String, required: true, index: true },

  title:       { type: String, required: true, trim: true },
  description: String,
  category: {
    type: String,
    enum: CATEGORIES,
    default: 'lecture_notes',
  },

  filePath: String,    // relative path: uploads/resources/...
  fileName: String,    // original name
  fileSize: Number,    // bytes
  mimeType: String,

  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  uploadedAt: { type: Date, default: Date.now },
});

ResourceSchema.statics.CATEGORIES = CATEGORIES;

module.exports = mongoose.model('Resource', ResourceSchema);
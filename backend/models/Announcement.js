const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
  unitId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Unit',    required: true, index: true },
  semester: { type: String, required: true, index: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true, index: true },

  title:    { type: String, required: true, trim: true },
  body:     { type: String, required: true },

  // Priority level — affects UI color/pinning
  priority: { type: String, enum: ['normal', 'important', 'urgent'], default: 'normal' },

  // Optional attachment (PDF, image, etc.)
  attachmentPath: String,
  attachmentName: String,

  // Soft-delete / archive flag
  archived: { type: Boolean, default: false, index: true },

  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Announcement', AnnouncementSchema);
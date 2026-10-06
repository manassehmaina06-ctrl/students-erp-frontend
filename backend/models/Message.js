const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  fromRole:   { type: String, required: true },
  toUserId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  toRole:     { type: String, required: true },
  unitId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', default: null, index: true },
  subject:    { type: String, trim: true, default: '' },
  body:       { type: String, required: true },
  parentId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null, index: true },
  readAt:     { type: Date, default: null, index: true },
  createdAt:  { type: Date, default: Date.now, index: true },
});

MessageSchema.index({ toUserId: 1, readAt: 1, createdAt: -1 });
module.exports = mongoose.model('Message', MessageSchema);

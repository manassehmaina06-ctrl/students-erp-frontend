const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  // Event type — lets the frontend render icons/colors
  //   payment.submitted   → to finance
  //   payment.confirmed   → to student
  //   payment.rejected    → to student (with reason)
  //   billing.added       → to student
  //   semester.billed     → to student
  //   application.admitted→ to applicant
  //   application.rejected→ to applicant
  //   enrollment.complete → to student (welcome + credentials)
  type: { type: String, required: true },

  title: { type: String, required: true },
  body:  String,
  link:  String,            // frontend route to navigate to on click

  read:    { type: Boolean, default: false, index: true },
  readAt:  Date,

  createdAt: { type: Date, default: Date.now, index: true },
});

module.exports = mongoose.model('Notification', NotificationSchema);

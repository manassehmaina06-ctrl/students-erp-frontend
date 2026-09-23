const Notification = require('../models/Notification');
const User = require('../models/User');

// Create one notification for a specific user
exports.notify = async (userId, { type, title, body, link }) => {
  if (!userId) return null;
  try {
    return await Notification.create({ userId, type, title, body, link });
  } catch (err) {
    console.error('notify() failed:', err.message);
    return null;
  }
};

// Create one notification for every user with a given role
exports.notifyRole = async (role, payload) => {
  try {
    const users = await User.find({ role }).select('_id');
    const docs = users.map((u) => ({ userId: u._id, ...payload }));
    if (docs.length === 0) return [];
    return await Notification.insertMany(docs);
  } catch (err) {
    console.error('notifyRole() failed:', err.message);
    return [];
  }
};

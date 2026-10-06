const express = require('express');
const { protect } = require('../middleware/auth');
const {
  sendMessage, getInbox, markRead, unreadCount, getContacts,
} = require('../controllers/messageController');

const router = express.Router();
router.get ('/inbox',        protect, getInbox);
router.get ('/unread-count', protect, unreadCount);
router.get ('/contacts',     protect, getContacts);
router.post('/',             protect, sendMessage);
router.post('/:id/read',     protect, markRead);

module.exports = router;

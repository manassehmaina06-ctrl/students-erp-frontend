const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getMine, getUnreadCount, markRead, markAllRead,
} = require('../controllers/notificationController');

const router = express.Router();

router.get ('/',               protect, getMine);
router.get ('/unread-count',   protect, getUnreadCount);
router.post('/read-all',       protect, markAllRead);
router.post('/:id/read',       protect, markRead);

module.exports = router;

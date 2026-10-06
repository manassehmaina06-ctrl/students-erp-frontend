const express = require('express');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const uploadAnnouncement = require('../config/multerAnnouncement');
const {
  createAnnouncement,
  listForUnit,
  updateAnnouncement,
  deleteAnnouncement,
} = require('../controllers/announcementController');

const router = express.Router();
const lecturerOnly = [protect, roleCheck(['lecturer'])];

// Mounted at /api/announcements in server.js
// Final URLs:
//   POST   /api/announcements/units/:unitId
//   GET    /api/announcements/units/:unitId
//   PUT    /api/announcements/:id
//   DELETE /api/announcements/:id

router.post  ('/units/:unitId', ...lecturerOnly, uploadAnnouncement.single('file'), createAnnouncement);
router.get   ('/units/:unitId', ...lecturerOnly, listForUnit);
router.put   ('/:id',           ...lecturerOnly, updateAnnouncement);
router.delete('/:id',           ...lecturerOnly, deleteAnnouncement);

module.exports = router;
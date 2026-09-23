const express = require('express');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const {
  getMine, createRequest, cancelMine, getMyCertificate,
  getQueue, getOne, approveGate, rejectGate, recheckFinance, listAll,
} = require('../controllers/clearanceController');

const router = express.Router();

// Student routes
router.get ('/me',              protect, roleCheck(['student']), getMine);
router.post('/me/request',      protect, roleCheck(['student']), createRequest);
router.post('/me/cancel',       protect, roleCheck(['student']), cancelMine);
router.get ('/me/certificate',  protect, roleCheck(['student']), getMyCertificate);

// Staff routes
router.get ('/queue',                   protect, roleCheck(['finance', 'academic']), getQueue);
router.get ('/all',                     protect, roleCheck(['academic']), listAll);
router.get ('/:id',                     protect, roleCheck(['finance', 'academic']), getOne);
router.post('/:id/office/:office/approve', protect, roleCheck(['finance', 'academic']), approveGate);
router.post('/:id/office/:office/reject',  protect, roleCheck(['finance', 'academic']), rejectGate);
router.post('/:id/recheck-finance',        protect, roleCheck(['academic']), recheckFinance);

module.exports = router;

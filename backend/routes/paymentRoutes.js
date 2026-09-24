const express = require('express');
const { protect } = require('../middleware/auth');
const { createPayment, confirmPayment } = require('../controllers/paymentController');
const router = express.Router();

router.post('/', protect, createPayment);
router.put('/confirm/:paymentId', protect, confirmPayment);

module.exports = router;
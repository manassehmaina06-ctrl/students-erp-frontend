const express = require('express');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const {
  addBilling, removeBilling, recordPayment,
  getMyLedger, submitMyPayment,
  getPendingPayments, confirmPayment, rejectPayment, updatePayment,
  billSemester,
  getStudentLedger,
  getClearanceVerdict,
    getMyReceiptPdf, 
    getReceiptPdf,
} = require('../controllers/feeController');

const router = express.Router();

// STUDENT PORTAL — /me routes MUST come before /:id routes
router.get ('/me/ledger',   protect, roleCheck(['student']), getMyLedger);
router.post('/me/payments', protect, roleCheck(['student']), submitMyPayment);

router.get ('/me/receipt/:receiptNumber', protect, roleCheck(['student']), getMyReceiptPdf);   // NEW
router.get ('/receipt/:receiptNumber', protect, roleCheck(['finance', 'admissions']), getReceiptPdf); 
// FINANCE — pending payment workflow
router.get  ('/pending',                        protect, roleCheck(['finance']), getPendingPayments);
router.post ('/payments/:paymentId/confirm',    protect, roleCheck(['finance']), confirmPayment);
router.post ('/payments/:paymentId/reject',     protect, roleCheck(['finance']), rejectPayment);
router.patch('/payments/:paymentId',            protect, roleCheck(['finance']), updatePayment);
// Near the other finance routes
router.get('/clearance/:studentId',
  protect,
  roleCheck(['finance', 'academic']),
  getClearanceVerdict);
// FINANCE-ONLY (existing — billings + manual payments)
router.post  ('/:id/billings',           protect, roleCheck(['finance']), addBilling);
router.delete('/:id/billings/:billId',   protect, roleCheck(['finance']), removeBilling);
router.post('/:id/semesters', protect, roleCheck(['finance']), billSemester);
router.post  ('/:id/payments',           protect, roleCheck(['finance']), recordPayment);

router.get('/:id/ledger', protect, roleCheck(['admissions', 'academic', 'finance']), getStudentLedger);

module.exports = router;
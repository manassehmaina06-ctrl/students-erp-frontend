const express = require('express');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { getMyMarks } = require('../controllers/marksController');
const {
  getMine, getAvailableUnits,
  startMine, addUnit, dropUnit, resetMine, submitMine,
} = require('../controllers/registrationController');

const router = express.Router();
const studentOnly = [protect, roleCheck(['student'])];

router.get   ('/me',                  ...studentOnly, getMine);
router.get   ('/available-units',     ...studentOnly, getAvailableUnits);
router.post  ('/me/start',            ...studentOnly, startMine);
router.post  ('/me/units',            ...studentOnly, addUnit);
router.delete('/me/units/:unitId',    ...studentOnly, dropUnit);
router.delete('/me',                  ...studentOnly, resetMine);
router.post  ('/me/submit',           ...studentOnly, submitMine);
router.get('/me/marks', ...studentOnly, getMyMarks);

module.exports = router;

const express = require('express');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { viewUnitMarksAcademic } = require('../controllers/marksController');
const {
  listAll: listRegistrations, approve: approveReg, reject: rejectReg,
  setExemptions, startForStudent, replaceUnits, setExemption,
} = require('../controllers/registrationController');
const {
  listStudents, listProgrammes, summary,
  listSemesters, createSemester, updateSemester, setCurrentSemester,
  listUnits, getUnit, createUnit, updateUnit, deleteUnit,
  listLecturers,
} = require('../controllers/academicController');

const {
  listUnitTimetable, createSlot, updateSlot, deleteSlot,
} = require('../controllers/timetableController');

const router = express.Router();
const academicOnly = [protect, roleCheck(['academic'])];

// Students & programmes
router.get('/students',   ...academicOnly, listStudents);
router.get('/programmes', ...academicOnly, listProgrammes);
router.get('/summary',    ...academicOnly, summary);
router.get('/lecturers',  ...academicOnly, listLecturers);

// Semesters
router.get ('/semesters',              ...academicOnly, listSemesters);
router.post('/semesters',              ...academicOnly, createSemester);
router.put ('/semesters/:id',          ...academicOnly, updateSemester);
router.post('/semesters/:id/set-current', ...academicOnly, setCurrentSemester);

// Units
router.get   ('/units',     ...academicOnly, listUnits);
router.get   ('/units/:id', ...academicOnly, getUnit);
router.post  ('/units',     ...academicOnly, createUnit);
router.put   ('/units/:id', ...academicOnly, updateUnit);
router.delete('/units/:id', ...academicOnly, deleteUnit);
router.get('/units/:unitId/marks', ...academicOnly, viewUnitMarksAcademic);


// Registrations
router.get ('/registrations',                    ...academicOnly, listRegistrations);
router.post('/registrations/:id/approve',        ...academicOnly, approveReg);
router.post('/registrations/:id/reject',         ...academicOnly, rejectReg);
router.post('/registrations/for-student',        ...academicOnly, startForStudent);
router.patch('/registrations/:id/units',         ...academicOnly, replaceUnits);
router.patch('/registrations/:id/exemption',     ...academicOnly, setExemption);

// Student exemptions
router.post('/students/:id/exemptions',          ...academicOnly, setExemptions);


// Timetable (academic)
router.get   ('/units/:unitId/timetable', ...academicOnly, listUnitTimetable);
router.post  ('/units/:unitId/timetable', ...academicOnly, createSlot);
router.put   ('/timetable/:slotId',       ...academicOnly, updateSlot);
router.delete('/timetable/:slotId',       ...academicOnly, deleteSlot);
module.exports = router;
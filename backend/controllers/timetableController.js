const Timetable         = require('../models/Timetable');
const Unit              = require('../models/Unit');
const Student           = require('../models/Student');
const Semester          = require('../models/Semester');
const UnitRegistration  = require('../models/UnitRegistration');

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

// HH:MM → minutes since midnight (for overlap math)
function toMinutes(hhmm) {
  const [h, m] = String(hhmm || '0:0').split(':').map((x) => parseInt(x, 10) || 0);
  return h * 60 + m;
}

// Do two time ranges overlap? [aStart, aEnd) vs [bStart, bEnd)
function overlaps(aStart, aEnd, bStart, bEnd) {
  const a1 = toMinutes(aStart), a2 = toMinutes(aEnd);
  const b1 = toMinutes(bStart), b2 = toMinutes(bEnd);
  return a1 < b2 && b1 < a2;
}

// Validate time format HH:MM and start < end
function isValidTime(hhmm) {
  return /^\d{1,2}:\d{2}$/.test(hhmm || '');
}

// Find any existing slot that conflicts with the given slot.
// Checks: (a) same unit same time, (b) same room same time,
//         (c) same lecturer same time.
// Excludes `excludeId` when editing an existing slot.
async function findConflict({ unitId, lecturerId, room, day, startTime, endTime, semester, excludeId }) {
  const query = {
    semester,
    day,
    _id: excludeId ? { $ne: excludeId } : { $exists: true },
  };

  const candidates = await Timetable.find(query).populate('unitId', 'code name');

  for (const slot of candidates) {
    const timeOverlap = overlaps(startTime, endTime, slot.startTime, slot.endTime);
    if (!timeOverlap) continue;

    if (String(slot.unitId?._id) === String(unitId)) {
      return { type: 'unit', slot, message: `This unit already has a class at that time on ${day.toUpperCase()}` };
    }
    if (lecturerId && slot.lecturerId && String(slot.lecturerId) === String(lecturerId)) {
      return { type: 'lecturer', slot, message: `The lecturer is already teaching ${slot.unitId?.code || 'another unit'} at that time` };
    }
    if (room && slot.room && slot.room.toLowerCase() === room.toLowerCase()) {
      return { type: 'room', slot, message: `Room "${room}" is already booked by ${slot.unitId?.code || 'another unit'} at that time` };
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// ACADEMIC
// ---------------------------------------------------------------------------

// GET /api/academic/units/:unitId/timetable
exports.listUnitTimetable = async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.unitId);
    if (!unit) return res.status(404).json({ message: 'Unit not found' });

    const semester = await Semester.findOne({ isCurrent: true });
    if (!semester) return res.status(400).json({ message: 'No current semester' });

    const slots = await Timetable
      .find({ unitId: unit._id, semester: semester.code })
      .sort({ day: 1, startTime: 1 });

    res.json({
      semester: semester.code,
      unit: { _id: unit._id, code: unit.code, name: unit.name },
      slots,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/academic/units/:unitId/timetable
// Body: { day, startTime, endTime, room?, building?, note? }
exports.createSlot = async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.unitId);
    if (!unit) return res.status(404).json({ message: 'Unit not found' });

    const semester = await Semester.findOne({ isCurrent: true });
    if (!semester) return res.status(400).json({ message: 'No current semester' });

    const { day, startTime, endTime, room, building, note } = req.body;

    if (!day || !startTime || !endTime) {
      return res.status(400).json({ message: 'day, startTime, endTime required' });
    }
    if (!Timetable.DAYS.includes(day)) {
      return res.status(400).json({ message: 'Invalid day' });
    }
    if (!isValidTime(startTime) || !isValidTime(endTime)) {
      return res.status(400).json({ message: 'Time must be HH:MM (24-hour)' });
    }
    if (toMinutes(startTime) >= toMinutes(endTime)) {
      return res.status(400).json({ message: 'startTime must be before endTime' });
    }

    // Conflict check
    const conflict = await findConflict({
      unitId: unit._id,
      lecturerId: unit.lecturerId,
      room: (room || '').trim(),
      day, startTime, endTime,
      semester: semester.code,
    });
    if (conflict) {
      return res.status(409).json({ message: conflict.message, conflictType: conflict.type });
    }

    const slot = await Timetable.create({
      unitId: unit._id,
      semester: semester.code,
      day,
      startTime,
      endTime,
      room: (room || '').trim(),
      building: (building || '').trim(),
      note: (note || '').trim(),
      lecturerId: unit.lecturerId || null,
      createdBy: req.user._id,
    });

    res.status(201).json(slot);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/academic/timetable/:slotId
exports.updateSlot = async (req, res) => {
  try {
    const slot = await Timetable.findById(req.params.slotId);
    if (!slot) return res.status(404).json({ message: 'Slot not found' });

    const unit = await Unit.findById(slot.unitId);
    if (!unit) return res.status(404).json({ message: 'Unit not found' });

    const { day, startTime, endTime, room, building, note } = req.body;

    const newDay       = day || slot.day;
    const newStart     = startTime || slot.startTime;
    const newEnd       = endTime || slot.endTime;
    const newRoom      = room != null ? room.trim() : slot.room;
    const newBuilding  = building != null ? building.trim() : slot.building;
    const newNote      = note != null ? note.trim() : slot.note;

    if (!Timetable.DAYS.includes(newDay)) {
      return res.status(400).json({ message: 'Invalid day' });
    }
    if (!isValidTime(newStart) || !isValidTime(newEnd)) {
      return res.status(400).json({ message: 'Time must be HH:MM' });
    }
    if (toMinutes(newStart) >= toMinutes(newEnd)) {
      return res.status(400).json({ message: 'startTime must be before endTime' });
    }

    const conflict = await findConflict({
      unitId: unit._id,
      lecturerId: unit.lecturerId,
      room: newRoom,
      day: newDay,
      startTime: newStart,
      endTime: newEnd,
      semester: slot.semester,
      excludeId: slot._id,
    });
    if (conflict) {
      return res.status(409).json({ message: conflict.message, conflictType: conflict.type });
    }

    slot.day       = newDay;
    slot.startTime = newStart;
    slot.endTime   = newEnd;
    slot.room      = newRoom;
    slot.building  = newBuilding;
    slot.note      = newNote;
    await slot.save();

    res.json(slot);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/academic/timetable/:slotId
exports.deleteSlot = async (req, res) => {
  try {
    const slot = await Timetable.findByIdAndDelete(req.params.slotId);
    if (!slot) return res.status(404).json({ message: 'Slot not found' });
    res.json({ message: 'Slot deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------------------------------------
// STUDENT — LMS
// ---------------------------------------------------------------------------

// GET /api/lms/me/timetable
// Returns the current semester's slots for all approved units, plus a
// structured weekly grid so the frontend can render without heavy logic.
exports.getMyTimetable = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const semester = await Semester.findOne({ isCurrent: true });
    if (!semester) return res.json({ semester: null, slots: [] });

    const reg = await UnitRegistration.findOne({
      studentId: student._id,
      semester: semester.code,
      status: 'approved',
    }).populate('unitIds', 'code name credits lecturerId');

    if (!reg || !reg.unitIds?.length) {
      return res.json({ semester: semester.code, slots: [] });
    }

    const unitIds = reg.unitIds.map((u) => u._id);

    const slots = await Timetable
      .find({ unitId: { $in: unitIds }, semester: semester.code })
      .populate('unitId', 'code name credits')
      .populate('lecturerId', 'email schoolEmail')
      .sort({ day: 1, startTime: 1 });

    res.json({
      semester: semester.code,
      academicYear: semester.academicYear,
      slots: slots.map((s) => ({
        _id:       s._id,
        day:       s.day,
        startTime: s.startTime,
        endTime:   s.endTime,
        room:      s.room,
        building:  s.building,
        note:      s.note,
        unit: s.unitId
          ? { _id: s.unitId._id, code: s.unitId.code, name: s.unitId.name, credits: s.unitId.credits }
          : null,
        lecturer: s.lecturerId
          ? { email: s.lecturerId.schoolEmail || s.lecturerId.email }
          : null,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
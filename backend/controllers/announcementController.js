const fs = require('fs');
const path = require('path');
const Announcement = require('../models/Announcement');
const Unit         = require('../models/Unit');
const UnitRegistration = require('../models/UnitRegistration');
const Student      = require('../models/Student');
const Notification = require('../models/Notification');
const { fileUrl }  = require('../utils/fileUrl');

// Utility: safely delete a file if it exists
const safeUnlink = (p) => {
  if (!p) return;
  try { fs.unlinkSync(p); } catch { /* ignore */ }
};

// Assert the logged-in lecturer owns this unit
const assertLecturerOwnsUnit = async (req, res, unitId) => {
  const unit = await Unit.findById(unitId);
  if (!unit) { res.status(404).json({ message: 'Unit not found' }); return null; }
  if (String(unit.lecturerId) !== String(req.user._id)) {
    res.status(403).json({ message: 'You do not own this unit' });
    return null;
  }
  return unit;
};

// ------------------------------------------------------------------
// POST /api/lecturer/units/:unitId/announcements   (multipart, optional file)
// ------------------------------------------------------------------
exports.createAnnouncement = async (req, res) => {
  try {
    const unit = await assertLecturerOwnsUnit(req, res, req.params.unitId);
    if (!unit) return;

    const { title, body, priority } = req.body;
    if (!title || !title.trim()) {
      if (req.file) safeUnlink(req.file.path);
      return res.status(400).json({ message: 'Title is required' });
    }
    if (!body || !body.trim()) {
      if (req.file) safeUnlink(req.file.path);
      return res.status(400).json({ message: 'Body is required' });
    }

    const semester = unit.semester || '2026-S1';

    const ann = await Announcement.create({
      unitId:         unit._id,
      semester,
      authorId:       req.user._id,
      title:          title.trim(),
      body:           body.trim(),
      priority:       ['normal','important','urgent'].includes(priority) ? priority : 'normal',
      attachmentPath: req.file ? req.file.path : undefined,
      attachmentName: req.file ? req.file.originalname : undefined,
    });

    // --- Auto-fire notifications to enrolled students ---
    try {
      const regs = await UnitRegistration.find({
        unitIds: unit._id,
        semester,
        status: 'approved',
      }).populate('studentId', 'userId');

      const studentUserIds = regs
        .map((r) => r.studentId?.userId)
        .filter(Boolean);

      if (studentUserIds.length) {
        await Notification.insertMany(
          studentUserIds.map((userId) => ({
            userId,
            type:  'announcement.new',
            title: `New announcement in ${unit.code}`,
            body:  ann.title,
            link:  '/lms/announcements',
          }))
        );
      }
    } catch (e) {
      // non-fatal — announcement is created either way
      console.error('Failed to fire announcements:', e.message);
    }

    res.status(201).json({ announcement: ann });
  } catch (err) {
    if (req.file) safeUnlink(req.file.path);
    res.status(500).json({ message: err.message });
  }
};

// ------------------------------------------------------------------
// GET /api/lecturer/units/:unitId/announcements
// ------------------------------------------------------------------
exports.listForUnit = async (req, res) => {
  try {
    const unit = await assertLecturerOwnsUnit(req, res, req.params.unitId);
    if (!unit) return;

    const list = await Announcement.find({
      unitId: unit._id,
      archived: false,
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      announcements: list.map((a) => ({
        _id:            a._id,
        title:          a.title,
        body:           a.body,
        priority:       a.priority,
        attachmentUrl:  a.attachmentPath ? fileUrl(a.attachmentPath) : null,
        attachmentName: a.attachmentName || null,
        createdAt:      a.createdAt,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ------------------------------------------------------------------
// PUT /api/lecturer/announcements/:id   { title, body, priority }
// ------------------------------------------------------------------
exports.updateAnnouncement = async (req, res) => {
  try {
    const ann = await Announcement.findById(req.params.id);
    if (!ann) return res.status(404).json({ message: 'Announcement not found' });

    const unit = await assertLecturerOwnsUnit(req, res, ann.unitId);
    if (!unit) return;

    const { title, body, priority } = req.body;
    if (title) ann.title = title.trim();
    if (body)  ann.body  = body.trim();
    if (priority && ['normal','important','urgent'].includes(priority)) {
      ann.priority = priority;
    }
    ann.updatedAt = new Date();
    await ann.save();

    res.json({ announcement: ann });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ------------------------------------------------------------------
// DELETE /api/lecturer/announcements/:id   (soft-delete)
// ------------------------------------------------------------------
exports.deleteAnnouncement = async (req, res) => {
  try {
    const ann = await Announcement.findById(req.params.id);
    if (!ann) return res.status(404).json({ message: 'Announcement not found' });

    const unit = await assertLecturerOwnsUnit(req, res, ann.unitId);
    if (!unit) return;

    ann.archived = true;
    ann.updatedAt = new Date();
    await ann.save();

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ------------------------------------------------------------------
// GET /api/lms/me/announcements    (student — all their units)
// ------------------------------------------------------------------
exports.getMyAnnouncements = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const semester = await require('../models/Semester').findOne({ isCurrent: true });
    if (!semester) return res.json({ announcements: [] });

    const reg = await UnitRegistration.findOne({
      studentId: student._id,
      semester:  semester.code,
      status:    'approved',
    }).populate('unitIds', 'code name');

    if (!reg || !reg.unitIds?.length) {
      return res.json({ announcements: [] });
    }

    const unitIds = reg.unitIds.map((u) => u._id);

    const list = await Announcement.find({
      unitId:   { $in: unitIds },
      archived: false,
    })
      .populate('unitId', 'code name')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({
      announcements: list.map((a) => ({
        _id:            a._id,
        title:          a.title,
        body:           a.body,
        priority:       a.priority,
        unit:           a.unitId ? { code: a.unitId.code, name: a.unitId.name } : null,
        attachmentUrl:  a.attachmentPath ? fileUrl(a.attachmentPath) : null,
        attachmentName: a.attachmentName || null,
        createdAt:      a.createdAt,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
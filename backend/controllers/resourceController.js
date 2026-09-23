const fs = require('fs');
const path = require('path');
const Resource         = require('../models/Resource');
const Unit             = require('../models/Unit');
const Student          = require('../models/Student');
const UnitRegistration = require('../models/UnitRegistration');
const Semester         = require('../models/Semester');

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

async function assertLecturerOwnsUnit(req, res, unitId) {
  const unit = await Unit.findById(unitId);
  if (!unit) { res.status(404).json({ message: 'Unit not found' }); return null; }
  if (String(unit.lecturerId) !== String(req.user._id)) {
    res.status(403).json({ message: 'You do not teach this unit' });
    return null;
  }
  return unit;
}

function safeUnlink(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (err) {
    console.error('Failed to delete file:', err.message);
  }
}

// ---------------------------------------------------------------------------
// LECTURER
// ---------------------------------------------------------------------------

// GET /api/lecturer/units/:unitId/resources
exports.listUnitResources = async (req, res) => {
  try {
    const unit = await assertLecturerOwnsUnit(req, res, req.params.unitId);
    if (!unit) return;

    const semester = await Semester.findOne({ isCurrent: true });
    if (!semester) return res.status(400).json({ message: 'No current semester' });

    const resources = await Resource
      .find({ unitId: unit._id, semester: semester.code })
      .sort({ uploadedAt: -1 });

    res.json({
      semester: semester.code,
      unit: { _id: unit._id, code: unit.code, name: unit.name },
      resources: resources.map((r) => ({
        _id:         r._id,
        title:       r.title,
        description: r.description,
        category:    r.category,
        fileName:    r.fileName,
        fileSize:    r.fileSize,
        mimeType:    r.mimeType,
        url:         `/uploads/resources/${path.basename(r.filePath)}`,
        uploadedAt:  r.uploadedAt,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/lecturer/units/:unitId/resources   (multipart)
// fields: file, title, description?, category?
exports.uploadResource = async (req, res) => {
  try {
    const unit = await assertLecturerOwnsUnit(req, res, req.params.unitId);
    if (!unit) return;

    if (!req.file) return res.status(400).json({ message: 'File is required' });

    const semester = await Semester.findOne({ isCurrent: true });
    if (!semester) {
      safeUnlink(req.file.path);
      return res.status(400).json({ message: 'No current semester' });
    }

    const { title, description, category } = req.body;
    if (!title) {
      safeUnlink(req.file.path);
      return res.status(400).json({ message: 'Title is required' });
    }

    const resource = await Resource.create({
      unitId:   unit._id,
      semester: semester.code,
      title:    title.trim(),
      description: (description || '').trim(),
      category: Resource.CATEGORIES.includes(category) ? category : 'lecture_notes',
      filePath: req.file.path,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user._id,
    });

    res.status(201).json({
      _id:         resource._id,
      title:       resource.title,
      description: resource.description,
      category:    resource.category,
      fileName:    resource.fileName,
      fileSize:    resource.fileSize,
      url:         `/uploads/resources/${path.basename(resource.filePath)}`,
      uploadedAt:  resource.uploadedAt,
    });
  } catch (err) {
    if (req.file) safeUnlink(req.file.path);
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/lecturer/resources/:id
exports.deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: 'Resource not found' });

    const unit = await assertLecturerOwnsUnit(req, res, resource.unitId);
    if (!unit) return;

    safeUnlink(resource.filePath);
    await Resource.findByIdAndDelete(resource._id);

    res.json({ message: 'Resource deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------------------------------------
// STUDENT
// ---------------------------------------------------------------------------

// GET /api/units/me/resources
// All resources for the student's approved units this semester, grouped by unit.
exports.getMyResources = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const semester = await Semester.findOne({ isCurrent: true });
    if (!semester) return res.json({ semester: null, units: [] });

    const reg = await UnitRegistration.findOne({
      studentId: student._id,
      semester: semester.code,
      status: 'approved',
    }).populate('unitIds', 'code name credits');

    if (!reg) return res.json({ semester: semester.code, units: [] });

    const results = [];
    for (const unit of reg.unitIds) {
      const resources = await Resource
        .find({ unitId: unit._id, semester: semester.code })
        .sort({ category: 1, uploadedAt: -1 });

      results.push({
        unit: { _id: unit._id, code: unit.code, name: unit.name, credits: unit.credits },
        resources: resources.map((r) => ({
          _id:         r._id,
          title:       r.title,
          description: r.description,
          category:    r.category,
          fileName:    r.fileName,
          fileSize:    r.fileSize,
          mimeType:    r.mimeType,
          url:         `/uploads/resources/${path.basename(r.filePath)}`,
          uploadedAt:  r.uploadedAt,
        })),
      });
    }

    res.json({ semester: semester.code, units: results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

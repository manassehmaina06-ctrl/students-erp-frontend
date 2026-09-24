const fs   = require('fs');
const path = require('path');
const Assignment        = require('../models/Assignment');
const Submission        = require('../models/Submission');
const Assessment        = require('../models/Assessment');
const Unit              = require('../models/Unit');
const Student           = require('../models/Student');
const Semester          = require('../models/Semester');
const UnitRegistration  = require('../models/UnitRegistration');
const { notify }        = require('../utils/notify');
const { computeGrade }  = require('../utils/gradeHelpers');

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
    console.error('File delete failed:', err.message);
  }
}

// Convert a stored file path to a public URL
function fileUrl(filePath) {
  if (!filePath) return null;
  const parts = filePath.split(path.sep);
  const folder = parts[parts.length - 2];   // 'assignments' or 'submissions'
  return `/uploads/${folder}/${path.basename(filePath)}`;
}

// ---------------------------------------------------------------------------
// LECTURER
// ---------------------------------------------------------------------------

// GET /api/lecturer/units/:unitId/assignments
exports.listUnitAssignments = async (req, res) => {
  try {
    const unit = await assertLecturerOwnsUnit(req, res, req.params.unitId);
    if (!unit) return;

    const semester = await Semester.findOne({ isCurrent: true });
    if (!semester) return res.status(400).json({ message: 'No current semester' });

    const assignments = await Assignment
      .find({ unitId: unit._id, semester: semester.code })
      .sort({ createdAt: -1 });

    // Attach submission stats per assignment
    const rows = [];
    for (const a of assignments) {
      const totalSubmissions = await Submission.countDocuments({ assignmentId: a._id });
      const gradedCount      = await Submission.countDocuments({ assignmentId: a._id, status: 'graded' });
      rows.push({
        _id:               a._id,
        title:             a.title,
        description:       a.description,
        dueDate:           a.dueDate,
        maxScore:          a.maxScore,
        status:            a.status,
        linkToAssessment:  a.linkToAssessment,
        assessmentId:      a.assessmentId,
        weight:            a.weight,
        attachmentUrl:     fileUrl(a.attachmentPath),
        attachmentName:    a.attachmentName,
        totalSubmissions,
        gradedCount,
        createdAt:         a.createdAt,
      });
    }

    res.json({
      semester: semester.code,
      unit: { _id: unit._id, code: unit.code, name: unit.name },
      assignments: rows,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/lecturer/units/:unitId/assignments  (multipart, optional 'file')
// fields: title, description, dueDate, maxScore, linkToAssessment ('true'|'false'), weight
exports.createAssignment = async (req, res) => {
  try {
    const unit = await assertLecturerOwnsUnit(req, res, req.params.unitId);
    if (!unit) return;

    const semester = await Semester.findOne({ isCurrent: true });
    if (!semester) {
      if (req.file) safeUnlink(req.file.path);
      return res.status(400).json({ message: 'No current semester' });
    }

    const { title, description, dueDate, maxScore, linkToAssessment, weight } = req.body;
    if (!title || !dueDate) {
      if (req.file) safeUnlink(req.file.path);
      return res.status(400).json({ message: 'title and dueDate required' });
    }

    const shouldLink = String(linkToAssessment) === 'true';
    // Guard: refuse if adding this weight would push the unit's total over 100%
    if (shouldLink && Number(weight) > 0) {
      const existingAssessments = await Assessment.find({
        unitId: unit._id,
        semester: semester.code,
      });
      const currentTotal = existingAssessments.reduce((s, a) => s + (Number(a.weight) || 0), 0);
      const newTotal = currentTotal + Number(weight);
      if (newTotal > 100) {
        if (req.file) safeUnlink(req.file.path);
        return res.status(400).json({
          message: `Cannot add ${weight}% — current total is ${currentTotal}%, would become ${newTotal}%. Adjust existing assessments first.`,
        });
      }
    }
    const assignment = await Assignment.create({
      unitId:   unit._id,
      semester: semester.code,
      title:    title.trim(),
      description: (description || '').trim(),
      dueDate:  new Date(dueDate),
      maxScore: maxScore != null ? Number(maxScore) : 100,
      attachmentPath: req.file?.path,
      attachmentName: req.file?.originalname,
      attachmentSize: req.file?.size,
      attachmentType: req.file?.mimetype,
      linkToAssessment: shouldLink,
      weight: shouldLink ? Number(weight) || 0 : 0,
      status: 'draft',
      createdBy: req.user._id,
    });

    // If linked to assessment, create the matching Assessment now
    if (shouldLink && assignment.weight > 0) {
      try {
        const assessment = await Assessment.create({
          unitId:   unit._id,
          semester: semester.code,
          name:     assignment.title,
          type:     'assignment',
          number:   1,
          weight:   assignment.weight,
          maxScore: assignment.maxScore,
          createdBy: req.user._id,
        });
        assignment.assessmentId = assessment._id;
        await assignment.save();
      } catch (e) {
        // Roll back the assignment if the assessment fails
        await Assignment.findByIdAndDelete(assignment._id);
        if (req.file) safeUnlink(req.file.path);
        return res.status(400).json({ message: 'Failed to create linked assessment: ' + e.message });
      }
    }

    res.status(201).json(assignment);
  } catch (err) {
    if (req.file) safeUnlink(req.file.path);
    if (err.code === 11000) return res.status(400).json({ message: 'An assignment with that title already exists' });
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/lecturer/assignments/:id
// fields: title?, description?, dueDate?, maxScore?, weight?
exports.updateAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    const unit = await assertLecturerOwnsUnit(req, res, assignment.unitId);
    if (!unit) return;

    const { title, description, dueDate, maxScore, weight } = req.body;
    if (title != null)       assignment.title = title.trim();
    if (description != null) assignment.description = description.trim();
    if (dueDate != null)     assignment.dueDate = new Date(dueDate);
    if (maxScore != null)    assignment.maxScore = Number(maxScore);
    if (weight != null && assignment.linkToAssessment) {
      assignment.weight = Number(weight);
      // Propagate to linked Assessment
      if (assignment.assessmentId) {
        await Assessment.findByIdAndUpdate(assignment.assessmentId, {
          $set: { weight: assignment.weight, maxScore: assignment.maxScore, name: assignment.title },
        });
      }
    }

    await assignment.save();
    res.json(assignment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/lecturer/assignments/:id
exports.deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    const unit = await assertLecturerOwnsUnit(req, res, assignment.unitId);
    if (!unit) return;

    // Delete linked assessment + all submissions + attachment
    if (assignment.assessmentId) {
      await Assessment.findByIdAndDelete(assignment.assessmentId);
    }
    const subs = await Submission.find({ assignmentId: assignment._id });
    for (const s of subs) safeUnlink(s.filePath);
    await Submission.deleteMany({ assignmentId: assignment._id });

    safeUnlink(assignment.attachmentPath);
    await Assignment.findByIdAndDelete(assignment._id);

    res.json({ message: 'Assignment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// LIFECYCLE
// POST /api/lecturer/assignments/:id/publish
exports.publishAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    const unit = await assertLecturerOwnsUnit(req, res, assignment.unitId);
    if (!unit) return;

    assignment.status = 'published';
    assignment.publishedAt = new Date();
    await assignment.save();

    // Notify all enrolled students
    const regs = await UnitRegistration.find({
      unitIds: assignment.unitId,
      semester: assignment.semester,
      status: 'approved',
    }).populate('studentId', 'userId');
    for (const r of regs) {
      if (r.studentId?.userId) {
        await notify(r.studentId.userId, {
          type:  'assignment.published',
          title: `New assignment: ${assignment.title}`,
          body:  `${unit.code} · Due ${new Date(assignment.dueDate).toLocaleDateString()}`,
          link:  '/lms/assignments',
        });
      }
    }

    res.json(assignment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/lecturer/assignments/:id/hide
exports.hideAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    const unit = await assertLecturerOwnsUnit(req, res, assignment.unitId);
    if (!unit) return;

    assignment.status = 'draft';
    await assignment.save();
    res.json(assignment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/lecturer/assignments/:id/close
exports.closeAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    const unit = await assertLecturerOwnsUnit(req, res, assignment.unitId);
    if (!unit) return;

    assignment.status = 'closed';
    assignment.closedAt = new Date();
    await assignment.save();
    res.json(assignment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/lecturer/assignments/:id/submissions
exports.listSubmissions = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    const unit = await assertLecturerOwnsUnit(req, res, assignment.unitId);
    if (!unit) return;

    // Get all enrolled students (so we can show "not submitted" rows too)
    const regs = await UnitRegistration.find({
      unitIds: assignment.unitId,
      semester: assignment.semester,
      status: 'approved',
    }).populate('studentId', 'studentNumber personalInfo');

    const students = regs.map((r) => r.studentId).filter(Boolean);
    const submissions = await Submission.find({ assignmentId: assignment._id });

    const rows = students.map((s) => {
      const sub = submissions.find((x) => String(x.studentId) === String(s._id));
      return {
        student: {
          _id:           s._id,
          studentNumber: s.studentNumber,
          name:          [s.personalInfo?.title, s.personalInfo?.surname, s.personalInfo?.lastName]
                           .filter(Boolean).join(' ') || 'Unnamed',
        },
        submission: sub ? {
          _id:         sub._id,
          fileName:    sub.fileName,
          fileUrl:     fileUrl(sub.filePath),
          note:        sub.note,
          submittedAt: sub.submittedAt,
          isLate:      sub.isLate,
          score:       sub.score,
          feedback:    sub.feedback,
          status:      sub.status,
        } : null,
      };
    });

    res.json({
      assignment: {
        _id:      assignment._id,
        title:    assignment.title,
        maxScore: assignment.maxScore,
        dueDate:  assignment.dueDate,
        status:   assignment.status,
      },
      rows,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/lecturer/submissions/:id   { score, feedback }
exports.gradeSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('studentId', 'userId studentNumber');
    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    const assignment = await Assignment.findById(submission.assignmentId);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    const unit = await assertLecturerOwnsUnit(req, res, assignment.unitId);
    if (!unit) return;

    const { score, feedback } = req.body;
    if (score == null) return res.status(400).json({ message: 'score required' });
    const n = Number(score);
    if (isNaN(n) || n < 0 || n > assignment.maxScore) {
      return res.status(400).json({ message: `Score must be between 0 and ${assignment.maxScore}` });
    }

    submission.score    = n;
    submission.feedback = (feedback || '').trim();
    submission.gradedBy = req.user._id;
    submission.gradedAt = new Date();
    submission.status   = 'graded';
    await submission.save();

    // If this assignment is linked to an assessment, push the mark into Mark collection
    if (assignment.linkToAssessment && assignment.assessmentId) {
      const Mark = require('../models/Mark');
      await Mark.findOneAndUpdate(
        { studentId: submission.studentId._id, assessmentId: assignment.assessmentId },
        {
          $set: {
            unitId:       assignment.unitId,
            semester:     assignment.semester,
            score:        n,
            gradedBy:     req.user._id,
            gradedAt:     new Date(),
          },
        },
        { upsert: true, returnDocument: 'after' }
      );
    }

    // Notify the student
    if (submission.studentId?.userId) {
      await notify(submission.studentId.userId, {
        type:  'assignment.graded',
        title: `Graded: ${assignment.title}`,
        body:  `Score: ${n}/${assignment.maxScore}${submission.feedback ? ' · ' + submission.feedback : ''}`,
        link:  '/lms/assignments',
      });
    }

    res.json(submission);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------------------------------------
// STUDENT (LMS)
// ---------------------------------------------------------------------------

// GET /api/lms/me/assignments
// All published or closed assignments for the student's approved units this semester.
exports.getMyAssignments = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const semester = await Semester.findOne({ isCurrent: true });
    if (!semester) return res.json({ semester: null, assignments: [] });

    const reg = await UnitRegistration.findOne({
      studentId: student._id,
      semester: semester.code,
      status: 'approved',
    }).populate('unitIds', 'code name credits');

    if (!reg || !reg.unitIds?.length) {
      return res.json({ semester: semester.code, assignments: [] });
    }

    const unitIds = reg.unitIds.map((u) => u._id);

    const assignments = await Assignment.find({
      unitId:   { $in: unitIds },
      semester: semester.code,
      status:   { $in: ['published', 'closed'] },   // never expose drafts
    })
      .populate('unitId', 'code name')
      .sort({ dueDate: 1 });

    const submissions = await Submission.find({
      assignmentId: { $in: assignments.map((a) => a._id) },
      studentId:    student._id,
    });

    const now = new Date();
    const rows = assignments.map((a) => {
      const sub = submissions.find((x) => String(x.assignmentId) === String(a._id));
      let derivedStatus = 'pending';
      if (sub) {
        derivedStatus = sub.status === 'graded' ? 'graded' : 'submitted';
      } else if (now > new Date(a.dueDate)) {
        derivedStatus = 'overdue';
      }

      return {
        _id:            a._id,
        title:          a.title,
        description:    a.description,
        dueDate:        a.dueDate,
        maxScore:       a.maxScore,
        status:         a.status,
        attachmentUrl:  fileUrl(a.attachmentPath),
        attachmentName: a.attachmentName,
        unit: a.unitId ? { _id: a.unitId._id, code: a.unitId.code, name: a.unitId.name } : null,
        mySubmission: sub ? {
          _id:         sub._id,
          fileName:    sub.fileName,
          fileUrl:     fileUrl(sub.filePath),
          submittedAt: sub.submittedAt,
          isLate:      sub.isLate,
          score:       sub.score,
          feedback:    sub.feedback,
          status:      sub.status,
          grade:       sub.score != null
            ? computeGrade((sub.score / a.maxScore) * 100).grade
            : null,
        } : null,
        studentStatus: derivedStatus,
      };
    });

    res.json({ semester: semester.code, assignments: rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/lms/me/assignments/:id
exports.getAssignmentDetail = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const assignment = await Assignment.findById(req.params.id)
      .populate('unitId', 'code name credits');
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    // Only published or closed assignments are visible to students
    if (!['published', 'closed'].includes(assignment.status)) {
      return res.status(403).json({ message: 'Assignment not available' });
    }

    const submission = await Submission.findOne({
      assignmentId: assignment._id,
      studentId:    student._id,
    });

    res.json({
      _id:            assignment._id,
      title:          assignment.title,
      description:    assignment.description,
      dueDate:        assignment.dueDate,
      maxScore:       assignment.maxScore,
      status:         assignment.status,
      attachmentUrl:  fileUrl(assignment.attachmentPath),
      attachmentName: assignment.attachmentName,
      unit: assignment.unitId
        ? { _id: assignment.unitId._id, code: assignment.unitId.code, name: assignment.unitId.name }
        : null,
      mySubmission: submission ? {
        _id:         submission._id,
        fileName:    submission.fileName,
        fileUrl:     fileUrl(submission.filePath),
        note:        submission.note,
        submittedAt: submission.submittedAt,
        isLate:      submission.isLate,
        score:       submission.score,
        feedback:    submission.feedback,
        status:      submission.status,
        grade:       submission.score != null
          ? computeGrade((submission.score / assignment.maxScore) * 100).grade
          : null,
      } : null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/lms/me/assignments/:id/submit  (multipart, field 'file')
exports.submitAssignment = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'File required' });

    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      safeUnlink(req.file.path);
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      safeUnlink(req.file.path);
      return res.status(404).json({ message: 'Assignment not found' });
    }
    if (assignment.status !== 'published') {
      safeUnlink(req.file.path);
      return res.status(400).json({ message: 'Assignment is not open for submissions' });
    }

    // Existing submission?
    const existing = await Submission.findOne({
      assignmentId: assignment._id,
      studentId:    student._id,
    });

    // If already graded, block resubmission
    if (existing && existing.status === 'graded') {
      safeUnlink(req.file.path);
      return res.status(400).json({ message: 'Already graded — cannot resubmit' });
    }

    const isLate = new Date() > new Date(assignment.dueDate);

    if (existing) {
      // Replace file
      safeUnlink(existing.filePath);
      existing.filePath    = req.file.path;
      existing.fileName    = req.file.originalname;
      existing.fileSize    = req.file.size;
      existing.mimeType    = req.file.mimetype;
      existing.note        = (req.body.note || '').trim();
      existing.submittedAt = new Date();
      existing.isLate      = isLate;
      await existing.save();
      return res.json(existing);
    }

    const sub = await Submission.create({
      assignmentId: assignment._id,
      studentId:    student._id,
      unitId:       assignment.unitId,
      semester:     assignment.semester,
      filePath:     req.file.path,
      fileName:     req.file.originalname,
      fileSize:     req.file.size,
      mimeType:     req.file.mimetype,
      note:         (req.body.note || '').trim(),
      isLate,
    });

    res.status(201).json(sub);
  } catch (err) {
    if (req.file) safeUnlink(req.file.path);
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/lms/me/assignments/:id/submit
exports.withdrawSubmission = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    const sub = await Submission.findOne({
      assignmentId: assignment._id,
      studentId:    student._id,
    });
    if (!sub) return res.status(404).json({ message: 'No submission to withdraw' });

    if (sub.status === 'graded') {
      return res.status(400).json({ message: 'Cannot withdraw a graded submission' });
    }
    if (new Date() > new Date(assignment.dueDate)) {
      return res.status(400).json({ message: 'Cannot withdraw after the due date' });
    }

    safeUnlink(sub.filePath);
    await Submission.findByIdAndDelete(sub._id);

    res.json({ message: 'Submission withdrawn' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
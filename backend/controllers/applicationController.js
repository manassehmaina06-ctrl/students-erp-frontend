const Application = require('../models/Application');
const Student     = require('../models/Student');
const TRANSITIONS = require('../config/transitions');
const { notify } = require('../utils/notify');
const { generateStudentNumber, generateApplicationNumber } = require('../utils/generateNumber');
const { generateApplicationFeeCode } = require('../utils/generateAppFeeCode');

// ---------------------------------------------------------------------------
// STUDENT
// ---------------------------------------------------------------------------

exports.submitApplication = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id })
      .populate('programmeInfo.programme');
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // If student already has an active application, return it (avoid duplicates)
    const existing = await Application.findOne({
      studentId: student._id,
      status: { $nin: ['rejected', 'enrolled'] },
    });
    if (existing) {
      return res.status(200).json(existing);
    }

    const app = new Application({
      studentId:   student._id,
      programmeId: student.programmeInfo?.programme?._id
                || student.programmeInfo?.programme
                || null,
      status:      'submitted',
      submittedAt: new Date(),
      applicationNumber: await generateApplicationNumber(),
    });

    app.statusHistory.push({
      status: 'submitted',
      by:     req.user._id,
      role:   req.user.role,
      note:   'Application submitted',
    });
    await app.save();

    student.applicationStatus = 'submitted';
    student.applicationNumber = app.applicationNumber;
    await student.save();

    res.status(201).json(app);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyApplications = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const apps = await Application.find({ studentId: student._id })
      .populate('programmeId')
      .sort({ createdAt: -1 });

    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------------------------------------
// STAFF
// ---------------------------------------------------------------------------

exports.getAllApplications = async (req, res) => {
  try {
    const filter = {};
    // Finance only sees approved-and-beyond apps
    if (req.user.role === 'finance') {
      filter.status = { $in: ['approved', 'finance_review', 'payment_validated', 'admitted', 'enrolled'] };
    }
    const apps = await Application.find(filter)
      .populate({
        path: 'studentId',
        populate: { path: 'programmeInfo.programme' },
      })
      .populate('programmeId')
      .sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getApplication = async (req, res) => {
  try {
    const app = await Application.findById(req.params.id)
      .populate({
        path: 'studentId',
        populate: [
          { path: 'programmeInfo.programme' },
          { path: 'documents' },
        ],
      })
      .populate('programmeId')
      .populate('reviewedBy', 'email role')
      .populate('admittedBy', 'email role');

    if (!app) return res.status(404).json({ message: 'Not found' });

    // Add a credentials block for the frontend (only once enrolled)
    const student = app.studentId;
    if (student && student.studentNumber) {
      const passwordSource = student.personalInfo?.idNumber
        ? 'ID number'
        : student.personalInfo?.birthCertNo
          ? 'birth certificate number'
          : 'not set';

      app._doc.credentials = {
        username:       student.studentNumber,
        schoolEmail:    student.schoolEmail || null,
        passwordSource,
        passwordHint:   passwordSource !== 'not set'
          ? `Password = the student's ${passwordSource}`
          : 'Not yet set — enroll the student first',
      };
    }

    res.json(app);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateApplication = async (req, res) => {
  try {
    const { comments } = req.body;
    const app = await Application.findByIdAndUpdate(
      req.params.id,
      { $set: { comments } },
     { returnDocument: 'after' }
    );
    if (!app) return res.status(404).json({ message: 'Not found' });
    res.json(app);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status: next, note, applicationFee, applicationFeePaid, billings } = req.body;
    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ message: 'Application not found' });

    const role = req.user.role;
    const allowed = (TRANSITIONS[app.status] || {})[role] || [];
    if (!allowed.includes(next)) {
      return res.status(403).json({
        message: `Cannot move "${app.status}" → "${next}" as ${role}`,
      });
    }

    if (next === 'submitted' && !app.applicationNumber) {
      app.applicationNumber = await generateApplicationNumber();
      app.submittedAt = new Date();
    }
    if (next === 'approved') {
      app.reviewedBy = req.user._id;
      app.reviewedAt = new Date();
    }
    if (next === 'payment_validated') {
      app.paymentValidatedBy = req.user._id;
      app.paymentValidatedAt = new Date();
      if (!app.applicationFeeCode) {
        app.applicationFeeCode = await generateApplicationFeeCode();
      }
      if (applicationFee != null)     app.applicationFee     = Number(applicationFee);
      if (applicationFeePaid != null) app.applicationFeePaid = Number(applicationFeePaid);
    }
    if (next === 'admitted' && !app.studentNumber) {
      app.studentNumber = await generateStudentNumber();
      app.admittedBy = req.user._id;
      app.admittedAt = new Date();
    }
///here is the start
      if (next === 'enrolled') {
      app.paidAt = app.paidAt || new Date();
      const student = await Student.findById(app.studentId);
            // Auto-enroll the student in their programme's core units for the current semester
      try {
        const { autoEnrollNewStudent } = require('../utils/registrationHelpers');
        await autoEnrollNewStudent(student);
      } catch (e) {
        console.error('Auto-enroll after enrollment failed:', e.message);
      }
      if (!student) return res.status(404).json({ message: 'Linked Student missing' });

      // ----- ENROLLMENT GATE: require ID number (used as portal password) -----
      const idNumber = (student.personalInfo?.idNumber || student.personalInfo?.birthCertNo || '').trim();
      if (!idNumber) {
        return res.status(400).json({
          message: 'Cannot enroll: student ID number / birth certificate number is missing on the application. Update the application first.',
        });
      }

      // Semester tagging (default to current term if not provided)
      const semester     = (req.body.semester || '2026-S1').trim();
      const academicYear = (req.body.academicYear || '2026/2027').trim();

        // Regenerate the student number at enrollment to guarantee uniqueness
      // (the number assigned at 'admitted' may be stale or collide with an
      // existing student created between admit and enrollment)
          const freshStudentNumber = await generateStudentNumber();
      const schoolEmail = `${freshStudentNumber.toLowerCase()}@strathmore.edu`;

      app.studentNumber         = freshStudentNumber;
      app.schoolEmail           = schoolEmail;
      student.applicationNumber = app.applicationNumber;
      student.studentNumber     = freshStudentNumber;
      student.schoolEmail       = schoolEmail;
      student.enrolledAt        = new Date();
      student.currentSemester   = semester;

      if (app.feeAmount != null) {
        student.fees.total   = app.feeAmount;
        student.fees.paid    = app.feePaid || 0;
        student.fees.balance = app.feeAmount - (app.feePaid || 0);
      }
      student.feeStatus =
        student.fees.balance === 0 && student.fees.total > 0 ? 'paid'
        : student.fees.paid > 0 ? 'partial'
        : 'pending';

      // Course-fee billings entered by finance on enrollment
      if (Array.isArray(billings) && billings.length > 0) {
        const items = billings.map((b) => ({
          label:       b.label || 'Fee',
          amount:      Number(b.amount) || 0,
          paid:        Number(b.paid) || 0,
          description: b.description || '',
          category:    b.category || 'General',
          dueDate:     b.dueDate || null,
        }));
        const total = items.reduce((sum, i) => sum + i.amount, 0);
        const paid  = items.reduce((sum, i) => sum + i.paid, 0);

        student.billings = items.map((it) => ({
          label:        it.label,
          reference:    it.label,
          amount:       it.amount,
          description:  it.description,
          category:     it.category,
          dueDate:      it.dueDate,
          semester,
          academicYear,
          createdBy:    req.user._id,
        }));

        student.fees.items   = items;
        student.fees.total   = total;
        student.fees.paid    = paid;
        student.fees.balance = total - paid;
        student.feeStatus =
          student.fees.balance === 0 && total > 0 ? 'paid'
          : paid > 0 ? 'partial'
          : 'pending';
      }

      student.applicationStatus = 'accepted';
      await student.save();

      // ----- CREATE / UPGRADE THE USER ACCOUNT -----
      // Set username = studentNumber, reset password to ID number, mark enrolled
          const user = await require('../models/User').findById(student.userId);
      if (user) {
        user.username        = app.studentNumber;
        user.schoolEmail     = schoolEmail;
        user.studentPassword = idNumber;      // NEW — separate from personal password
        user.enrolled        = true;
        if (!user.studentId) user.studentId = student._id;
        await user.save();
      }
    }

    const mirrorMap = {
      submitted:         'submitted',
      pending_approval:  'reviewing',
      approved:          'reviewing',
      finance_review:    'reviewing',
      payment_validated: 'reviewing',
      admitted:          'accepted',
      rejected:          'rejected',
      enrolled:          'accepted',
    };
    if (mirrorMap[next]) {
      await Student.findByIdAndUpdate(app.studentId, { applicationStatus: mirrorMap[next] });
    }

    app.status = next;
    app.statusHistory.push({ status: next, by: req.user._id, role, note });
    await app.save();
        // Notify the applicant
    await notify(app.studentId.userId || app.studentId, {
      type:  'application.admitted',
      title: 'You have been admitted!',
      body:  `Your application ${app.applicationNumber} was admitted. Student number: ${app.studentNumber}. Finance will contact you to enroll.`,
      link:  '/portal',
    });

    res.json(app);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------------------------------------
// STUDENT PORTAL — "me" endpoints
// ---------------------------------------------------------------------------
exports.getMyApplicationSummary = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const app = await Application.findOne({ studentId: student._id })
      .populate('programmeId')
      .sort({ createdAt: -1 });

    if (!app) {
      return res.json({
        hasApplication: false,
        nextAction: 'Complete your application',
        timeline: [],
      });
    }

    const nextActionByStatus = {
      submitted:         'Wait for admissions review',
      approved:          'Awaiting payment validation',
      finance_review:    'Pay your application fee',
      payment_validated: 'Awaiting admission decision',
      admitted:          'Pay fees to complete enrollment',
      enrolled:          student.fees?.balance > 0
                            ? 'Settle your fee balance'
                            : 'You are cleared',
      rejected:          'Application not successful',
    };

    res.json({
      hasApplication:    true,
      applicationId:     app._id,
      applicationNumber: app.applicationNumber,
      studentNumber:     app.studentNumber,
      status:            app.status,
      programme:         app.programmeId,
      fees: {
        total:   student.fees?.total   ?? app.feeAmount ?? 0,
        paid:    student.fees?.paid    ?? 0,
        balance: student.fees?.balance ?? 0,
        status:  student.feeStatus     ?? 'pending',
      },
      nextAction: nextActionByStatus[app.status] || 'Contact administration',
      timeline: (app.statusHistory || []).map((h) => ({
        status: h.status,
        at:     h.at || h.createdAt,
        note:   h.note,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------------------------------------
// STUDENT PORTAL — /me endpoints
// ---------------------------------------------------------------------------
exports.getMyApplicationSummary = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const app = await Application.findOne({ studentId: student._id })
      .populate('programmeId')
      .sort({ createdAt: -1 });

    if (!app) {
      return res.json({
        hasApplication: false,
        nextAction: 'Complete your application',
        timeline: [],
      });
    }

    const nextActionByStatus = {
      submitted:         'Wait for admissions review',
      approved:          'Awaiting payment validation',
      finance_review:    'Pay your application fee',
      payment_validated: 'Awaiting admission decision',
      admitted:          'Pay fees to complete enrollment',
      enrolled:          (student.fees?.balance > 0)
                            ? 'Settle your fee balance'
                            : 'You are cleared',
      rejected:          'Application not successful',
    };

    res.json({
      hasApplication:    true,
      applicationId:     app._id,
      applicationNumber: app.applicationNumber,
      studentNumber:     app.studentNumber,
      status:            app.status,
      programme:         app.programmeId,
      fees: {
        total:   student.fees?.total   ?? app.feeAmount ?? 0,
        paid:    student.fees?.paid    ?? 0,
        balance: student.fees?.balance ?? 0,
        status:  student.feeStatus     ?? 'pending',
      },
      nextAction: nextActionByStatus[app.status] || 'Contact administration',
      timeline: (app.statusHistory || []).map((h) => ({
        status: h.status,
        at:     h.at || h.createdAt,
        note:   h.note,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// ---------------------------------------------------------------------------
// STUDENT — list my applications with computed progress
// GET /api/applications/me
// ---------------------------------------------------------------------------
const PROGRESS_MAP = {
  submitted:         10,
  pending_approval:  20,
  approved:          30,
  finance_review:    50,
  payment_validated: 70,
  admitted:          85,
  enrolled:         100,
  rejected:           0,
};

exports.getMyApplicationList = async (req, res) => {  // ← was getMyApplications
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const applications = await Application.find({ studentId: student._id })
      .populate('programmeId', 'name code')
      .sort({ createdAt: -1 });

    res.json({
      studentNumber: student.studentNumber || null,
      enrolled:      !!student.enrolledAt,
      applications:  applications.map((a) => ({
        _id:               a._id,
        applicationNumber: a.applicationNumber,
        programme:         a.programmeId,
        status:            a.status,
        progress:          PROGRESS_MAP[a.status] ?? 0,
        submittedAt:       a.submittedAt,
        statusHistory:     a.statusHistory || [],
        isActive:          !['rejected', 'enrolled'].includes(a.status),
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
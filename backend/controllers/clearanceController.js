const ClearanceRequest = require('../models/ClearanceRequest');
const Student          = require('../models/Student');
const { generateCertificateNumber } = require('../utils/generateCertificateNumber');
const { notify, notifyRole }        = require('../utils/notify');

const OFFICES = ClearanceRequest.OFFICES;

// Role(s) allowed to action each office.
// D1 = C: finance stays separate; everything else routes via academic.
const OFFICE_ROLES = {
  finance:    ['finance'],
  library:    ['academic'],
  exam:       ['academic'],
  hostel:     ['academic'],
  department: ['academic'],
  registrar:  ['academic'],
};

// ---------------------------------------------------------------------------
// STUDENT
// ---------------------------------------------------------------------------

// GET /api/clearance/me
exports.getMine = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    // Current (pending/cleared) first, then history
    const requests = await ClearanceRequest.find({ studentId: student._id })
      .sort({ requestedAt: -1 })
      .limit(10);

    res.json({
      current: requests.find((r) => ['pending', 'cleared'].includes(r.status)) || null,
      history: requests.filter((r) => !['pending', 'cleared'].includes(r.status)),
      all: requests,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/clearance/me/request   { reason, note? }
exports.createRequest = async (req, res) => {
  try {
    const { reason, note } = req.body;
    if (!['graduation', 'end_of_semester', 'leave_of_absence', 'transfer'].includes(reason)) {
      return res.status(400).json({ message: 'Valid reason required' });
    }

    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    // Block if a pending request already exists
    const existing = await ClearanceRequest.findOne({ studentId: student._id, status: 'pending' });
    if (existing) {
      return res.status(400).json({ message: 'You already have a pending clearance request', request: existing });
    }

    // Build the 6 offices, all pending initially
    const offices = OFFICES.map((office) => ({ office, status: 'pending' }));

    const request = new ClearanceRequest({
      studentId:     student._id,
      studentNumber: student.studentNumber,
      reason,
      note,
      semester:      student.currentSemester,
      academicYear:  '2026/2027',
      offices,
      status: 'pending',
    });

    // Auto-fill Finance gate via the seam
    try {
      const Student2 = require('../models/Student'); // avoid circular
      const verdict = await require('./feeController').getClearanceVerdictInternal
        ? null : null;
      // Simpler: call the seam logic directly
      const fees = student.fees || { total: 0, paid: 0, balance: 0 };
      const financeGate = request.offices.find((o) => o.office === 'finance');
      if (fees.total === 0) {
        financeGate.status       = 'approved';
        financeGate.autoFilled   = true;
        financeGate.autoVerdict  = 'No outstanding financial obligation';
        financeGate.actedAt      = new Date();
      } else if (fees.balance <= 0) {
        financeGate.status       = 'approved';
        financeGate.autoFilled   = true;
        financeGate.autoVerdict  = 'All fees settled';
        financeGate.actedAt      = new Date();
      } else {
        financeGate.status       = 'rejected';
        financeGate.autoFilled   = true;
        financeGate.autoVerdict  = `Outstanding balance of KES ${fees.balance.toLocaleString()}`;
        financeGate.note         = financeGate.autoVerdict;
        financeGate.actedAt      = new Date();
      }
      financeGate.autoBreakdown = { ...fees };
    } catch (e) {
      console.error('Finance auto-fill failed:', e.message);
    }

    await request.save();

    // Notify every office except finance (it's auto-filled or handled by finance)
    await notifyRole('academic', {
      type:  'clearance.requested',
      title: `New clearance request from ${student.studentNumber}`,
      body:  `Reason: ${reason.replace(/_/g, ' ')}. Multiple offices need to approve.`,
      link:  '/erp/clearance',
    });

    await notify(student.userId, {
      type:  'clearance.requested',
      title: 'Clearance request submitted',
      body:  `Your ${reason.replace(/_/g, ' ')} clearance is in progress.`,
      link:  '/portal/clearance',
    });

    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/clearance/me/cancel
exports.cancelMine = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const request = await ClearanceRequest.findOne({ studentId: student._id, status: 'pending' });
    if (!request) return res.status(404).json({ message: 'No pending clearance' });

    request.status = 'cancelled';
    request.completedAt = new Date();
    await request.save();

    await notifyRole('academic', {
      type:  'clearance.cancelled',
      title: `Clearance cancelled by ${student.studentNumber}`,
      body:  'The student withdrew their clearance request.',
      link:  '/erp/clearance',
    });

    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/clearance/me/certificate
exports.getMyCertificate = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const request = await ClearanceRequest.findOne({
      studentId: student._id,
      status: 'cleared',
    }).sort({ completedAt: -1 });

    if (!request) return res.status(404).json({ message: 'No certificate on record' });

    res.json({
      certificateNumber:   request.certificateNumber,
      certificateIssuedAt: request.certificateIssuedAt,
      payload:             request.certificatePayload,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------------------------------------
// STAFF
// ---------------------------------------------------------------------------

// GET /api/clearance/queue
// Returns pending items whose gate matches my office(s).
exports.getQueue = async (req, res) => {
  try {
    const role = req.user.role;
    const myOffices = Object.entries(OFFICE_ROLES)
      .filter(([, roles]) => roles.includes(role))
      .map(([office]) => office);

    if (myOffices.length === 0) return res.json([]);

    const requests = await ClearanceRequest.find({ status: 'pending' })
      .populate('studentId', 'personalInfo studentNumber programmeInfo')
      .sort({ requestedAt: -1 })
      .lean();

    const rows = requests
      .map((r) => {
        const gates = r.offices.filter((o) => myOffices.includes(o.office) && o.status === 'pending');
        if (gates.length === 0) return null;
        return {
          _id:           r._id,
          studentNumber: r.studentNumber,
          studentName:   [r.studentId?.personalInfo?.title, r.studentId?.personalInfo?.surname, r.studentId?.personalInfo?.lastName]
                           .filter(Boolean).join(' ') || 'Unnamed',
          reason:        r.reason,
          requestedAt:   r.requestedAt,
          myOffices:     gates.map((g) => g.office),
        };
      })
      .filter(Boolean);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/clearance/:id
exports.getOne = async (req, res) => {
  try {
    const request = await ClearanceRequest.findById(req.params.id)
      .populate('studentId', 'personalInfo studentNumber programmeInfo fees feeStatus');
    if (!request) return res.status(404).json({ message: 'Request not found' });
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/clearance/:id/office/:office/approve
exports.approveGate = async (req, res) => {
  try {
    const { id, office } = req.params;
    const body = req.body || {};
    if (!OFFICES.includes(office)) return res.status(400).json({ message: 'Unknown office' });
    if (!OFFICE_ROLES[office].includes(req.user.role)) {
      return res.status(403).json({ message: 'You cannot action this office' });
    }

    const request = await ClearanceRequest.findById(id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ message: `Request already ${request.status}` });

    const gate = request.offices.find((o) => o.office === office);
    if (!gate) return res.status(404).json({ message: 'Gate not found' });
    if (gate.status === 'approved') return res.json(request);

    gate.status  = 'approved';
    gate.actedBy = req.user._id;
    gate.actedAt = new Date();
   gate.note = (req.body && req.body.note) || '';

    await finalizeIfAllApproved(request);

    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/clearance/:id/office/:office/reject   { reason }
exports.rejectGate = async (req, res) => {
  try {
    const { id, office } = req.params;
   const { reason } = req.body || {};
    if (!OFFICES.includes(office)) return res.status(400).json({ message: 'Unknown office' });
    if (!OFFICE_ROLES[office].includes(req.user.role)) {
      return res.status(403).json({ message: 'You cannot action this office' });
    }
    if (!reason) return res.status(400).json({ message: 'Rejection reason required' });

    const request = await ClearanceRequest.findById(id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ message: `Request already ${request.status}` });

    const gate = request.offices.find((o) => o.office === office);
    if (!gate) return res.status(404).json({ message: 'Gate not found' });

    gate.status  = 'rejected';
    gate.note    = reason;
    gate.actedBy = req.user._id;
    gate.actedAt = new Date();

    // Soft reject: request stays pending; other gates unaffected.
    await request.save();

    // Notify the student about this specific rejection
    const student = await Student.findById(request.studentId).select('userId');
    if (student) {
      await notify(student.userId, {
        type:  'clearance.office_rejected',
        title: `Clearance: ${office} rejected`,
        body:  reason,
        link:  '/portal/clearance',
      });
    }

    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/clearance/:id/recheck-finance
exports.recheckFinance = async (req, res) => {
  try {
    const request = await ClearanceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ message: `Request already ${request.status}` });

    const student = await Student.findById(request.studentId).lean();
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const fees = student.fees || { total: 0, paid: 0, balance: 0 };
    const gate = request.offices.find((o) => o.office === 'finance');

    const cleared = !fees.total || fees.total === 0 || fees.balance <= 0;
    gate.status      = cleared ? 'approved' : 'rejected';
    gate.autoFilled  = true;
    gate.autoVerdict = cleared
      ? (fees.total === 0 ? 'No outstanding financial obligation' : 'All fees settled')
      : `Outstanding balance of KES ${fees.balance.toLocaleString()}`;
    gate.note        = cleared ? '' : gate.autoVerdict;
    gate.actedAt     = new Date();
    gate.autoBreakdown = { ...fees };

    await finalizeIfAllApproved(request);
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/clearance/all   (registrar view)
exports.listAll = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const rows = await ClearanceRequest.find(filter)
      .populate('studentId', 'personalInfo studentNumber')
      .sort({ requestedAt: -1 })
      .limit(100);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Auto-recheck — called from Finance when a payment is confirmed
// Re-evaluates the finance gate for a student's pending clearance request.
// Returns the updated request or null (if no pending clearance exists).
// ---------------------------------------------------------------------------
exports.autoRecheckFinance = async (studentId) => {
  try {
    const request = await ClearanceRequest.findOne({ studentId, status: 'pending' });
    if (!request) return null;

    const student = await Student.findById(studentId).lean();
    if (!student) return null;

    const fees = student.fees || { total: 0, paid: 0, balance: 0 };
    const gate = request.offices.find((o) => o.office === 'finance');
    if (!gate) return null;

    const cleared = !fees.total || fees.total === 0 || fees.balance <= 0;

    // Don't touch a gate that already matches the new state
    const newStatus = cleared ? 'approved' : 'rejected';
    if (gate.status === newStatus) return request;

    gate.status      = newStatus;
    gate.autoFilled  = true;
    gate.autoVerdict = cleared
      ? (fees.total === 0 ? 'No outstanding financial obligation' : 'All fees settled')
      : `Outstanding balance of KES ${fees.balance.toLocaleString()}`;
    gate.note        = cleared ? '' : gate.autoVerdict;
    gate.actedAt     = new Date();
    gate.autoBreakdown = { ...fees };

    // finalizeIfAllApproved will save and issue certificate if all gates pass
    await finalizeIfAllApproved(request);

    return request;
  } catch (err) {
    console.error('autoRecheckFinance failed:', err.message);
    return null;
  }
};
async function finalizeIfAllApproved(request) {
  const allApproved = request.offices.every((o) => o.status === 'approved');
  if (!allApproved) {
    await request.save();
    return request;
  }

  request.status              = 'cleared';
  request.completedAt         = new Date();
  request.certificateNumber   = await generateCertificateNumber();
  request.certificateIssuedAt = new Date();
  request.certificatePayload  = {
    studentNumber: request.studentNumber,
    reason:        request.reason,
    semester:      request.semester,
    academicYear:  request.academicYear,
    offices:       request.offices.map((o) => ({
      office: o.office, actedAt: o.actedAt, note: o.note,
    })),
    issuedAt:      request.certificateIssuedAt,
  };

  await request.save();

  const student = await Student.findById(request.studentId).select('userId');
  if (student) {
    await notify(student.userId, {
      type:  'clearance.completed',
      title: 'You are cleared!',
      body:  `Certificate ${request.certificateNumber} issued.`,
      link:  '/portal/clearance',
    });
  }

  return request;
}

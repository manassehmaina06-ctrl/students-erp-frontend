const Student = require('../models/Student');
const { notify, notifyRole } = require('../utils/notify');
const { generateReceiptNumber } = require('../utils/generateReceiptNumber');
// Recompute total / paid / balance from billings + payments
const recompute = (student) => {
  const total = (student.billings || []).reduce((s, b) => s + (Number(b.amount) || 0), 0);

  // Only confirmed payments count toward the balance.
  // Payments without a status field (legacy) default to confirmed.
  const paid = (student.payments || [])
    .filter((p) => (p.status || 'confirmed') === 'confirmed')
    .reduce((s, p) => s + (Number(p.amount) || 0), 0);

  student.fees.total   = total;
  student.fees.paid    = paid;
  student.fees.balance = Math.max(total - paid, 0);
  student.feeStatus =
    total > 0 && paid >= total ? 'paid'
    : paid > 0 ? 'partial'
    : 'pending';
};

// POST /api/students/:id/billings   { reference?, label, amount }
exports.addBilling = async (req, res) => {
  try {
    const { reference, label, amount } = req.body;
    if (!label || !amount) return res.status(400).json({ message: 'label and amount required' });

    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    student.billings.push({
      reference: reference || label,
      label,
      amount: Number(amount),
      createdBy: req.user._id,
    });

    recompute(student);
    await student.save();
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/students/:id/billings/:billId
exports.removeBilling = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    student.billings = student.billings.filter(
      (b) => b._id.toString() !== req.params.billId
    );
    recompute(student);
    await student.save();
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/students/:id/payments   { amount, method, reference?, note? }
exports.recordPayment = async (req, res) => {
  try {
    const { amount, method, reference, note } = req.body;
    if (!amount || !method) return res.status(400).json({ message: 'amount and method required' });
    if (!['bank', 'mpesa', 'cheque'].includes(method)) {
      return res.status(400).json({ message: 'method must be bank, mpesa or cheque' });
    }

    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    student.payments.push({
      amount: Number(amount),
      method,
      reference,
      note,
      recordedBy: req.user._id,
      paidAt: new Date(),
    });

    recompute(student);
    await student.save();
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------------------------------------
// STUDENT PORTAL — /me endpoints
// ---------------------------------------------------------------------------

// GET /api/fees/me/ledger
exports.getMyLedger = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    // Gate: fee access requires enrollment
    if (!student.enrolledAt || !req.user.enrolled) {
      return res.status(403).json({
        message: 'Fee access is available after enrollment',
        enrolled: false,
      });
    }

    res.json({
      studentNumber: student.studentNumber,
      applicationNumber: student.applicationNumber,
      feeStatus: student.feeStatus || 'pending',
      fees: {
        total:   student.fees?.total   || 0,
        paid:    student.fees?.paid    || 0,
        balance: student.fees?.balance || 0,
      },
         billings: (student.billings || []).map((b) => ({
        _id:          b._id,
        label:        b.label,
        reference:    b.reference,
        amount:       b.amount,
        description:  b.description,
        category:     b.category,
        semester:     b.semester,
        academicYear: b.academicYear,
        dueDate:      b.dueDate,
        createdAt:    b.createdAt,
      })),
          payments: (student.payments || []).map((p) => ({
        _id:             p._id,
        amount:          p.amount,
        method:          p.method,
        reference:       p.reference,
        note:            p.note,
        status:          p.status || 'confirmed',
        rejectionReason: p.rejectionReason,
        confirmedAt:     p.confirmedAt,
        receiptNumber:   p.receiptNumber || null,
        receiptIssuedAt: p.receiptIssuedAt || null,
        paidAt:          p.paidAt,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/fees/me/payments   { amount, method, reference?, note? }
exports.submitMyPayment = async (req, res) => {
  try {
    const { amount, method, reference, note } = req.body;
    if (!amount || !method) {
      return res.status(400).json({ message: 'amount and method required' });
    }
    if (!['bank', 'mpesa', 'cheque'].includes(method)) {
      return res.status(400).json({ message: 'method must be bank, mpesa or cheque' });
    }
    if (Number(amount) <= 0) {
      return res.status(400).json({ message: 'amount must be greater than 0' });
    }

    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    // Gate: payments can only be submitted after enrollment
    if (!student.enrolledAt || !req.user.enrolled) {
      return res.status(403).json({ message: 'Payments are available after enrollment' });
    }
    // TODO: introduce PaymentSchema.status ('pending' | 'confirmed')
    // so finance must verify student-submitted payments before they count.
       student.payments.push({
      amount: Number(amount),
      method,
      reference,
      note,
      status: 'pending',            // student submission → awaits finance confirmation
      submittedBy: req.user._id,
      paidAt: new Date(),
    });

    recompute(student);
    await student.save();
        // Notify all Finance users that a payment awaits confirmation
    const studentName = [student.personalInfo?.title, student.personalInfo?.surname, student.personalInfo?.lastName]
      .filter(Boolean).join(' ') || student.studentNumber || 'A student';
    await notifyRole('finance', {
      type:  'payment.submitted',
      title: 'New payment awaiting confirmation',
      body:  `${studentName} (${student.studentNumber}) submitted KES ${Number(amount).toLocaleString()} via ${method}.`,
      link:  '/erp/finance/pending',
    });

    res.json({
      message: 'Payment recorded',
      fees: {
        total:   student.fees.total,
        paid:    student.fees.paid,
        balance: student.fees.balance,
      },
      feeStatus: student.feeStatus,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// ---------------------------------------------------------------------------
// FINANCE — pending payment workflow
// ---------------------------------------------------------------------------

// GET /api/fees/pending
// Returns every pending payment across all students, with student context.
exports.getPendingPayments = async (req, res) => {
  try {
    // Find all students who have at least one pending payment
    const students = await Student.find({ 'payments.status': 'pending' })
      .populate('userId', 'email username')
      .select('studentNumber personalInfo payments fees');

    const rows = [];
    for (const s of students) {
      for (const p of (s.payments || [])) {
        if ((p.status || 'confirmed') !== 'pending') continue;
        rows.push({
          paymentId:      p._id,
          studentId:      s._id,
          studentNumber:  s.studentNumber,
          studentName:    [s.personalInfo?.title, s.personalInfo?.surname, s.personalInfo?.lastName]
                            .filter(Boolean).join(' ') || 'Unnamed',
          studentEmail:   s.personalInfo?.email || s.userId?.email || '—',
          amount:         p.amount,
          method:         p.method,
          reference:      p.reference,
          note:           p.note,
          submittedAt:    p.paidAt,
          feesTotal:      s.fees?.total || 0,
          feesPaid:       s.fees?.paid || 0,
          feesBalance:    s.fees?.balance || 0,
        });
      }
    }

    rows.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/fees/payments/:paymentId/confirm
exports.confirmPayment = async (req, res) => {
  try {
    const student = await Student.findOne({ 'payments._id': req.params.paymentId });
    if (!student) return res.status(404).json({ message: 'Payment not found' });

    const payment = student.payments.id(req.params.paymentId);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    if (payment.status !== 'pending') {
      return res.status(400).json({ message: `Payment is already ${payment.status}` });
    }

       payment.status          = 'confirmed';
    payment.recordedBy      = req.user._id;
    payment.confirmedAt     = new Date();
    payment.receiptNumber   = await generateReceiptNumber();
    payment.receiptIssuedAt = new Date();
    payment.receiptIssuedBy = req.user._id;

    recompute(student);
    await student.save();

    // Notify the student about the confirmation
    await notify(student.userId, {
      type:  'payment.confirmed',
      title: `Payment confirmed — ${payment.receiptNumber}`,
      body:  `Receipt ${payment.receiptNumber} issued for KES ${payment.amount.toLocaleString()}. New balance: KES ${student.fees.balance.toLocaleString()}.`,
      link:  '/portal/fees',
    });

    // Auto-recheck: if the student has a pending clearance request,
    // re-evaluate the Finance gate and auto-certify if all gates pass.
    try {
      const { autoRecheckFinance } = require('./clearanceController');
      await autoRecheckFinance(student._id);
    } catch (e) {
      console.error('Post-payment clearance recheck failed:', e.message);
    }
    res.json({
      message: 'Payment confirmed',
         payment: {
        _id:           payment._id,
        amount:        payment.amount,
        status:        payment.status,
        receiptNumber: payment.receiptNumber,
      },
      fees: {
        total:   student.fees.total,
        paid:    student.fees.paid,
        balance: student.fees.balance,
      },
      feeStatus: student.feeStatus,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/fees/payments/:paymentId/reject   { reason }
exports.rejectPayment = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ message: 'Rejection reason required' });

    const student = await Student.findOne({ 'payments._id': req.params.paymentId });
    if (!student) return res.status(404).json({ message: 'Payment not found' });

    const payment = student.payments.id(req.params.paymentId);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    if (payment.status !== 'pending') {
      return res.status(400).json({ message: `Payment is already ${payment.status}` });
    }

    payment.status          = 'rejected';
    payment.rejectionReason = reason;
    payment.recordedBy      = req.user._id;

    recompute(student);
    await student.save();

    res.json({
      message: 'Payment rejected',
      payment: { _id: payment._id, status: payment.status, reason: payment.rejectionReason },
      fees: {
        total:   student.fees.total,
        paid:    student.fees.paid,
        balance: student.fees.balance,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/fees/payments/:paymentId   { amount?, reference?, note? }
exports.updatePayment = async (req, res) => {
  try {
    const { amount, reference, note } = req.body;

    const student = await Student.findOne({ 'payments._id': req.params.paymentId });
    if (!student) return res.status(404).json({ message: 'Payment not found' });

    const payment = student.payments.id(req.params.paymentId);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    if (payment.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending payments can be edited' });
    }

    if (amount != null) {
      const n = Number(amount);
      if (isNaN(n) || n <= 0) return res.status(400).json({ message: 'Invalid amount' });
      payment.amount = n;
    }
    if (reference != null) payment.reference = reference;
    if (note != null)      payment.note = note;

    recompute(student);
    await student.save();

    res.json({
      message: 'Payment updated',
      payment: {
        _id: payment._id,
        amount: payment.amount,
        reference: payment.reference,
        note: payment.note,
        status: payment.status,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// ---------------------------------------------------------------------------
// FINANCE — bill a new semester for an already-enrolled student
// POST /api/fees/:studentId/semesters
// Body: { semester, academicYear, billings: [{label, amount, description?, category?, dueDate?}] }
// ---------------------------------------------------------------------------
exports.billSemester = async (req, res) => {
  try {
    const { semester, academicYear, billings } = req.body;

    if (!semester || !academicYear) {
      return res.status(400).json({ message: 'semester and academicYear required' });
    }
    if (!Array.isArray(billings) || billings.length === 0) {
      return res.status(400).json({ message: 'billings array required' });
    }

       const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    if (!student.enrolledAt) {
      return res.status(400).json({ message: 'Student is not enrolled yet' });
    }

    const newItems = billings
      .filter((b) => b.label && Number(b.amount) > 0)
      .map((b) => ({
        label:        String(b.label).trim(),
        reference:    b.reference || String(b.label).trim(),
        amount:       Number(b.amount),
        description:  b.description || '',
        category:     b.category || 'General',
        dueDate:      b.dueDate || null,
        semester:     semester.trim(),
        academicYear: academicYear.trim(),
        createdBy:    req.user._id,
      }));

    if (newItems.length === 0) {
      return res.status(400).json({ message: 'No valid billings in payload' });
    }

    student.billings.push(...newItems);
    student.currentSemester = semester.trim();

    recompute(student);
    await student.save();
        await notify(student.userId, {
      type:  'semester.billed',
      title: `Semester ${semester} billed`,
      body:  `New billings for ${semester}: KES ${newItems.reduce((s, i) => s + i.amount, 0).toLocaleString()}. Total balance: KES ${student.fees.balance.toLocaleString()}.`,
      link:  '/portal/fees',
    });

    res.json({
      message: `Billed ${newItems.length} item(s) for ${semester}`,
      added: newItems.length,
      fees: {
        total:   student.fees.total,
        paid:    student.fees.paid,
        balance: student.fees.balance,
      },
      feeStatus: student.feeStatus,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// ---------------------------------------------------------------------------
// STAFF — get any student's ledger (admissions/academic/finance)
// GET /api/fees/:id/ledger
// ---------------------------------------------------------------------------
exports.getStudentLedger = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    res.json({
      studentNumber:     student.studentNumber,
      applicationNumber: student.applicationNumber,
      currentSemester:   student.currentSemester,
      feeStatus:         student.feeStatus || 'pending',
      fees: {
        total:   student.fees?.total   || 0,
        paid:    student.fees?.paid    || 0,
        balance: student.fees?.balance || 0,
      },
      billings: (student.billings || []).map((b) => ({
        _id:          b._id,
        label:        b.label,
        reference:    b.reference,
        amount:       b.amount,
        description:  b.description,
        category:     b.category,
        semester:     b.semester,
        academicYear: b.academicYear,
        dueDate:      b.dueDate,
        createdAt:    b.createdAt,
      })),
             payments: (student.payments || []).map((p) => ({
            _id:             p._id,
            amount:          p.amount,
            method:          p.method,
            reference:       p.reference,
            note:            p.note,
            status:          p.status || 'confirmed',
            rejectionReason: p.rejectionReason,
            confirmedAt:     p.confirmedAt,
            receiptNumber:   p.receiptNumber || null,
            receiptIssuedAt: p.receiptIssuedAt || null,
            paidAt:          p.paidAt,
          })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// ---------------------------------------------------------------------------
// FINANCE SEAM — Clearance reads this to fill the Finance gate
// GET /api/finance/clearance/:studentId
// Always returns 200, verdict in body.
// ---------------------------------------------------------------------------
exports.getClearanceVerdict = async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId).lean();
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const fees = student.fees || { total: 0, paid: 0, balance: 0 };

    // D4 = A: zero billings → auto-cleared
    if (!fees.total || fees.total === 0) {
      return res.json({
        studentId: student._id,
        cleared: true,
        reason: 'No outstanding financial obligation',
        breakdown: { total: 0, paid: 0, balance: 0, feeStatus: 'cleared' },
        checkedAt: new Date().toISOString(),
      });
    }

    const overdue = (student.billings || []).some(
      (b) => b.dueDate && new Date(b.dueDate) < new Date() && (b.amount - (b.paid || 0)) > 0
    );

    const cleared = fees.balance <= 0 && !overdue;
    const reason = cleared
      ? 'All fees settled'
      : overdue
        ? 'Overdue invoice on account'
        : `Outstanding balance of KES ${fees.balance.toLocaleString()}`;

    res.json({
      studentId: student._id,
      cleared,
      reason,
      breakdown: {
        total:            fees.total,
        paid:             fees.paid,
        balance:          fees.balance,
        feeStatus:        student.feeStatus || 'pending',
        hasOverdueInvoice: overdue,
      },
      checkedAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// ---------------------------------------------------------------------------
// PDF RECEIPT DOWNLOADS
// ---------------------------------------------------------------------------
const PDFDocument = require('pdfkit');
const generateReceiptPdf = require('../utils/generateReceiptPdf');

// Shared logic: find payment by receiptNumber, verify access, generate PDF.
async function streamReceipt(res, receiptNumber, allowedStudentId = null) {
  // 1. Find the student whose payments[] contains this receiptNumber
  const student = await Student.findOne({ 'payments.receiptNumber': receiptNumber })
    .populate('programmeInfo.programme')
    .populate('userId', 'email');

  if (!student) {
    return res.status(404).json({ message: 'Receipt not found' });
  }

  // 2. If restricted (student role), verify ownership
  if (allowedStudentId && String(student._id) !== String(allowedStudentId)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  // 3. Find the specific payment
  const payment = (student.payments || []).find((p) => p.receiptNumber === receiptNumber);
  if (!payment) {
    return res.status(404).json({ message: 'Receipt not found on this student' });
  }

  // 4. Build the programme object
  const programme = student.programmeInfo?.programme
    ? { name: student.programmeInfo.programme.name, code: student.programmeInfo.programme.code }
    : null;

  const fees = {
    total:   student.fees?.total   || 0,
    paid:    student.fees?.paid    || 0,
    balance: student.fees?.balance || 0,
  };

  // 5. Set headers and stream the PDF
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `inline; filename="${payment.receiptNumber}.pdf"`
  );

  const doc = generateReceiptPdf(payment, student, fees, programme);
  doc.pipe(res);
}

// GET /api/fees/me/receipt/:receiptNumber
// Student downloads their own receipt.
exports.getMyReceiptPdf = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id }).select('_id');
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    await streamReceipt(res, req.params.receiptNumber, student._id);
  } catch (err) {
    console.error('getMyReceiptPdf error:', err);
    if (!res.headersSent) res.status(500).json({ message: err.message });
  }
};

// GET /api/fees/receipt/:receiptNumber
// Staff (finance, admissions) download any receipt.
exports.getReceiptPdf = async (req, res) => {
  try {
    await streamReceipt(res, req.params.receiptNumber, null);
  } catch (err) {
    console.error('getReceiptPdf error:', err);
    if (!res.headersSent) res.status(500).json({ message: err.message });
  }
};
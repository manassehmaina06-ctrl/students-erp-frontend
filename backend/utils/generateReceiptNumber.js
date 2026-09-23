const Student = require('../models/Student');

// Generate RCPT-YYYY-MM-DD-NNNN
//   YYYY-MM-DD = today's date
//   NNNN       = 4-digit sequence for that day, zero-padded
exports.generateReceiptNumber = async () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const prefix = `RCPT-${yyyy}-${mm}-${dd}-`;

  // Find the highest sequence number already issued today
  const escaped = prefix.replace(/-/g, '\\-');
  const result = await Student.aggregate([
    { $unwind: '$payments' },
    { $match: { 'payments.receiptNumber': { $regex: `^${escaped}` } } },
    { $project: { tail: { $substrCP: ['$payments.receiptNumber', prefix.length, 4] } } },
    { $sort: { tail: -1 } },
    { $limit: 1 },
  ]);

  const lastSeq = result[0] ? parseInt(result[0].tail, 10) : 0;
  const next    = (isNaN(lastSeq) ? 0 : lastSeq) + 1;
  const seqStr  = String(next).padStart(4, '0');

  return `${prefix}${seqStr}`;
};

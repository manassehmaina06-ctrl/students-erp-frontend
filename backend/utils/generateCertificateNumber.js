const ClearanceRequest = require('../models/ClearanceRequest');

// Generate CLR-YYYY-MM-DD-NNNN
exports.generateCertificateNumber = async () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const prefix = `CLR-${yyyy}-${mm}-${dd}-`;

  const escaped = prefix.replace(/-/g, '\\-');
  const result = await ClearanceRequest.aggregate([
    { $match: { certificateNumber: { $regex: `^${escaped}` } } },
    { $project: { tail: { $substrCP: ['$certificateNumber', prefix.length, 4] } } },
    { $sort: { tail: -1 } },
    { $limit: 1 },
  ]);

  const lastSeq = result[0] ? parseInt(result[0].tail, 10) : 0;
  const next = (isNaN(lastSeq) ? 0 : lastSeq) + 1;
  return `${prefix}${String(next).padStart(4, '0')}`;
};

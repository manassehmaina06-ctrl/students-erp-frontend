const Application = require('../models/Application');
const Student     = require('../models/Student');

async function maxSequence(Model, field, prefix) {
  const year = new Date().getFullYear();
  const fullPrefix = `${prefix}-${year}-`;

  const latest = await Model
    .findOne(
      { [field]: { $regex: `^${fullPrefix}` } },
      { [field]: 1 }
    )
    .sort({ [field]: -1 })
    .lean();

  let nextSeq = 1;
  if (latest && latest[field]) {
    const tail = latest[field].slice(fullPrefix.length);
    const parsed = parseInt(tail, 10);
    if (!isNaN(parsed)) nextSeq = parsed + 1;
  }

  return `${fullPrefix}${String(nextSeq).padStart(5, '0')}`;
}

exports.generateApplicationNumber = () =>
  maxSequence(Application, 'applicationNumber', 'APP');

exports.generateStudentNumber = () =>
  maxSequence(Student, 'studentNumber', 'STU');
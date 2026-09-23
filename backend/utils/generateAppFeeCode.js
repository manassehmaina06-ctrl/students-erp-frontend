const Application = require('../models/Application');

exports.generateApplicationFeeCode = async () => {
  const year = new Date().getFullYear();
  const count = await Application.countDocuments({
    applicationFeeCode: { $exists: true, $ne: null },
  });
  return `APPFEE-${year}-${String(count + 1).padStart(5, '0')}`;
};

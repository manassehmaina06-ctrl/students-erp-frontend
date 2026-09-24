const Programme = require('../models/Programme');

exports.getAllProgrammes = async (req, res) => {
  try {
    const programmes = await Programme.find();
    res.json(programmes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
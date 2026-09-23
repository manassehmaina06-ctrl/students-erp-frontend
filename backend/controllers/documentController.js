const Document = require('../models/Document');
const Student = require('../models/Student');

exports.uploadDocument = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    const { originalname, path, mimetype } = req.file;
    const doc = new Document({
      studentId: student._id,
      name: originalname,
      filePath: path,
      fileType: mimetype,
    });
    await doc.save();
    student.documents.push(doc._id);
    await student.save();
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const DEST = 'uploads/assignments';

if (!fs.existsSync(DEST)) fs.mkdirSync(DEST, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, DEST),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  },
});

const ALLOWED = /pdf|doc|docx|ppt|pptx|xls|xlsx|zip|txt|jpeg|jpg|png|gif/i;

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  if (ALLOWED.test(ext)) return cb(null, true);
  cb(new Error('Unsupported file type'));
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 },
});
// Converts a stored file path into a public URL
// Usage: fileUrl('uploads/assignments/foo.pdf') → 'http://localhost:5000/uploads/assignments/foo.pdf'
const BASE = process.env.PUBLIC_BASE_URL || 'http://localhost:5000';

function fileUrl(p) {
  if (!p) return null;
  const clean = String(p).replace(/\\/g, '/').replace(/^\/+/, '');
  return `${BASE}/${clean}`;
}

module.exports = { fileUrl };

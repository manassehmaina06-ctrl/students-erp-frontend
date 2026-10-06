const Message = require('../models/Message');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Student = require('../models/Student');
const Unit = require('../models/Unit');
const UnitRegistration = require('../models/UnitRegistration');

const displayName = (student) => {
  const p = student.personalInfo || {};
  const parts = [p.title, p.surname, p.lastName].filter(Boolean);
  return parts.join(' ') || student.studentNumber || 'Unnamed';
};

const canMessage = async (fromUserId, toUserId, unitId) => {
  if (String(fromUserId) === String(toUserId)) return { ok: false, reason: 'Cannot message yourself' };
  const [from, to] = await Promise.all([User.findById(fromUserId), User.findById(toUserId)]);
  if (!from || !to) return { ok: false, reason: 'User not found' };
  if (unitId) {
    const unit = await Unit.findById(unitId);
    if (!unit) return { ok: false, reason: 'Unit not found' };
    if (from.role === 'student') {
      const student = await Student.findOne({ userId: from._id });
      if (!student) return { ok: false, reason: 'Student profile not found' };
      const enrolled = await UnitRegistration.exists({ studentId: student._id, unitIds: unit._id, status: 'approved' });
      if (!enrolled) return { ok: false, reason: 'You are not enrolled in this unit' };
    }
    if (from.role === 'lecturer' && String(unit.lecturerId) !== String(from._id)) {
      return { ok: false, reason: 'You do not own this unit' };
    }
  }
  return { ok: true };
};

exports.sendMessage = async (req, res) => {
  try {
    const { toUserId, unitId, subject, body, parentId } = req.body;
    if (!toUserId) return res.status(400).json({ message: 'toUserId required' });
    if (!body || !body.trim()) return res.status(400).json({ message: 'Body required' });
    const check = await canMessage(req.user._id, toUserId, unitId);
    if (!check.ok) return res.status(403).json({ message: check.reason });
    const recipient = await User.findById(toUserId);
    const msg = await Message.create({
      fromUserId: req.user._id, fromRole: req.user.role,
      toUserId, toRole: recipient?.role || 'unknown',
      unitId: unitId || null,
      subject: (subject || '').trim(), body: body.trim(),
      parentId: parentId || null,
    });
    try {
      const sender = await User.findById(req.user._id);
      await Notification.create({
        userId: toUserId, type: 'message.new',
        title: 'New message from ' + (sender?.email || 'someone'),
        body: body.trim().slice(0, 120),
        link: sender?.role === 'student' ? '/erp/messages' : '/lms/messages',
      });
    } catch (e) { console.error('Notification failed:', e.message); }
    res.status(201).json({ message: msg });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getInbox = async (req, res) => {
  try {
    const box = req.query.box === 'sent' ? 'sent' : 'inbox';
    const filter = box === 'sent' ? { fromUserId: req.user._id } : { toUserId: req.user._id };
    const messages = await Message.find(filter).sort({ createdAt: -1 }).limit(200)
      .populate('fromUserId', 'email role').populate('toUserId', 'email role')
      .populate('unitId', 'code name').lean();

    const studentUserIds = messages.flatMap((m) => [m.fromUserId && m.fromUserId._id, m.toUserId && m.toUserId._id]).filter(Boolean);
    const students = await Student.find({ userId: { $in: studentUserIds } }).select('userId studentNumber personalInfo');
    const studentMap = Object.fromEntries(students.map((s) => [String(s.userId), s]));

    const rows = messages.map((m) => {
      const fromStudent = studentMap[String(m.fromUserId && m.fromUserId._id)];
      const toStudent = studentMap[String(m.toUserId && m.toUserId._id)];
      return {
        _id: m._id, subject: m.subject, body: m.body, createdAt: m.createdAt, readAt: m.readAt,
        unit: m.unitId ? { code: m.unitId.code, name: m.unitId.name } : null,
        from: { _id: m.fromUserId && m.fromUserId._id, email: m.fromUserId && m.fromUserId.email, name: fromStudent ? displayName(fromStudent) : ((m.fromUserId && m.fromUserId.email) || '-'), role: m.fromRole },
        to:   { _id: m.toUserId && m.toUserId._id,     email: m.toUserId && m.toUserId.email,     name: toStudent ? displayName(toStudent) : ((m.toUserId && m.toUserId.email) || '-'),     role: m.toRole },
      };
    });
    const unreadCount = box === 'inbox' ? await Message.countDocuments({ toUserId: req.user._id, readAt: null }) : 0;
    res.json({ messages: rows, unreadCount });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.markRead = async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    if (String(msg.toUserId) !== String(req.user._id)) return res.status(403).json({ message: 'Not your message' });
    if (!msg.readAt) { msg.readAt = new Date(); await msg.save(); }
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.unreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({ toUserId: req.user._id, readAt: null });
    res.json({ count });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getContacts = async (req, res) => {
  try {
    const results = [];
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student) return res.json({ contacts: [] });
      const reg = await UnitRegistration.findOne({ studentId: student._id, status: 'approved' }).populate('unitIds');
      const units = (reg && reg.unitIds) || [];
      for (const u of units) {
        const lecturer = await User.findById(u.lecturerId);
        if (!lecturer) continue;
        results.push({ userId: lecturer._id, email: lecturer.email, role: 'lecturer', unit: { _id: u._id, code: u.code, name: u.name } });
      }
    } else if (req.user.role === 'lecturer') {
      const units = await Unit.find({ lecturerId: req.user._id });
      for (const u of units) {
        const regs = await UnitRegistration.find({ unitIds: u._id, status: 'approved' }).populate('studentId', 'userId studentNumber personalInfo');
        for (const r of regs) {
          if (!r.studentId) continue;
          results.push({ userId: r.studentId.userId, email: displayName(r.studentId), role: 'student', unit: { _id: u._id, code: u.code, name: u.name } });
        }
      }
    }
    res.json({ contacts: results });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

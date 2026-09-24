const Payment = require('../models/Payment');
const Student = require('../models/Student');

exports.createPayment = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    const { amount, currency } = req.body;
    const payment = new Payment({
      studentId: student._id,
      amount,
      currency,
      status: 'pending',
    });
    await payment.save();
    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.confirmPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    payment.status = 'completed';
    payment.paidAt = new Date();
    await payment.save();
    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
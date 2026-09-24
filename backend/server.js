const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/programmes', require('./routes/programmeRoutes'));
app.use('/api/documents', require('./routes/documentRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/admissions', require('./routes/admissionsRoutes'));
app.use('/api/fees',       require('./routes/feeRoutes'));
app.use('/api/students', require('./routes/feeRoutes'));  
app.use('/api/notifications', require('./routes/notificationRoutes'));// <-- new
app.use('/api/academic', require('./routes/academicRoutes'));
app.use('/api/clearance', require('./routes/clearanceRoutes'));
app.use('/api/lecturer', require('./routes/lecturerRoutes'));
app.use('/api/units', require('./routes/unitRoutes'));
app.use('/api/lms', require('./routes/lmsRoutes'));
app.use('/api/registrations', require('./routes/registrationRoutes'));
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Programme = require('./models/Programme');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const seedProgrammes = async () => {
  try {
    await Programme.deleteMany();
    const programmes = [
      { name: 'Computer Science', code: 'BSCS', department: 'Computing', duration: 8, fee: 5000 },
      { name: 'Business Administration', code: 'BBA', department: 'Business', duration: 8, fee: 4500 },
      { name: 'Electrical Engineering', code: 'BSEE', department: 'Engineering', duration: 8, fee: 5500 },
      { name: 'Medicine', code: 'MBBS', department: 'Health Sciences', duration: 12, fee: 8000 },
    ];
    await Programme.insertMany(programmes);
    console.log('Programmes seeded successfully');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedProgrammes();
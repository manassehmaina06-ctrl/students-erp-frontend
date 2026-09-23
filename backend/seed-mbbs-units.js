const mongoose = require('mongoose');
require('dotenv').config();

(async () => {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);

  // Find MBBS programme
  const programme = await mongoose.connection.db.collection('programmes')
    .findOne({ code: 'MBBS' });
  if (!programme) {
    console.error('MBBS programme not found');
    process.exit(1);
  }
  console.log('MBBS programme:', programme.name, '| id:', programme._id.toString());

  // Also grab BSCS for CS101/CS102 (they already exist)
  const bscs = await mongoose.connection.db.collection('programmes')
    .findOne({ code: 'BSCS' });

  // Units to ensure exist. We'll upsert by code.
  const units = [
    { code: 'MED101', name: 'Human Anatomy',           semester: 1, credits: 4, type: 'core' },
    { code: 'MED102', name: 'Human Physiology',        semester: 1, credits: 4, type: 'core' },
    { code: 'MED103', name: 'Medical Biochemistry',    semester: 1, credits: 3, type: 'core' },
    { code: 'MED104', name: 'Histology',               semester: 1, credits: 3, type: 'core' },
    { code: 'MED105', name: 'Medical Ethics',          semester: 1, credits: 2, type: 'core' },
    { code: 'MED106', name: 'Community Health',        semester: 1, credits: 3, type: 'core' },
    // CS101 + CS102 get added to MBBS too so they're available
    { code: 'CS101',  name: 'Introduction to Programming', semester: 1, credits: 3, type: 'elective' },
    { code: 'CS102',  name: 'Data Structures',         semester: 1, credits: 3, type: 'elective' },
  ];

  for (const u of units) {
    const existing = await mongoose.connection.db.collection('units').findOne({ code: u.code });

    if (existing) {
      // Add MBBS to its programmeIds if not present
      await mongoose.connection.db.collection('units').updateOne(
        { _id: existing._id },
        { $addToSet: { programmeIds: programme._id } }
      );
      console.log(`  ${u.code} — already exists, added MBBS programme link`);
    } else {
      await mongoose.connection.db.collection('units').insertOne({
        ...u,
        programmeIds: [programme._id],
        description: `${u.name} — MBBS Semester ${u.semester}`,
        createdAt: new Date(),
      });
      console.log(`  ${u.code} — created`);
    }
  }

  // Count MBBS units
  const count = await mongoose.connection.db.collection('units')
    .countDocuments({ programmeIds: programme._id });
  console.log(`\nMBBS now has ${count} units`);

  await mongoose.disconnect();
  process.exit(0);
})();

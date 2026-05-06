const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('../models/User');

const main = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const users = await User.find({}).select('+password name email role isActive password').lean();
  const tests = {
    'admin@hospital.com': 'Admin@123',
    'dr.ahmed@hospital.com': 'Doctor@123',
    'nurse.ayesha@hospital.com': 'Nurse@123',
    'reception.ali@hospital.com': 'Reception@123',
    'pharmacy.usman@hospital.com': 'Pharmacy@123',
    'lab.zara@hospital.com': 'Lab@12345',
  };
  for (const u of users) {
    const expected = tests[u.email];
    let match = 'N/A';
    if (expected) {
      try { match = await bcrypt.compare(expected, u.password); }
      catch (e) { match = 'ERR:' + e.message; }
    }
    console.log(`${u.email.padEnd(36)} role=${(u.role||'').padEnd(15)} active=${u.isActive} hashLen=${(u.password||'').length} pwMatchesExpected=${match}`);
  }
  console.log(`\nTotal users: ${users.length}`);
  process.exit(0);
};
main().catch(e => { console.error(e); process.exit(1); });

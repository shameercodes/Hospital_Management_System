// One-shot helper to drop any stale unique index on Doctor.doctorId.
// The new seeder generates doctorId via the pre('save') hook, so this is just
// hygiene in case a prior failed seed left a unique index with null entries.
const dotenv = require('dotenv');
const mongoose = require('mongoose');
dotenv.config();

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const coll = mongoose.connection.collection('doctors');
  const indexes = await coll.indexes();
  console.log('Current doctors indexes:', indexes.map(i => i.name));
  for (const idx of indexes) {
    if (idx.name === 'doctorId_1') {
      await coll.dropIndex('doctorId_1');
      console.log('Dropped index doctorId_1 (will be recreated by Mongoose on next connect).');
    }
  }
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });

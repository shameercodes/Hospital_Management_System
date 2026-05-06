const mongoose = require('mongoose');

const ScheduleSlotSchema = new mongoose.Schema({
  day: { type: String, enum: ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] },
  startTime: String,
  endTime: String,
  maxPatients: { type: Number, default: 20 },
  isAvailable: { type: Boolean, default: true }
});

const DoctorSchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  doctorId:   { type: String, unique: true },
  specialization: { type: String, required: true },
  department:     { type: String, required: true },
  qualification:  [String],
  experience:     { type: Number, default: 0 },
  licenseNumber:  { type: String, required: true, unique: true },
  consultationFee: { type: Number, required: true, default: 500 },
  schedule:       [ScheduleSlotSchema],
  bio:            String,
  languages:      [String],
  rating:         { type: Number, default: 0 },
  totalReviews:   { type: Number, default: 0 },
  isAvailable:    { type: Boolean, default: true },
  joiningDate:    { type: Date, default: Date.now }
}, { timestamps: true });

DoctorSchema.pre('save', async function (next) {
  if (!this.doctorId) {
    const count = await mongoose.model('Doctor').countDocuments();
    this.doctorId = `DOC-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Doctor', DoctorSchema);

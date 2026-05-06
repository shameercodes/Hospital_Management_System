const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  appointmentId: { type: String, unique: true },
  patient:  { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor:   { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  date:     { type: Date, required: true },
  timeSlot: { type: String, required: true },
  duration: { type: Number, default: 30 }, // minutes
  type: {
    type: String,
    enum: ['consultation', 'follow-up', 'emergency', 'procedure', 'checkup'],
    default: 'consultation'
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  priority: {
    type: String,
    enum: ['normal', 'urgent', 'critical'],
    default: 'normal'
  },
  chiefComplaint: String,
  symptoms:       [String],
  diagnosis:      String,
  prescription: [{
    medicine: String, dosage: String,
    frequency: String, duration: String, notes: String
  }],
  labTests:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'LabTest' }],
  notes:     String,
  followUpDate: Date,
  cancelReason: String,
  bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fee:      { type: Number },
  isPaid:   { type: Boolean, default: false },
  invoice:  { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' }
}, { timestamps: true });

AppointmentSchema.pre('save', async function (next) {
  if (!this.appointmentId) {
    const count = await mongoose.model('Appointment').countDocuments();
    this.appointmentId = `APT-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

AppointmentSchema.index({ patient: 1, doctor: 1, date: 1, status: 1 });

module.exports = mongoose.model('Appointment', AppointmentSchema);

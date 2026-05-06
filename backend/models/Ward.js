const mongoose = require('mongoose');

const BedSchema = new mongoose.Schema({
  bedNumber: String,
  type: { type: String, enum: ['general', 'private', 'icu', 'nicu', 'emergency'], default: 'general' },
  status: { type: String, enum: ['available', 'occupied', 'maintenance', 'reserved'], default: 'available' },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  admittedAt: Date,
  dailyCharge: { type: Number, default: 2000 }
});

const WardSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  wardNumber: { type: String, unique: true },
  type: {
    type: String,
    enum: ['general', 'private', 'icu', 'nicu', 'emergency', 'pediatric', 'maternity', 'surgery', 'orthopedic', 'cardiology'],
    required: true
  },
  floor:     Number,
  building:  String,
  totalBeds: { type: Number, required: true },
  beds:      [BedSchema],
  headNurse: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedDoctors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }],
  description: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Virtuals must defend against partial projections — when `beds` is not
// selected (e.g. populating ward with only name/wardNumber), `this.beds`
// is undefined and would otherwise throw on toJSON.
WardSchema.virtual('availableBeds').get(function () {
  return (this.beds || []).filter(b => b.status === 'available').length;
});
WardSchema.virtual('occupiedBeds').get(function () {
  return (this.beds || []).filter(b => b.status === 'occupied').length;
});
WardSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Ward', WardSchema);

const mongoose = require('mongoose');

const EmergencyContactSchema = new mongoose.Schema({
  name: String, relationship: String, phone: String
});

const VitalSignSchema = new mongoose.Schema({
  recordedAt: { type: Date, default: Date.now },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  bloodPressure: String,
  heartRate: Number,
  temperature: Number,
  oxygenSaturation: Number,
  respiratoryRate: Number,
  weight: Number,
  height: Number,
  bmi: Number,
  notes: String
});

const AllergySchema = new mongoose.Schema({
  allergen: String,
  reaction: String,
  severity: { type: String, enum: ['mild', 'moderate', 'severe'] }
});

const PatientSchema = new mongoose.Schema({
  patientId: { type: String, unique: true },
  firstName:  { type: String, required: true, trim: true },
  lastName:   { type: String, required: true, trim: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  bloodGroup: { type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-','unknown'] },

  // Contact
  phone:   { type: String, required: true },
  email:   { type: String, lowercase: true },
  address: {
    street: String, city: String, state: String,
    postalCode: String, country: { type: String, default: 'Pakistan' }
  },

  // Medical
  allergies:       [AllergySchema],
  chronicConditions: [String],
  currentMedications: [{ name: String, dosage: String, frequency: String }],
  vitalSigns:      [VitalSignSchema],

  // Insurance
  insurance: {
    provider: String, policyNumber: String,
    groupNumber: String, expiryDate: Date
  },

  emergencyContact: EmergencyContactSchema,

  // Status
  status: {
    type: String,
    enum: ['outpatient', 'inpatient', 'discharged', 'critical', 'observation'],
    default: 'outpatient'
  },
  ward:    { type: mongoose.Schema.Types.ObjectId, ref: 'Ward' },
  bed:     String,
  admittedAt: Date,
  dischargedAt: Date,

  assignedDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  registeredBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  photo: String,
  notes: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Auto-generate patient ID
PatientSchema.pre('save', async function (next) {
  if (!this.patientId) {
    const count = await mongoose.model('Patient').countDocuments();
    this.patientId = `PAT-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

PatientSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

PatientSchema.virtual('age').get(function () {
  return Math.floor((Date.now() - this.dateOfBirth) / (365.25 * 24 * 60 * 60 * 1000));
});

PatientSchema.set('toJSON', { virtuals: true });
PatientSchema.index({ patientId: 1, phone: 1, lastName: 1, firstName: 1 });

module.exports = mongoose.model('Patient', PatientSchema);

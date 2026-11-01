const mongoose = require('mongoose');

const LabTestSchema = new mongoose.Schema({
  testId:  { type: String, unique: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  orderedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },

  testName:    { type: String, required: true },
  testCode:    String,
  category:    { type: String, enum: ['hematology','biochemistry','microbiology','radiology','pathology','serology','urine','other'] },
  urgency:     { type: String, enum: ['routine', 'urgent', 'stat'], default: 'routine' },

  status: {
    type: String,
    enum: ['ordered', 'sample-collected', 'processing', 'completed', 'cancelled'],
    default: 'ordered'
  },

  sampleType: String,
  sampleCollectedAt: Date,
  collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  results: [{
    parameter: String, value: String, unit: String,
    normalRange: String,
    flag: { type: String, enum: ['normal', 'high', 'low', 'critical'], default: 'normal' }
  }],
  resultNotes:    String,
  reportUrl:      String,
  completedAt:    Date,
  verifiedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  price:   Number,
  isPaid:  { type: Boolean, default: false }
}, { timestamps: true });

LabTestSchema.pre('save', async function (next) {
  if (!this.testId) {
    const { nextId } = require('../utils/nextId');
    this.testId = await nextId('LabTest', 'testId', 'LAB-', 6);
  }
  next();
});

module.exports = mongoose.model('LabTest', LabTestSchema);

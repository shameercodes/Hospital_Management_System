const mongoose = require('mongoose');

const MedicineSchema = new mongoose.Schema({
  name:          { type: String, required: true },
  genericName:   String,
  brand:         String,
  category: {
    type: String,
    enum: ['tablet', 'capsule', 'syrup', 'injection', 'ointment', 'drops', 'inhaler', 'patch', 'other']
  },
  manufacturer:  String,
  description:   String,
  composition:   String,
  strength:      String,
  unit:          { type: String, default: 'tablet' },

  // Stock
  quantity:      { type: Number, default: 0 },
  minStockLevel: { type: Number, default: 10 },
  reorderPoint:  { type: Number, default: 50 },
  location:      String, // shelf/rack

  // Pricing
  purchasePrice: Number,
  sellingPrice:  { type: Number, required: true },
  tax:           { type: Number, default: 0 },

  // Expiry
  batchNumber:   String,
  expiryDate:    Date,
  manufactureDate: Date,

  // Control
  isControlled:  { type: Boolean, default: false },
  requiresPrescription: { type: Boolean, default: true },
  isActive:      { type: Boolean, default: true }
}, { timestamps: true });

MedicineSchema.virtual('isLowStock').get(function () {
  return this.quantity <= this.minStockLevel;
});
MedicineSchema.virtual('isExpiringSoon').get(function () {
  if (!this.expiryDate) return false;
  const daysLeft = (this.expiryDate - Date.now()) / (1000 * 60 * 60 * 24);
  return daysLeft <= 90;
});
MedicineSchema.set('toJSON', { virtuals: true });
MedicineSchema.index({ name: 'text', genericName: 'text', brand: 'text' });

module.exports = mongoose.model('Medicine', MedicineSchema);

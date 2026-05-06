// routes/pharmacy.js
const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Medicine = require('../models/Medicine');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', asyncHandler(async (req, res) => {
  let query = { isActive: true };
  if (req.query.search) {
    query.$text = { $search: req.query.search };
  }
  if (req.query.category) query.category = req.query.category;
  if (req.query.lowStock === 'true') query.$expr = { $lte: ['$quantity', '$minStockLevel'] };
  if (req.query.expiringSoon === 'true') {
    const future90 = new Date(); future90.setDate(future90.getDate() + 90);
    query.expiryDate = { $lte: future90, $gte: new Date() };
  }
  const medicines = await Medicine.find(query).sort({ name: 1 });
  res.json({ success: true, count: medicines.length, data: medicines });
}));

router.post('/', authorize('admin','pharmacist'), asyncHandler(async (req, res) => {
  const medicine = await Medicine.create(req.body);
  res.status(201).json({ success: true, data: medicine });
}));

router.put('/:id', authorize('admin','pharmacist'), asyncHandler(async (req, res) => {
  const medicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!medicine) { res.status(404); throw new Error('Medicine not found'); }
  res.json({ success: true, data: medicine });
}));

// Adjust stock
router.patch('/:id/stock', authorize('admin','pharmacist'), asyncHandler(async (req, res) => {
  const { adjustment, reason } = req.body;
  const medicine = await Medicine.findById(req.params.id);
  if (!medicine) { res.status(404); throw new Error('Medicine not found'); }
  medicine.quantity = Math.max(0, medicine.quantity + parseInt(adjustment));
  await medicine.save();
  res.json({ success: true, data: medicine });
}));

// Hard delete (admin only). Use this to permanently remove a medicine from
// inventory. Pharmacists should use update with `isActive: false` to deactivate.
router.delete('/:id', authorize('admin'), asyncHandler(async (req, res) => {
  const { logAction } = require('../utils/auditLog');
  const med = await Medicine.findByIdAndDelete(req.params.id);
  if (!med) { res.status(404); throw new Error('Medicine not found'); }
  await logAction(req, { action: 'delete', entity: 'Medicine', entityId: med._id, summary: `Deleted medicine ${med.name}`, snapshot: med });
  res.json({ success: true, message: 'Medicine permanently deleted' });
}));

module.exports = router;

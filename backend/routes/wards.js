const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Ward = require('../models/Ward');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', asyncHandler(async (req, res) => {
  const wards = await Ward.find({ isActive: true })
    .populate('headNurse', 'name')
    .populate({ path: 'beds.patient', select: 'firstName lastName patientId' });
  res.json({ success: true, count: wards.length, data: wards });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const ward = await Ward.findById(req.params.id)
    .populate('headNurse', 'name phone')
    .populate({ path: 'beds.patient', select: 'firstName lastName patientId admittedAt' })
    .populate('assignedDoctors', 'doctorId specialization');
  if (!ward) { res.status(404); throw new Error('Ward not found'); }
  res.json({ success: true, data: ward });
}));

router.post('/', authorize('admin'), asyncHandler(async (req, res) => {
  if (req.body.totalBeds && !req.body.beds) {
    req.body.beds = Array.from({ length: req.body.totalBeds }, (_, i) => ({
      bedNumber: `${req.body.wardNumber || 'W'}-${String(i + 1).padStart(2, '0')}`,
      type: req.body.type === 'icu' ? 'icu' : 'general',
      status: 'available'
    }));
  }
  const ward = await Ward.create(req.body);
  res.status(201).json({ success: true, data: ward });
}));

router.put('/:id', authorize('admin','nurse'), asyncHandler(async (req, res) => {
  const ward = await Ward.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, data: ward });
}));

// Hard-delete a ward (admin only). Refuses if any beds are occupied.
router.delete('/:id', authorize('admin'), asyncHandler(async (req, res) => {
  const Patient = require('../models/Patient');
  const { logAction } = require('../utils/auditLog');
  const ward = await Ward.findById(req.params.id);
  if (!ward) { res.status(404); throw new Error('Ward not found'); }
  const occupied = ward.beds.filter(b => b.status === 'occupied').length;
  if (occupied > 0) {
    res.status(409);
    throw new Error(`Cannot delete: ${occupied} bed(s) are occupied. Discharge patients first.`);
  }
  const snapshot = ward.toObject();
  await Patient.updateMany({ ward: ward._id }, { $unset: { ward: 1, bed: 1 } });
  await ward.deleteOne();
  await logAction(req, { action: 'delete', entity: 'Ward', entityId: ward._id, summary: `Deleted ward ${ward.name}`, snapshot });
  res.json({ success: true, message: 'Ward permanently deleted' });
}));

// Bed status changes are clinical events — restrict to admin/nurse/doctor.
router.patch('/:id/beds/:bedId', authorize('admin','nurse','doctor'), asyncHandler(async (req, res) => {
  const ward = await Ward.findById(req.params.id);
  if (!ward) { res.status(404); throw new Error('Ward not found'); }
  const bed = ward.beds.id(req.params.bedId);
  if (!bed) { res.status(404); throw new Error('Bed not found'); }
  Object.assign(bed, req.body);
  await ward.save();
  res.json({ success: true, data: bed });
}));

module.exports = router;

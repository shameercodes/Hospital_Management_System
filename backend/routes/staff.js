const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/', asyncHandler(async (req, res) => {
  let query = {};
  if (req.query.role) query.role = req.query.role;
  if (req.query.department) query.department = req.query.department;
  if (req.query.active) query.isActive = req.query.active === 'true';
  const staff = await User.find(query).sort({ name: 1 });
  res.json({ success: true, count: staff.length, data: staff });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('Staff not found'); }
  res.json({ success: true, data: user });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const { password, ...updateData } = req.body; // prevent pw change here
  const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
  if (!user) { res.status(404); throw new Error('Staff not found'); }
  res.json({ success: true, data: user });
}));

router.patch('/:id/toggle', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('Staff not found'); }
  user.isActive = !user.isActive;
  await user.save({ validateBeforeSave: false });
  res.json({ success: true, data: user });
}));

// Hard delete (admin only). Refuses self-deletion. If the staff member is a
// linked Doctor, also remove their Doctor profile.
router.delete('/:id', asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user.id)) {
    res.status(400);
    throw new Error('You cannot delete your own account');
  }
  const Doctor = require('../models/Doctor');
  const { logAction } = require('../utils/auditLog');
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('Staff not found'); }
  const snapshot = user.toObject();
  let cascade;
  if (user.role === 'doctor') {
    const r = await Doctor.deleteMany({ user: user._id });
    cascade = { doctorProfiles: r.deletedCount };
  }
  await user.deleteOne();
  await logAction(req, {
    action: cascade ? 'cascade_delete' : 'delete',
    entity: 'User', entityId: user._id,
    summary: `Deleted staff account ${user.email} (${user.role})`,
    snapshot, cascade,
  });
  res.json({ success: true, message: 'Staff account permanently deleted' });
}));

module.exports = router;

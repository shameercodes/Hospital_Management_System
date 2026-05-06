const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', asyncHandler(async (req, res) => {
  let query = {};
  if (req.query.specialization) query.specialization = { $regex: req.query.specialization, $options: 'i' };
  if (req.query.department)     query.department = req.query.department;
  if (req.query.available)      query.isAvailable = req.query.available === 'true';
  const doctors = await Doctor.find(query)
    .populate('user', 'name email phone avatar isActive')
    .sort({ createdAt: -1 });
  res.json({ success: true, count: doctors.length, data: doctors });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id)
    .populate('user', 'name email phone avatar department');
  if (!doctor) { res.status(404); throw new Error('Doctor not found'); }
  res.json({ success: true, data: doctor });
}));

router.post('/', authorize('admin'), asyncHandler(async (req, res) => {
  const { name, email, password, phone, department, ...doctorData } = req.body;
  const user = await User.create({ name, email, password, phone, role: 'doctor', department });
  doctorData.user = user._id;
  const doctor = await Doctor.create(doctorData);
  res.status(201).json({ success: true, data: { doctor, user } });
}));

// Permanently delete a doctor + their User record (admin only).
// Future appointments/labs that reference this doctor will keep the (now dangling)
// id; restrict deletion to retired/erroneous accounts. Refuses if doctor has
// upcoming non-cancelled appointments.
router.delete('/:id', authorize('admin'), asyncHandler(async (req, res) => {
  const Appointment = require('../models/Appointment');
  const Patient = require('../models/Patient');
  const { logAction } = require('../utils/auditLog');
  const doctor = await Doctor.findById(req.params.id).populate('user', 'name email');
  if (!doctor) { res.status(404); throw new Error('Doctor not found'); }

  const upcoming = await Appointment.countDocuments({
    doctor: doctor._id,
    date: { $gte: new Date() },
    status: { $in: ['scheduled','confirmed','in-progress'] }
  });
  if (upcoming > 0) {
    res.status(409);
    throw new Error(`Cannot delete: ${upcoming} upcoming appointment(s). Cancel or reassign them first.`);
  }

  const snapshot = doctor.toObject();
  await Patient.updateMany({ assignedDoctor: doctor._id }, { $unset: { assignedDoctor: 1 } });
  const userId = doctor.user?._id || doctor.user;
  await doctor.deleteOne();
  if (userId) await User.findByIdAndDelete(userId);

  await logAction(req, {
    action: 'cascade_delete', entity: 'Doctor', entityId: doctor._id,
    summary: `Hard-deleted doctor ${doctor.doctorId} (${snapshot.user?.name || ''})`,
    snapshot,
  });

  res.json({ success: true, message: 'Doctor permanently deleted' });
}));

// Admins may edit any doctor; doctors may only edit their own profile.
// Without this check, any logged-in doctor could overwrite any other doctor (IDOR).
router.put('/:id', authorize('admin','doctor'), asyncHandler(async (req, res) => {
  if (req.user.role === 'doctor') {
    const target = await Doctor.findById(req.params.id).select('user');
    if (!target) { res.status(404); throw new Error('Doctor not found'); }
    if (String(target.user) !== String(req.user._id)) {
      res.status(403);
      throw new Error('Doctors may only edit their own profile');
    }
    // Doctors should not be able to change their own license, fees, or specialization unilaterally.
    delete req.body.licenseNumber;
    delete req.body.consultationFee;
    delete req.body.specialization;
    delete req.body.department;
    delete req.body.user;
  }
  const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    .populate('user', 'name email phone');
  if (!doctor) { res.status(404); throw new Error('Doctor not found'); }
  res.json({ success: true, data: doctor });
}));

module.exports = router;

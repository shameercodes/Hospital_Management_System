const asyncHandler = require('express-async-handler');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');

// @route GET /api/appointments
exports.getAppointments = asyncHandler(async (req, res) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip  = (page - 1) * limit;

  let query = {};
  if (req.query.status)  query.status  = req.query.status;
  if (req.query.patient) query.patient = req.query.patient;
  if (req.query.doctor)  query.doctor  = req.query.doctor;
  if (req.query.date) {
    const d = new Date(req.query.date);
    query.date = { $gte: d, $lt: new Date(d.getTime() + 86400000) };
  }
  if (req.query.from && req.query.to) {
    query.date = { $gte: new Date(req.query.from), $lte: new Date(req.query.to) };
  }

  const total = await Appointment.countDocuments(query);
  const appointments = await Appointment.find(query)
    .populate('patient', 'patientId firstName lastName phone dateOfBirth gender')
    .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } })
    .sort({ date: -1 })
    .skip(skip).limit(limit);

  res.json({ success: true, count: appointments.length, total, pages: Math.ceil(total / limit), data: appointments });
});

// @route GET /api/appointments/:id
exports.getAppointment = asyncHandler(async (req, res) => {
  const appt = await Appointment.findById(req.params.id)
    .populate('patient')
    .populate({ path: 'doctor', populate: { path: 'user', select: 'name email phone' } })
    .populate('labTests');
  if (!appt) { res.status(404); throw new Error('Appointment not found'); }
  res.json({ success: true, data: appt });
});

// @route POST /api/appointments
exports.createAppointment = asyncHandler(async (req, res) => {
  const mongoose = require('mongoose');

  // Friendly validation up-front so the client sees clean messages instead of
  // a raw Mongoose "Cast to ObjectId failed for value ''" BSON error.
  const required = ['patient', 'doctor', 'date', 'timeSlot'];
  const missing = required.filter(f => !req.body[f]);
  if (missing.length) {
    res.status(400);
    throw new Error(`Missing required field(s): ${missing.join(', ')}`);
  }
  if (!mongoose.isValidObjectId(req.body.patient)) {
    res.status(400);
    throw new Error('Invalid patient — please pick a patient from the search results.');
  }
  if (!mongoose.isValidObjectId(req.body.doctor)) {
    res.status(400);
    throw new Error('Invalid doctor — please select a doctor from the list.');
  }

  req.body.bookedBy = req.user.id;
  if (!req.body.fee) {
    const doctor = await Doctor.findById(req.body.doctor);
    if (doctor) req.body.fee = doctor.consultationFee;
  }
  const appt = await Appointment.create(req.body);
  res.status(201).json({ success: true, data: appt });
});

// @route PUT /api/appointments/:id
exports.updateAppointment = asyncHandler(async (req, res) => {
  const appt = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    .populate('patient', 'patientId firstName lastName')
    .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } });
  if (!appt) { res.status(404); throw new Error('Appointment not found'); }
  res.json({ success: true, data: appt });
});

// @route POST /api/appointments/:id/cancel
exports.cancelAppointment = asyncHandler(async (req, res) => {
  const appt = await Appointment.findByIdAndUpdate(req.params.id,
    { status: 'cancelled', cancelReason: req.body.reason },
    { new: true }
  );
  if (!appt) { res.status(404); throw new Error('Appointment not found'); }
  res.json({ success: true, data: appt });
});

// @route DELETE /api/appointments/:id  (admin only — permanent)
// Also detaches any LabTest references and clears the appointment ref on linked Invoice.
exports.deleteAppointment = asyncHandler(async (req, res) => {
  const LabTest = require('../models/LabTest');
  const Invoice = require('../models/Invoice');
  const { logAction } = require('../utils/auditLog');
  const appt = await Appointment.findById(req.params.id);
  if (!appt) { res.status(404); throw new Error('Appointment not found'); }
  const snapshot = appt.toObject();
  await Promise.all([
    LabTest.updateMany({ appointment: appt._id }, { $unset: { appointment: 1 } }),
    Invoice.updateMany({ appointment: appt._id }, { $unset: { appointment: 1 } }),
  ]);
  await appt.deleteOne();
  await logAction(req, {
    action: 'delete', entity: 'Appointment', entityId: appt._id,
    summary: `Hard-deleted appointment ${appt.appointmentId}`, snapshot,
  });
  res.json({ success: true, message: 'Appointment permanently deleted' });
});

// @route GET /api/appointments/slots/:doctorId/:date
exports.getAvailableSlots = asyncHandler(async (req, res) => {
  const { doctorId, date } = req.params;
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) { res.status(404); throw new Error('Doctor not found'); }

  // 'lowercase' isn't a valid Intl option. Use 'long' (e.g. "Monday") then lowercase.
  const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const daySchedule = doctor.schedule.find(s => s.day === dayName && s.isAvailable);

  if (!daySchedule) return res.json({ success: true, data: [] });

  // Generate 30-min slots
  const slots = [];
  const [sh, sm] = daySchedule.startTime.split(':').map(Number);
  const [eh, em] = daySchedule.endTime.split(':').map(Number);
  let current = sh * 60 + sm;
  const end = eh * 60 + em;

  while (current + 30 <= end) {
    const h = Math.floor(current / 60), m = current % 60;
    slots.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
    current += 30;
  }

  // Remove booked slots
  const startOfDay = new Date(date); startOfDay.setHours(0,0,0,0);
  const endOfDay   = new Date(date); endOfDay.setHours(23,59,59,999);
  const booked = await Appointment.find({
    doctor: doctorId,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['scheduled','confirmed','in-progress'] }
  }).select('timeSlot');

  const bookedSlots = booked.map(a => a.timeSlot);
  const available = slots.filter(s => !bookedSlots.includes(s));

  res.json({ success: true, data: available });
});

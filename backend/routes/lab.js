const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const LabTest = require('../models/LabTest');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

const LAB_READERS = ['admin','doctor','lab_technician','nurse','receptionist'];

router.get('/', authorize(...LAB_READERS), asyncHandler(async (req, res) => {
  let query = {};
  if (req.query.status)  query.status = req.query.status;
  if (req.query.patient) query.patient = req.query.patient;
  if (req.query.urgency) query.urgency = req.query.urgency;
  const tests = await LabTest.find(query)
    .populate('patient', 'patientId firstName lastName')
    .populate({ path: 'orderedBy', populate: { path: 'user', select: 'name' } })
    .sort({ createdAt: -1 });
  res.json({ success: true, count: tests.length, data: tests });
}));

// Only doctors (orderers) and admins/lab techs (clinical workflow) can create orders.
router.post('/', authorize('admin','doctor','lab_technician','nurse','receptionist'), asyncHandler(async (req, res) => {
  const test = await LabTest.create(req.body);
  res.status(201).json({ success: true, data: test });
}));

router.put('/:id', authorize('admin','lab_technician','doctor'), asyncHandler(async (req, res) => {
  const test = await LabTest.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!test) { res.status(404); throw new Error('Lab test not found'); }
  res.json({ success: true, data: test });
}));

router.post('/:id/results', authorize('admin','lab_technician'), asyncHandler(async (req, res) => {
  const test = await LabTest.findByIdAndUpdate(req.params.id, {
    results: req.body.results,
    resultNotes: req.body.notes,
    status: 'completed',
    completedAt: new Date(),
    verifiedBy: req.user.id
  }, { new: true });
  res.json({ success: true, data: test });
}));

// Hard delete (admin only).
router.delete('/:id', authorize('admin'), asyncHandler(async (req, res) => {
  const Appointment = require('../models/Appointment');
  const { logAction } = require('../utils/auditLog');
  const test = await LabTest.findByIdAndDelete(req.params.id);
  if (!test) { res.status(404); throw new Error('Lab test not found'); }
  await Appointment.updateMany({ labTests: test._id }, { $pull: { labTests: test._id } });
  await logAction(req, { action: 'delete', entity: 'LabTest', entityId: test._id, summary: `Deleted lab test ${test.testId} (${test.testName})`, snapshot: test });
  res.json({ success: true, message: 'Lab test permanently deleted' });
}));

module.exports = router;

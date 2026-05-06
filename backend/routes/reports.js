// routes/reports.js
const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Invoice = require('../models/Invoice');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin','accountant'));

// Revenue report
router.get('/revenue', asyncHandler(async (req, res) => {
  const { from, to, groupBy = 'month' } = req.query;
  const match = {};
  if (from && to) match.createdAt = { $gte: new Date(from), $lte: new Date(to) };

  const groupExpr = groupBy === 'day'
    ? { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } }
    : { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } };

  const data = await Invoice.aggregate([
    { $match: match },
    { $group: { _id: groupExpr, revenue: { $sum: '$amountPaid' }, invoices: { $sum: 1 }, pending: { $sum: '$balance' } } },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);
  res.json({ success: true, data });
}));

// Patient demographics
router.get('/patients', asyncHandler(async (req, res) => {
  const [byGender, byBloodGroup, byStatus, byMonth] = await Promise.all([
    Patient.aggregate([{ $group: { _id: '$gender', count: { $sum: 1 } } }]),
    Patient.aggregate([{ $match: { bloodGroup: { $exists: true } } }, { $group: { _id: '$bloodGroup', count: { $sum: 1 } } }]),
    Patient.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Patient.aggregate([
      { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.y': 1, '_id.m': 1 } }, { $limit: 12 }
    ])
  ]);
  res.json({ success: true, data: { byGender, byBloodGroup, byStatus, byMonth } });
}));

// Appointment analytics
router.get('/appointments', asyncHandler(async (req, res) => {
  const [byStatus, byType, byDoctor] = await Promise.all([
    Appointment.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Appointment.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]),
    Appointment.aggregate([
      { $group: { _id: '$doctor', count: { $sum: 1 } } },
      { $lookup: { from: 'doctors', localField: '_id', foreignField: '_id', as: 'doctor' } },
      { $unwind: '$doctor' },
      { $lookup: { from: 'users', localField: 'doctor.user', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { doctorName: '$user.name', specialization: '$doctor.specialization', count: 1 } },
      { $sort: { count: -1 } }, { $limit: 10 }
    ])
  ]);
  res.json({ success: true, data: { byStatus, byType, byDoctor } });
}));

module.exports = router;

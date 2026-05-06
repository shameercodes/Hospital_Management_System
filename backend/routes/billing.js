const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Invoice = require('../models/Invoice');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

const BILLING_READERS = ['admin','accountant','receptionist','doctor'];

router.get('/', authorize(...BILLING_READERS), asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  let query = {};
  if (req.query.patient) query.patient = req.query.patient;
  if (req.query.status)  query.paymentStatus = req.query.status;
  if (req.query.from && req.query.to) {
    query.createdAt = { $gte: new Date(req.query.from), $lte: new Date(req.query.to) };
  }
  const total = await Invoice.countDocuments(query);
  const invoices = await Invoice.find(query)
    .populate('patient', 'patientId firstName lastName phone')
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit).limit(limit);
  res.json({ success: true, count: invoices.length, total, pages: Math.ceil(total / limit), data: invoices });
}));

router.get('/:id', authorize(...BILLING_READERS), asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id)
    .populate('patient', 'patientId firstName lastName phone address bloodGroup insurance')
    .populate('appointment')
    .populate('createdBy', 'name');
  if (!invoice) { res.status(404); throw new Error('Invoice not found'); }
  res.json({ success: true, data: invoice });
}));

router.post('/', authorize('admin','accountant','receptionist'), asyncHandler(async (req, res) => {
  req.body.createdBy = req.user.id;
  let subtotal = 0, discountTotal = 0, taxTotal = 0;
  req.body.lineItems = req.body.lineItems?.map(item => {
    item.total = (item.quantity * item.unitPrice) * (1 - (item.discount || 0) / 100) * (1 + (item.tax || 0) / 100);
    subtotal += item.quantity * item.unitPrice;
    discountTotal += item.quantity * item.unitPrice * ((item.discount || 0) / 100);
    taxTotal += item.quantity * item.unitPrice * ((item.tax || 0) / 100);
    return item;
  });
  req.body.subtotal = subtotal;
  req.body.discountTotal = discountTotal;
  req.body.taxTotal = taxTotal;
  req.body.grandTotal = subtotal - discountTotal + taxTotal;
  const invoice = await Invoice.create(req.body);
  res.status(201).json({ success: true, data: invoice });
}));

router.post('/:id/payment', authorize('admin','accountant','receptionist'), asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) { res.status(404); throw new Error('Invoice not found'); }
  invoice.payments.push({ ...req.body, receivedBy: req.user.id });
  await invoice.save();
  res.json({ success: true, data: invoice });
}));

router.put('/:id', authorize('admin','accountant'), asyncHandler(async (req, res) => {
  const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, data: invoice });
}));

// Hard delete (admin only). Detaches the appointment back-reference.
router.delete('/:id', authorize('admin'), asyncHandler(async (req, res) => {
  const Appointment = require('../models/Appointment');
  const { logAction } = require('../utils/auditLog');
  const invoice = await Invoice.findByIdAndDelete(req.params.id);
  if (!invoice) { res.status(404); throw new Error('Invoice not found'); }
  await Appointment.updateMany({ invoice: invoice._id }, { $unset: { invoice: 1 } });
  await logAction(req, { action: 'delete', entity: 'Invoice', entityId: invoice._id, summary: `Deleted invoice ${invoice.invoiceNumber}`, snapshot: invoice });
  res.json({ success: true, message: 'Invoice permanently deleted' });
}));

module.exports = router;

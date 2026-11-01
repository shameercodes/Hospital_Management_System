const asyncHandler = require('express-async-handler');
const Patient = require('../models/Patient');

// @route GET /api/patients
exports.getPatients = asyncHandler(async (req, res) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip  = (page - 1) * limit;

  let query = { isActive: true };

  if (req.query.search) {
    const s = req.query.search;
    query.$or = [
      { firstName: { $regex: s, $options: 'i' } },
      { lastName:  { $regex: s, $options: 'i' } },
      { patientId: { $regex: s, $options: 'i' } },
      { phone:     { $regex: s, $options: 'i' } }
    ];
  }
  if (req.query.status)  query.status = req.query.status;
  if (req.query.bloodGroup) query.bloodGroup = req.query.bloodGroup;
  if (req.query.doctor)  query.assignedDoctor = req.query.doctor;

  const total = await Patient.countDocuments(query);
  const patients = await Patient.find(query)
    .populate('assignedDoctor', 'doctorId specialization')
    .populate({ path: 'assignedDoctor', populate: { path: 'user', select: 'name' } })
    .populate('ward', 'name wardNumber')
    .sort({ createdAt: -1 })
    .skip(skip).limit(limit);

  res.json({
    success: true,
    count: patients.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
    data: patients
  });
});

// @route GET /api/patients/:id
exports.getPatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id)
    .populate({ path: 'assignedDoctor', populate: { path: 'user', select: 'name email phone' } })
    .populate('ward', 'name wardNumber type floor');
  if (!patient) { res.status(404); throw new Error('Patient not found'); }
  res.json({ success: true, data: patient });
});

function sanitizePatientBody(body) {
  const data = { ...body };
  delete data._id;
  delete data.__v;
  delete data.patientId;
  delete data.createdAt;
  delete data.updatedAt;
  delete data.age;
  delete data.fullName;
  if (!data.bloodGroup) data.bloodGroup = 'unknown';
  if (!data.email) delete data.email;
  if (data.emergencyContact && !data.emergencyContact.relationship) {
    delete data.emergencyContact.relationship;
  }
  return data;
}

// @route POST /api/patients
exports.createPatient = asyncHandler(async (req, res) => {
  const data = sanitizePatientBody(req.body);
  data.registeredBy = req.user.id;
  const patient = await Patient.create(data);
  res.status(201).json({ success: true, data: patient });
});

// @route PUT /api/patients/:id
exports.updatePatient = asyncHandler(async (req, res) => {
  let patient = await Patient.findById(req.params.id);
  if (!patient) { res.status(404); throw new Error('Patient not found'); }
  const data = sanitizePatientBody(req.body);
  delete data.registeredBy;
  patient = await Patient.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
  res.json({ success: true, data: patient });
});

// @route DELETE /api/patients/:id  (admin only — hard delete with cascade)
// Removes the patient record and all dependent records (appointments, lab tests,
// invoices). Frees any ward bed they occupy. This is irreversible.
//
// Safety: the client must echo the patient's full name in the request body as
// `confirmName` (or send `confirmName: 'DELETE'`). This stops accidental
// fat-finger deletions — a misclick on the wrong row will fail the check.
// Every successful deletion is recorded in the AuditLog collection.
exports.deletePatient = asyncHandler(async (req, res) => {
  const Appointment = require('../models/Appointment');
  const LabTest = require('../models/LabTest');
  const Invoice = require('../models/Invoice');
  const Ward = require('../models/Ward');
  const { logAction } = require('../utils/auditLog');

  const patient = await Patient.findById(req.params.id);
  if (!patient) { res.status(404); throw new Error('Patient not found'); }

  const expected = `${patient.firstName} ${patient.lastName}`.trim().toLowerCase();
  const provided = String(req.body?.confirmName || '').trim().toLowerCase();
  if (provided !== expected && provided !== 'delete') {
    res.status(400);
    throw new Error(`Confirmation failed. Type the patient's full name ("${patient.firstName} ${patient.lastName}") or "DELETE" to confirm.`);
  }

  const snapshot = patient.toObject();

  if (patient.ward) {
    const ward = await Ward.findById(patient.ward);
    if (ward) {
      let dirty = false;
      ward.beds.forEach(b => {
        if (b.patient && String(b.patient) === String(patient._id)) {
          b.patient = undefined;
          b.admittedAt = undefined;
          b.status = 'available';
          dirty = true;
        }
      });
      if (dirty) await ward.save();
    }
  }

  const [appts, labs, invs] = await Promise.all([
    Appointment.deleteMany({ patient: patient._id }),
    LabTest.deleteMany({ patient: patient._id }),
    Invoice.deleteMany({ patient: patient._id }),
  ]);
  await patient.deleteOne();

  const cascade = { appointments: appts.deletedCount, labTests: labs.deletedCount, invoices: invs.deletedCount };
  await logAction(req, {
    action: 'cascade_delete',
    entity: 'Patient',
    entityId: patient._id,
    summary: `Hard-deleted patient ${patient.patientId} (${snapshot.firstName} ${snapshot.lastName})`,
    snapshot,
    cascade,
  });

  res.json({ success: true, message: 'Patient permanently deleted', cascade });
});

// @route POST /api/patients/:id/vitals
exports.addVitals = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) { res.status(404); throw new Error('Patient not found'); }
  req.body.recordedBy = req.user.id;
  // Calculate BMI
  if (req.body.weight && req.body.height) {
    const h = req.body.height / 100;
    req.body.bmi = +(req.body.weight / (h * h)).toFixed(1);
  }
  patient.vitalSigns.push(req.body);
  await patient.save();
  res.status(201).json({ success: true, data: patient.vitalSigns.slice(-1)[0] });
});

// @route PUT /api/patients/:id/admit
exports.admitPatient = asyncHandler(async (req, res) => {
  const { wardId, bed } = req.body;
  const patient = await Patient.findByIdAndUpdate(req.params.id, {
    status: 'inpatient', ward: wardId, bed, admittedAt: new Date()
  }, { new: true });
  res.json({ success: true, data: patient });
});

// @route PUT /api/patients/:id/discharge
exports.dischargePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findByIdAndUpdate(req.params.id, {
    status: 'discharged', dischargedAt: new Date(), ward: null, bed: null
  }, { new: true });
  res.json({ success: true, data: patient });
});

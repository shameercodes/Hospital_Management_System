const express = require('express');
const router = express.Router();
const {
  getPatients, getPatient, createPatient, updatePatient, deletePatient,
  addVitals, admitPatient, dischargePatient
} = require('../controllers/patientController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Anyone with a clinical/operational reason can read patient lists.
// Pharmacists and lab techs see patients via their own modules; we
// keep them out of generic patient listing to minimize PHI exposure.
const PATIENT_READERS = ['admin','doctor','nurse','receptionist','accountant'];
const PATIENT_WRITERS = ['admin','doctor','nurse','receptionist'];

router.route('/')
  .get(authorize(...PATIENT_READERS), getPatients)
  .post(authorize(...PATIENT_WRITERS), createPatient);

router.route('/:id')
  .get(authorize(...PATIENT_READERS), getPatient)
  .put(authorize(...PATIENT_WRITERS), updatePatient)
  .delete(authorize('admin'), deletePatient);

router.post('/:id/vitals',   authorize('admin','nurse','doctor'), addVitals);
router.put('/:id/admit',     authorize('admin','receptionist','nurse','doctor'), admitPatient);
router.put('/:id/discharge', authorize('admin','doctor'), dischargePatient);

module.exports = router;

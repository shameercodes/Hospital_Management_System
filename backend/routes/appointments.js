const express = require('express');
const router = express.Router();
const {
  getAppointments, getAppointment, createAppointment,
  updateAppointment, cancelAppointment, getAvailableSlots
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

const APPT_READERS = ['admin','doctor','nurse','receptionist','accountant'];
const APPT_WRITERS = ['admin','doctor','nurse','receptionist'];

router.route('/')
  .get(authorize(...APPT_READERS), getAppointments)
  .post(authorize(...APPT_WRITERS), createAppointment);

router.route('/:id')
  .get(authorize(...APPT_READERS), getAppointment)
  .put(authorize(...APPT_WRITERS), updateAppointment)
  // DELETE = permanent removal from DB (admin only). To cancel, use PUT with status: 'cancelled'.
  .delete(authorize('admin'), require('../controllers/appointmentController').deleteAppointment);

router.post('/:id/cancel', authorize(...APPT_WRITERS), cancelAppointment);

router.get('/slots/:doctorId/:date', authorize(...APPT_READERS), getAvailableSlots);

module.exports = router;

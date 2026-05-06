const asyncHandler = require('express-async-handler');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Invoice = require('../models/Invoice');
const Doctor = require('../models/Doctor');
const Ward = require('../models/Ward');
const Medicine = require('../models/Medicine');
const LabTest = require('../models/LabTest');

exports.getDashboard = asyncHandler(async (req, res) => {
  const today = new Date(); today.setHours(0,0,0,0);
  const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonth = new Date(today.getFullYear(), today.getMonth()-1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

  const [
    totalPatients, newPatientsToday, inpatients,
    todayAppointments, pendingAppointments,
    totalDoctors, availableDoctors,
    thisMonthRevenue, lastMonthRevenue,
    pendingInvoices, overdueInvoices,
    lowStockMeds, expiredMeds,
    pendingLabTests, wardStats,
    recentAppointments, appointmentsByStatus,
    revenueByMonth
  ] = await Promise.all([
    Patient.countDocuments({ isActive: true }),
    Patient.countDocuments({ createdAt: { $gte: today } }),
    Patient.countDocuments({ status: 'inpatient' }),

    Appointment.countDocuments({ date: { $gte: today, $lte: todayEnd } }),
    Appointment.countDocuments({ status: 'scheduled', date: { $gte: today } }),

    Doctor.countDocuments(),
    Doctor.countDocuments({ isAvailable: true }),

    Invoice.aggregate([
      { $match: { createdAt: { $gte: thisMonth }, paymentStatus: { $ne: 'refunded' } } },
      { $group: { _id: null, total: { $sum: '$amountPaid' } } }
    ]),
    Invoice.aggregate([
      { $match: { createdAt: { $gte: lastMonth, $lte: lastMonthEnd }, paymentStatus: { $ne: 'refunded' } } },
      { $group: { _id: null, total: { $sum: '$amountPaid' } } }
    ]),

    Invoice.countDocuments({ paymentStatus: { $in: ['unpaid','partial'] } }),
    Invoice.countDocuments({ paymentStatus: { $in: ['unpaid','partial'] }, dueDate: { $lt: new Date() } }),

    Medicine.countDocuments({ $expr: { $lte: ['$quantity', '$minStockLevel'] }, isActive: true }),
    Medicine.countDocuments({ expiryDate: { $lt: new Date() }, isActive: true }),

    LabTest.countDocuments({ status: { $in: ['ordered','sample-collected','processing'] } }),

    Ward.aggregate([
      { $project: { name: 1, type: 1, totalBeds: 1,
        occupied: { $size: { $filter: { input: '$beds', cond: { $eq: ['$$this.status', 'occupied'] } } } }
      }}
    ]),

    Appointment.find({ date: { $gte: today, $lte: todayEnd } })
      .populate('patient', 'firstName lastName patientId')
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } })
      .sort({ date: 1 })
      .limit(10),

    Appointment.aggregate([
      { $match: { createdAt: { $gte: thisMonth } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),

    Invoice.aggregate([
      { $match: { createdAt: { $gte: new Date(today.getFullYear(), today.getMonth()-5, 1) } } },
      { $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        revenue: { $sum: '$amountPaid' }, invoices: { $sum: 1 }
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ])
  ]);

  const thisRev  = thisMonthRevenue[0]?.total  || 0;
  const lastRev  = lastMonthRevenue[0]?.total  || 0;
  const revGrowth = lastRev ? (((thisRev - lastRev) / lastRev) * 100).toFixed(1) : 0;

  res.json({
    success: true,
    data: {
      stats: {
        patients: { total: totalPatients, newToday: newPatientsToday, inpatients },
        appointments: { today: todayAppointments, pending: pendingAppointments },
        doctors: { total: totalDoctors, available: availableDoctors },
        revenue: { thisMonth: thisRev, lastMonth: lastRev, growth: revGrowth },
        billing: { pending: pendingInvoices, overdue: overdueInvoices },
        pharmacy: { lowStock: lowStockMeds, expired: expiredMeds },
        lab: { pending: pendingLabTests },
        wards: wardStats
      },
      recentAppointments,
      appointmentsByStatus,
      revenueByMonth
    }
  });
});

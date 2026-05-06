const mongoose = require('mongoose');

// Append-only record of sensitive actions (deletes, role changes, PHI access).
// Never delete from this collection — it's the forensic record of who did what.
const AuditLogSchema = new mongoose.Schema({
  actor: {
    user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name:  String,
    email: String,
    role:  String,
  },
  action: {
    type: String,
    required: true,
    enum: ['delete', 'cascade_delete', 'login', 'role_change', 'permission_change', 'export', 'other'],
  },
  entity:   { type: String, required: true }, // 'Patient', 'Appointment', etc.
  entityId: { type: String, required: true },
  summary:  String,                            // Short human-readable summary
  snapshot: { type: mongoose.Schema.Types.Mixed }, // JSON snapshot before mutation
  cascade:  { type: mongoose.Schema.Types.Mixed }, // e.g. { appointments: 4, invoices: 2 }
  ip:       String,
  userAgent:String,
}, { timestamps: { createdAt: true, updatedAt: false } });

AuditLogSchema.index({ 'actor.user': 1, createdAt: -1 });
AuditLogSchema.index({ entity: 1, entityId: 1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);

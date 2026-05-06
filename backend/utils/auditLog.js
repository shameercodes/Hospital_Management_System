const AuditLog = require('../models/AuditLog');

// Fire-and-forget: never let logging failures break the main request.
// Truncate snapshot to keep log entries reasonably sized.
const safeSnapshot = (doc) => {
  if (!doc) return undefined;
  try {
    const obj = typeof doc.toObject === 'function' ? doc.toObject() : doc;
    const json = JSON.stringify(obj);
    if (json.length > 10000) return { _truncated: true, preview: json.slice(0, 10000) };
    return obj;
  } catch { return undefined; }
};

const logAction = async (req, { action, entity, entityId, summary, snapshot, cascade }) => {
  try {
    await AuditLog.create({
      actor: req.user ? {
        user:  req.user._id,
        name:  req.user.name,
        email: req.user.email,
        role:  req.user.role,
      } : undefined,
      action, entity,
      entityId: String(entityId),
      summary,
      snapshot: safeSnapshot(snapshot),
      cascade,
      ip: req.ip,
      userAgent: req.get?.('user-agent'),
    });
  } catch (err) {
    console.error(`[AUDIT] Failed to log ${action} ${entity} ${entityId}:`, err.message);
  }
};

module.exports = { logAction };

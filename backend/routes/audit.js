const express = require('express');
const asyncHandler = require('express-async-handler');
const { protect, authorize } = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');

const router = express.Router();
router.use(protect, authorize('admin'));

// @route GET /api/audit
// Read-only audit trail. Supports basic filtering and pagination.
// Audit logs are append-only; there is intentionally no delete endpoint.
router.get('/', asyncHandler(async (req, res) => {
  const { entity, action, actor, limit = 100, page = 1 } = req.query;
  const filter = {};
  if (entity) filter.entity = entity;
  if (action) filter.action = action;
  if (actor)  filter['actor.user'] = actor;

  const lim = Math.min(parseInt(limit, 10) || 100, 500);
  const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * lim;

  const [items, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim).lean(),
    AuditLog.countDocuments(filter),
  ]);

  res.json({ success: true, count: items.length, total, page: Number(page), data: items });
}));

module.exports = router;

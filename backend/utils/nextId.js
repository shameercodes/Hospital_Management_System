const mongoose = require('mongoose');

/**
 * Allocate the next unique sequential id (PAT-000123, APT-000010, …).
 * Uses the highest existing suffix rather than countDocuments(), so deletes
 * cannot collide with leftover unique indexes.
 */
async function nextId(modelName, field, prefix, pad = 6) {
  const Model = mongoose.model(modelName);
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const last = await Model.findOne({ [field]: new RegExp(`^${escaped}`) })
    .sort({ [field]: -1 })
    .select(field)
    .lean();

  let n = 1;
  if (last?.[field]) {
    const m = String(last[field]).match(/(\d+)$/);
    if (m) n = parseInt(m[1], 10) + 1;
  }

  for (let i = 0; i < 50; i++) {
    const id = `${prefix}${String(n + i).padStart(pad, '0')}`;
    const exists = await Model.exists({ [field]: id });
    if (!exists) return id;
  }
  return `${prefix}${Date.now()}`;
}

module.exports = { nextId };

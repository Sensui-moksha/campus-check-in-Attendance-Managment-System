const AuditLog = require('../models/AuditLog');

/**
 * Write audit log entry
 * @param {Object} params
 * @param {ObjectId} params.actorId - User who performed the action
 * @param {String} params.action - Action type (ATTENDANCE_MARK, BULK_IMPORT, etc.)
 * @param {String} params.targetCollection - Collection being modified
 * @param {ObjectId} params.targetId - Document ID (optional)
 * @param {Object} params.meta - Additional context (prev, new, records, filters, etc.)
 * @returns {Promise<Object>} Created audit log
 */
async function writeAudit({ actorId, action, targetCollection, targetId, meta = {} }) {
  try {
    const auditLog = await AuditLog.create({
      actor: actorId,
      action,
      targetCollection,
      targetId,
      meta,
    });
    return auditLog;
  } catch (error) {
    console.error('Audit log write error:', error);
    // Don't throw - audit failures shouldn't block operations
    return null;
  }
}

/**
 * Get last action(s) for a target
 * @param {String} targetCollection - Collection name
 * @param {ObjectId} targetId - Document ID
 * @param {String} action - Optional action filter
 * @param {Number} limit - Max results
 * @returns {Promise<Array>} Matching audit logs
 */
async function getLastActions(targetCollection, targetId, action = null, limit = 10) {
  const query = {
    targetCollection,
    targetId,
  };
  
  if (action) {
    query.action = action;
  }

  return AuditLog.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('actor', 'name email role');
}

/**
 * Get action history for a user
 * @param {ObjectId} actorId - User ID
 * @param {Number} limit - Max results
 * @returns {Promise<Array>} User's action history
 */
async function getUserActionHistory(actorId, limit = 50) {
  return AuditLog.find({ actor: actorId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('action targetCollection targetId meta createdAt');
}

/**
 * Get undo record for a grouped attendance action
 * Finds the last ATTENDANCE_BULK_MARK or ATTENDANCE_MARK for a session
 * @param {ObjectId} sessionId - Class session ID
 * @returns {Promise<Object|null>} Last attendance audit log or null
 */
async function getLastAttendanceAction(sessionId) {
  return AuditLog.findOne({
    action: { $in: ['ATTENDANCE_MARK', 'ATTENDANCE_BULK_MARK'] },
    'meta.sessionId': sessionId,
  })
    .sort({ createdAt: -1 })
    .select('meta');
}

module.exports = {
  writeAudit,
  getLastActions,
  getUserActionHistory,
  getLastAttendanceAction,
};

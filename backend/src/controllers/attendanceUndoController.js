const Attendance = require('../models/Attendance');
const AuditLog = require('../models/AuditLog');
const { writeAudit, getLastAttendanceAction } = require('../utils/audit');

/**
 * Attendance Undo Controller
 * Handles reverting attendance changes using audit logs
 */

/**
 * Undo last grouped attendance action for a session
 * POST /api/sessions/:sessionId/attendance/undo-last
 */
const undoLastSessionAttendance = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    // Find last attendance audit for this session
    const auditLog = await AuditLog.findOne({
      action: { $in: ['ATTENDANCE_MARK', 'ATTENDANCE_BULK_MARK'] },
      'meta.sessionId': sessionId,
    })
      .sort({ createdAt: -1 });

    if (!auditLog || !auditLog.meta.records) {
      return res.status(404).json({ error: 'No attendance action to undo for this session' });
    }

    // Revert each attendance record
    const reverted = [];
    const failed = [];

    for (const record of auditLog.meta.records) {
      try {
        if (record.prev) {
          // Restore previous state
          await Attendance.findByIdAndUpdate(record.attendanceId, {
            status: record.prev.status,
            markedAt: record.prev.markedAt,
            markedBy: record.prev.markedBy,
          });

          reverted.push({
            attendanceId: record.attendanceId,
            previousStatus: record.prev.status,
          });
        }
      } catch (err) {
        failed.push({
          attendanceId: record.attendanceId,
          error: err.message,
        });
      }
    }

    // Write undo audit
    await writeAudit({
      actorId: req.user.id,
      action: 'ATTENDANCE_UNDO',
      targetCollection: 'attendance',
      meta: {
        sessionId,
        undoCount: reverted.length,
        failedCount: failed.length,
        originalAuditId: auditLog._id,
        revertedRecords: reverted,
      },
    });

    res.json({
      success: true,
      message: `Reverted ${reverted.length} attendance records`,
      reverted,
      failed: failed.length > 0 ? failed : undefined,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Undo a specific attendance record
 * POST /api/attendance/:attendanceId/undo
 */
const undoAttendanceRecord = async (req, res, next) => {
  try {
    const { attendanceId } = req.params;

    // Get current attendance
    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    // Find the audit record that created this attendance
    const auditLog = await AuditLog.findOne({
      'meta.records': { $elemMatch: { attendanceId } },
    })
      .sort({ createdAt: -1 });

    if (!auditLog) {
      return res.status(404).json({ error: 'No audit history found for this record' });
    }

    // Find the specific record in the audit
    const recordInAudit = auditLog.meta.records.find(
      r => r.attendanceId === attendanceId
    );

    if (!recordInAudit || !recordInAudit.prev) {
      return res.status(400).json({ error: 'Cannot undo - no previous state recorded' });
    }

    // Get previous state
    const prevStatus = recordInAudit.prev.status;

    // Update attendance
    const updated = await Attendance.findByIdAndUpdate(
      attendanceId,
      { status: prevStatus },
      { new: true }
    )
      .populate('student', 'name rollNo')
      .populate('session');

    // Write undo audit
    await writeAudit({
      actorId: req.user.id,
      action: 'ATTENDANCE_UNDO',
      targetCollection: 'attendance',
      targetId: attendanceId,
      meta: {
        previousStatus: prevStatus,
        currentStatus: attendance.status,
        originalAuditId: auditLog._id,
      },
    });

    res.json({
      success: true,
      message: `Reverted attendance from ${attendance.status} to ${prevStatus}`,
      attendance: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get undo history for a session
 * GET /api/sessions/:sessionId/attendance/undo-history
 */
const getUndoHistory = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { limit = 20 } = req.query;

    // Get undo audit logs
    const undoLogs = await AuditLog.find({
      action: 'ATTENDANCE_UNDO',
      'meta.sessionId': sessionId,
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('actor', 'name email');

    res.json({
      total: undoLogs.length,
      undoHistory: undoLogs.map(log => ({
        id: log._id,
        actor: log.actor,
        undoCount: log.meta.undoCount,
        timestamp: log.createdAt,
        originalAuditId: log.meta.originalAuditId,
      })),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  undoLastSessionAttendance,
  undoAttendanceRecord,
  getUndoHistory,
};

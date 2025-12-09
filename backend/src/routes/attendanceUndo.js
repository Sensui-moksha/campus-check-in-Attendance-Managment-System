const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { schemas, handleValidationErrors } = require('../middleware/validate');
const { undoLastSessionAttendance, undoAttendanceRecord, getUndoHistory } = require('../controllers/attendanceUndoController');

/**
 * POST /api/sessions/:sessionId/undo-last
 * Undo last grouped attendance action
 * Auth: teacher|hod|admin|principal
 */
router.post(
  '/:sessionId/undo-last',
  auth,
  authorize(['teacher', 'hod', 'admin', 'principal']),
  schemas.attendanceUndo,
  handleValidationErrors,
  undoLastSessionAttendance
);

/**
 * GET /api/sessions/:sessionId/attendance/undo-history
 * Get undo history
 * Auth: teacher|hod|admin|principal
 */
router.get(
  '/:sessionId/undo-history',
  auth,
  authorize(['teacher', 'hod', 'admin', 'principal']),
  getUndoHistory
);

/**
 * POST /api/attendance/:attendanceId/undo
 * Undo specific attendance record
 * Auth: admin|principal|hod
 */
router.post(
  '/:attendanceId/undo',
  auth,
  authorize(['admin', 'principal', 'hod']),
  schemas.attendanceSingleUndo,
  handleValidationErrors,
  undoAttendanceRecord
);

module.exports = router;

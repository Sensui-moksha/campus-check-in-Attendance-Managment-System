const express = require('express');
const router = express.Router();
const studentAttendanceController = require('../controllers/studentAttendanceController');
const authenticate = require('../middleware/auth');

/**
 * Student Attendance Routes
 * Per-subject attendance summary and history
 */

// Get per-subject attendance summary for a student
router.get('/:id/attendance/summary', authenticate, studentAttendanceController.getAttendanceSummary);

// Get detailed attendance history with filters
router.get('/:id/attendance/history', authenticate, studentAttendanceController.getAttendanceHistory);

// Export attendance history as CSV
router.get('/:id/attendance/export', authenticate, studentAttendanceController.exportAttendanceHistory);

module.exports = router;

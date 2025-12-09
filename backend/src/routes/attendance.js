const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const attendanceController = require('../controllers/attendanceController');

const router = express.Router();

/**
 * POST /api/attendance/subject/mark
 * Mark attendance for a subject-section
 */
router.post('/subject/mark', auth, authorize(['teacher', 'hod', 'admin']), attendanceController.markSubjectAttendance);

/**
 * GET /api/attendance/subject
 * Get attendance for a subject-section by period
 * Query: subjectId, sectionId, departmentId, period (day/week/month), date
 */
router.get('/subject', auth, authorize(['teacher', 'hod', 'admin', 'principal']), attendanceController.getSubjectAttendance);

/**
 * POST /api/sessions/:sessionId/attendance
 * Bulk mark attendance
 */
router.post('/sessions/:sessionId/attendance', auth, authorize(['teacher', 'hod', 'admin']), attendanceController.bulkMarkAttendance);

/**
 * GET /api/courses/:courseId/attendance
 * Get attendance by period
 */
router.get('/courses/:courseId/attendance', auth, authorize(['teacher', 'hod', 'admin', 'principal']), attendanceController.getCourseAttendanceByPeriod);

/**
 * GET /api/students/:studentId/overview
 * Get student attendance overview (includes expected classes from subject config)
 */
router.get('/students/:studentId/overview', auth, authorize(['student', 'hod', 'admin', 'principal']), attendanceController.getStudentAttendanceOverview);

/**
 * GET /api/students/:studentId/conducted-overview
 * Get student attendance overview based only on conducted classes
 */
router.get('/students/:studentId/conducted-overview', auth, authorize(['student', 'hod', 'admin', 'principal']), attendanceController.getStudentAttendanceOverviewV2);

/**
 * GET /api/students/:studentId/history
 * Get student attendance history
 */
router.get('/students/:studentId/history', auth, authorize(['student', 'hod', 'admin', 'principal']), attendanceController.getStudentAttendanceHistory);

/**
 * GET /api/attendance/history
 * Attendance marking history across sessions
 */
router.get('/history', auth, authorize(['teacher', 'hod', 'admin', 'principal']), attendanceController.getAttendanceHistoryAll);

/**
 * GET /api/attendance/session/:sessionId
 * Get detailed attendance records for a session
 */
router.get('/session/:sessionId', auth, authorize(['teacher', 'hod', 'admin', 'principal']), attendanceController.getSessionDetails);

/**
 * PUT /api/attendance/session/:sessionId
 * Update attendance records for a session
 */
router.put('/session/:sessionId', auth, authorize(['teacher', 'hod', 'admin', 'principal']), attendanceController.updateSessionAttendance);

/**
 * POST /api/attendance/mark-v2
 * Mark attendance using new semester-based schema
 */
router.post('/mark-v2', auth, authorize(['teacher', 'hod', 'admin', 'principal']), attendanceController.markAttendanceV2);

/**
 * GET /api/attendance/by-class
 * Get attendance by class (department, year, section, subject, date)
 */
router.get('/by-class', auth, authorize(['teacher', 'hod', 'admin', 'principal']), attendanceController.getAttendanceByClass);

module.exports = router;

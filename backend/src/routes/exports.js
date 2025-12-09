const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { schemas, handleValidationErrors } = require('../middleware/validate');
const { exportCourseAttendance, exportCollegeAttendance, exportDepartmentAttendance } = require('../controllers/exportsController');

/**
 * GET /api/exports/course/:courseId?format=csv|xlsx|pdf&period=day|week|month&date=YYYY-MM-DD
 * Export course attendance
 * Auth: admin|principal|hod|teacher
 */
router.get(
  '/course/:courseId',
  auth,
  authorize(['admin', 'principal', 'hod', 'teacher']),
  schemas.courseAnalyticsQuery,
  handleValidationErrors,
  exportCourseAttendance
);

/**
 * GET /api/exports/college?format=csv|xlsx|pdf&from=YYYY-MM-DD&to=YYYY-MM-DD
 * Export college-wide attendance
 * Auth: admin|principal
 */
router.get(
  '/college',
  auth,
  authorize(['admin', 'principal']),
  exportCollegeAttendance
);

/**
 * GET /api/exports/department/:departmentId?format=csv|xlsx|pdf
 * Export department attendance
 * Auth: admin|principal|hod
 */
router.get(
  '/department/:departmentId',
  auth,
  authorize(['admin', 'principal', 'hod']),
  exportDepartmentAttendance
);

/**
 * GET /api/exports/section-wise/:departmentId/:year?format=csv|xlsx|pdf
 * Export section-wise attendance for all sections in a department and year
 * Auth: admin|principal|hod
 */
router.get(
  '/section-wise/:departmentId/:year',
  auth,
  authorize(['admin', 'principal', 'hod']),
  require('../controllers/exportsController').exportSectionWiseAttendance
);

module.exports = router;

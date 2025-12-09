const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { schemas, handleValidationErrors } = require('../middleware/validate');
const { getCourseSummary, getDepartmentSummary, getCollegeSummary, getDepartmentStudents } = require('../controllers/analyticsController');

/**
 * GET /api/analytics/courses/:courseId/summary?from=&to=&batchYear=&yearOfStudy=
 * Get course attendance summary with per-student stats and trends
 * Auth: admin|principal|hod|teacher
 */
router.get(
  '/courses/:courseId/summary',
  auth,
  authorize(['admin', 'principal', 'hod', 'teacher']),
  schemas.courseAnalyticsQuery,
  handleValidationErrors,
  getCourseSummary
);

/**
 * GET /api/analytics/departments/:departmentId/summary?from=&to=
 * Get department attendance summary
 * Auth: admin|principal|hod
 */
router.get(
  '/departments/:departmentId/summary',
  auth,
  authorize(['admin', 'principal', 'hod']),
  getDepartmentSummary
);

/**
 * GET /api/analytics/college/summary?from=&to=
 * Get college-wide attendance summary
 * Auth: admin|principal
 */
router.get(
  '/college/summary',
  auth,
  authorize(['admin', 'principal']),
  getCollegeSummary
);

/**
 * GET /api/analytics/departments/:departmentId/students
 * Get department students with accurate attendance for HOD Dashboard
 * Auth: admin|principal|hod
 */
router.get(
  '/departments/:departmentId/students',
  auth,
  authorize(['admin', 'principal', 'hod']),
  getDepartmentStudents
);

module.exports = router;

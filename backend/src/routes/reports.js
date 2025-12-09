const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const reportController = require('../controllers/reportController');

const router = express.Router();

/**
 * Department attendance report
 * GET /api/reports/department/:departmentId
 * Query: period (day|week|month), startDate, endDate (ISO strings)
 */
router.get(
  '/department/:departmentId',
  auth,
  authorize(['hod', 'admin', 'principal']),
  reportController.getDepartmentReport
);

/**
 * Course attendance report
 * GET /api/reports/course/:courseId
 * Query: period, startDate, endDate
 */
router.get(
  '/course/:courseId',
  auth,
  authorize(['teacher', 'hod', 'admin', 'principal']),
  reportController.getCourseReport
);

/**
 * College-wide attendance report
 * GET /api/reports/college
 * Query: period, startDate, endDate
 */
router.get('/college', auth, authorize(['admin', 'principal']), reportController.getCollegeReport);

module.exports = router;

const express = require('express');
const router = express.Router();
const detainController = require('../controllers/detainController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// All detention routes require authentication and admin/principal role

/**
 * POST /api/detain
 * Bulk detain students
 * Body: { userIds: [], reason: "", reasonType: "", detainDate: "", notes: "", performedBy: "", notify: false }
 */
router.post(
  '/',
  auth,
  authorize(['admin', 'principal', 'hod']),
  detainController.detainStudents
);

/**
 * POST /api/detain/release
 * Release students from detention
 * Body: { userIds: [], releaseDate: "", releaseNotes: "", performedBy: "" }
 */
router.post(
  '/release',
  auth,
  authorize(['admin', 'principal', 'hod']),
  detainController.releaseStudents
);

/**
 * POST /api/detain/suggest
 * Get suggestions for students to detain based on thresholds
 * Body: { attendanceLt: 75, creditLt: 40, department: "", year: 1 }
 */
router.post(
  '/suggest',
  auth,
  authorize(['admin', 'principal', 'hod']),
  detainController.suggestDetain
);

/**
 * GET /api/detain
 * Get list of detained students with filters
 * Query: department, year, reasonType, from, to, page, limit
 */
router.get(
  '/',
  auth,
  authorize(['admin', 'principal', 'hod']),
  detainController.getDetainedStudents
);

/**
 * GET /api/detain/history/:userId
 * Get detention history for a specific student
 */
router.get(
  '/history/:userId',
  auth,
  authorize(['admin', 'principal', 'hod', 'teacher']),
  detainController.getDetainHistory
);

module.exports = router;

const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const sessionController = require('../controllers/sessionController');
const { undoLastSessionAttendance } = require('../controllers/attendanceUndoController');

const router = express.Router();

/**
 * Create session
 * POST /api/sessions
 */
router.post(
  '/',
  auth,
  authorize(['teacher', 'hod', 'admin', 'principal']),
  [
    body('courseId').notEmpty().withMessage('Course ID required'),
    body('sessionDate').isISO8601().withMessage('Valid date required'),
    body('academicYear').notEmpty().withMessage('Academic year required'),
  ],
  sessionController.createSession
);

/**
 * Get session by ID
 * GET /api/sessions/:sessionId
 */
router.get('/:sessionId', auth, sessionController.getSession);

/**
 * Get sessions for course
 * GET /api/courses/:courseId/sessions
 */
router.get('/course/:courseId/sessions', auth, sessionController.getCourseSession);

/**
 * Undo last attendance
 * POST /api/sessions/:sessionId/undo-last
 */
router.post(
  '/:sessionId/undo-last',
  auth,
  authorize(['teacher', 'hod', 'admin', 'principal']),
  undoLastSessionAttendance
);

/**
 * Cancel session
 * PUT /api/sessions/:sessionId/cancel
 */
router.put(
  '/:sessionId/cancel',
  auth,
  authorize(['teacher', 'hod', 'admin', 'principal']),
  sessionController.cancelSession
);

module.exports = router;

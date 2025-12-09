const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const {
  getTimetables,
  getTimetableByQuery,
  getTimetableById,
  createTimetable,
  updateTimetable,
  deleteTimetable,
  getTeacherTimetable,
  getStudentTimetable,
  getTimetableForUser,
  getTeacherSubjectsForDay,
} = require('../controllers/timetableController');

/**
 * GET /api/timetable?departmentId=&year=&section=&semesterId=
 * Get timetables with optional filters
 * Auth: admin|principal|hod
 */
router.get(
  '/',
  auth,
  authorize(['admin', 'principal', 'hod']),
  getTimetables
);

/**
 * GET /api/timetable/query?departmentId=&year=&section=&semesterId=
 * Get specific timetable by query parameters
 * Auth: admin|principal|hod
 */
router.get(
  '/query',
  auth,
  authorize(['admin', 'principal', 'hod']),
  getTimetableByQuery
);

/**
 * GET /api/timetable/my-timetable?semesterId=
 * Get timetable for current user (role-based)
 * Auth: all roles
 */
router.get(
  '/my-timetable',
  auth,
  getTimetableForUser
);

/**
 * GET /api/timetable/teacher-subjects-day?day=&date=
 * Get subjects for teacher on a specific day
 * Auth: teacher
 */
router.get(
  '/teacher-subjects-day',
  auth,
  authorize(['teacher', 'hod', 'admin', 'principal']),
  getTeacherSubjectsForDay
);

/**
 * GET /api/timetable/teacher/:teacherId?semesterId=
 * Get timetable for a specific teacher
 * Auth: all roles
 */
router.get(
  '/teacher/:teacherId?',
  auth,
  getTeacherTimetable
);

/**
 * GET /api/timetable/student/:studentId?semesterId=
 * Get timetable for a specific student
 * Auth: all roles
 */
router.get(
  '/student/:studentId?',
  auth,
  getStudentTimetable
);

/**
 * GET /api/timetable/:id
 * Get timetable by ID
 * Auth: admin|principal|hod
 */
router.get(
  '/:id',
  auth,
  authorize(['admin', 'principal', 'hod']),
  getTimetableById
);

/**
 * POST /api/timetable
 * Create new timetable
 * Auth: admin|principal|hod
 */
router.post(
  '/',
  auth,
  authorize(['admin', 'principal', 'hod']),
  createTimetable
);

/**
 * PUT /api/timetable/:id
 * Update timetable
 * Auth: admin|principal|hod
 */
router.put(
  '/:id',
  auth,
  authorize(['admin', 'principal', 'hod']),
  updateTimetable
);

/**
 * DELETE /api/timetable/:id
 * Delete timetable
 * Auth: admin|principal|hod
 */
router.delete(
  '/:id',
  auth,
  authorize(['admin', 'principal', 'hod']),
  deleteTimetable
);

module.exports = router;

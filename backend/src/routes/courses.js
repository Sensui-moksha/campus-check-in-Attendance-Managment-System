const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const courseController = require('../controllers/courseController');

const router = express.Router();

/**
 * POST /api/courses
 * Create course (admin/principal/hod)
 */
router.post('/', auth, authorize(['admin', 'principal', 'hod']), courseController.createCourse);

/**
 * GET /api/courses
 * List courses with filters
 */
router.get('/', auth, authorize(['admin', 'principal', 'hod', 'teacher']), courseController.listCourses);

/**
 * GET /api/courses/:courseId/roster
 * Get course roster (eligible students)
 */
router.get('/:courseId/roster', auth, authorize(['teacher', 'hod', 'admin']), courseController.getCourseRoster);

/**
 * PUT /api/courses/:courseId/assign-teacher
 * Assign teacher to course (admin/principal/hod)
 */
router.put('/:courseId/assign-teacher', auth, authorize(['admin', 'principal', 'hod']), courseController.assignTeacher);

module.exports = router;

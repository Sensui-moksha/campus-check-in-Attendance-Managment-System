const express = require('express');
const subjectController = require('../controllers/subjectController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

/**
 * POST /api/subjects
 * Create a new subject
 * Requires: admin or principal role
 */
router.post('/', auth, authorize(['admin', 'principal', 'hod']), subjectController.create);

/**
 * GET /api/subjects
 * List all subjects with optional filters
 * Query params: yearOfStudy, semester
 */
router.get('/', auth, subjectController.list);

/**
 * GET /api/subjects/teacher/assigned
 * Get subjects assigned to current teacher
 * Query params: departmentId, yearOfStudy, sectionId, semester
 */
router.get('/teacher/assigned', auth, authorize(['teacher', 'hod']), subjectController.getTeacherSubjects);

/**
 * GET /api/subjects/:id
 * Get subject details
 */
router.get('/:id', auth, subjectController.get);

/**
 * PUT /api/subjects/:id
 * Update subject
 * Requires: admin or principal role
 */
router.put('/:id', auth, authorize(['admin', 'principal', 'hod']), subjectController.update);

/**
 * DELETE /api/subjects/:id
 * Delete subject
 * Requires: admin or principal role
 */
router.delete('/:id', auth, authorize(['admin', 'principal', 'hod']), subjectController.delete);

/**
 * POST /api/subjects/:id/assign-teacher
 * Assign teacher to subject for a specific section
 * Requires: admin, principal, or hod role
 */
router.post('/:id/assign-teacher', auth, authorize(['admin', 'principal', 'hod']), subjectController.assignTeacher);

module.exports = router;

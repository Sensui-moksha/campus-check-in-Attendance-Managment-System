const express = require('express');
const router = express.Router();
const teacherAssignmentController = require('../controllers/teacherAssignmentController');
const authenticate = require('../middleware/auth');

/**
 * Class Assignment Routes
 * Get assignments for specific classes
 */

// Get all assignments for a specific class (department/year/section)
router.get('/:department/:year/:section/assignments', authenticate, teacherAssignmentController.getClassAssignments);

module.exports = router;

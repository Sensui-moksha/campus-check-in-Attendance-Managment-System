const express = require('express');
const router = express.Router();
const teacherAssignmentController = require('../controllers/teacherAssignmentController');
const authenticate = require('../middleware/auth');

/**
 * Teacher Assignment Routes
 * Manage teacher assignments to classes, subjects, and departments
 */

// Get all assignments for a teacher
router.get('/:id/assignments', authenticate, teacherAssignmentController.getTeacherAssignments);

// Create/update assignments for a teacher (bulk)
router.post('/:id/assignments', authenticate, teacherAssignmentController.createTeacherAssignments);

// Update a specific assignment
router.put('/:teacherId/assignments/:assignmentId', authenticate, teacherAssignmentController.updateTeacherAssignment);

// Delete/deactivate an assignment
router.delete('/:teacherId/assignments/:assignmentId', authenticate, teacherAssignmentController.deleteTeacherAssignment);

module.exports = router;

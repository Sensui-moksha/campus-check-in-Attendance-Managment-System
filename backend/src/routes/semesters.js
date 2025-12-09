const express = require('express');
const router = express.Router();
const semesterController = require('../controllers/semesterController');
const authenticate = require('../middleware/auth');

/**
 * Semester Routes
 * Manage academic semesters
 */

// List all semesters
router.get('/', authenticate, semesterController.list);

// Get active semester
router.get('/active', authenticate, semesterController.getActive);

// Get semester by ID
router.get('/:id', authenticate, semesterController.get);

// Create a new semester
router.post('/', authenticate, semesterController.create);

// Update a semester
router.put('/:id', authenticate, semesterController.update);

// Delete a semester
router.delete('/:id', authenticate, semesterController.delete);

// Activate a semester
router.post('/:id/activate', authenticate, semesterController.activate);

module.exports = router;

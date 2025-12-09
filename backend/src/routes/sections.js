const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const sectionController = require('../controllers/sectionController');

const router = express.Router();

/**
 * GET /api/departments/:deptId/sections/distinct
 * Get distinct sections from students in a department (fast aggregation)
 */
router.get('/:deptId/sections/distinct', auth, sectionController.getDistinct);

/**
 * GET /api/departments/:deptId/sections
 * List sections for a department
 */
router.get('/:deptId/sections', auth, sectionController.list);

/**
 * POST /api/departments/:deptId/sections
 * Create a section (admin/principal/hod for their department only)
 */
router.post('/:deptId/sections', auth, authorize(['admin', 'principal', 'hod']), sectionController.create);

/**
 * PUT /api/departments/:deptId/sections/:sectionId
 * Update a section (admin/principal/hod for their department only)
 */
router.put('/:deptId/sections/:sectionId', auth, authorize(['admin', 'principal', 'hod']), sectionController.update);

/**
 * DELETE /api/departments/:deptId/sections/:sectionId
 * Delete a section (admin/principal/hod for their department only)
 */
router.delete('/:deptId/sections/:sectionId', auth, authorize(['admin', 'principal', 'hod']), sectionController.delete);

module.exports = router;

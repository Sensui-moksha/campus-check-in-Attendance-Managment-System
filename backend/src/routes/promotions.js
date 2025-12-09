const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotionController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// All promotion routes require authentication and admin/principal role

/**
 * POST /api/admin/promote
 * Promote students to next academic year
 * Body: { dryRun: false, department: "", year: 1, performedBy: "" }
 */
router.post(
  '/promote',
  auth,
  authorize(['admin', 'principal']),
  promotionController.promoteStudents
);

/**
 * GET /api/admin/promote/preview
 * Get promotion preview without making changes
 * Query: department, year
 */
router.get(
  '/promote/preview',
  auth,
  authorize(['admin', 'principal']),
  promotionController.getPromotionPreview
);

/**
 * POST /api/admin/promote/rollback
 * Rollback last promotion (emergency use only)
 * Body: { confirm: true, performedBy: "" }
 */
router.post(
  '/promote/rollback',
  auth,
  authorize(['admin', 'principal']),
  promotionController.rollbackPromotion
);

/**
 * POST /api/admin/promote/auto/process
 * Process automatic promotions for all ended semesters
 * Body: { performedBy: "" }
 */
router.post(
  '/promote/auto/process',
  auth,
  authorize(['admin', 'principal']),
  promotionController.processAutoPromotions
);

/**
 * POST /api/admin/promote/manual
 * Manually trigger promotion for specific department
 * Body: { departmentId: "", performedBy: "" }
 */
router.post(
  '/promote/manual',
  auth,
  authorize(['admin', 'principal']),
  promotionController.manualTriggerPromotion
);

/**
 * GET /api/admin/promote/auto/status
 * Get automatic promotion status for all semesters
 */
router.get(
  '/promote/auto/status',
  auth,
  authorize(['admin', 'principal']),
  promotionController.getAutoPromotionStatus
);

module.exports = router;

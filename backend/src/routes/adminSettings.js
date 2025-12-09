const express = require('express');
const router = express.Router();
const adminSettingsController = require('../controllers/adminSettingsController');
const authenticate = require('../middleware/auth');

/**
 * Admin Settings Routes
 * System-wide configuration management
 */

// Get current settings
router.get('/settings', authenticate, adminSettingsController.getSettings);

// Update settings
router.put('/settings', authenticate, adminSettingsController.updateSettings);

// Reset settings to defaults
router.post('/settings/reset', authenticate, adminSettingsController.resetSettings);

// Get audit logs for settings changes
router.get('/settings/audit-logs', authenticate, adminSettingsController.getSettingsAuditLogs);

module.exports = router;

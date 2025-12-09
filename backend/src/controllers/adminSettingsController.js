const SystemSettings = require('../models/SystemSettings');
const AuditLog = require('../models/AuditLog');
const Semester = require('../models/Semester');

/**
 * Get system settings
 * GET /admin/settings
 * Permissions: admin only
 */
exports.getSettings = async (req, res, next) => {
  try {
    // Only admin can view settings
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can view system settings' });
    }
    
    // Get settings or create with defaults
    const settings = await SystemSettings.getSettings();
    
    // Populate semester if set
    if (settings.defaultSemesterId) {
      await settings.populate('defaultSemesterId', 'name code startDate endDate isActive');
    }
    
    res.json({
      settings,
      defaults: SystemSettings.getDefaults()
    });
    
  } catch (error) {
    console.error('Error getting system settings:', error);
    next(error);
  }
};

/**
 * Update system settings
 * PUT /admin/settings
 * Permissions: admin only
 */
exports.updateSettings = async (req, res, next) => {
  try {
    // Only admin can update settings
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can update system settings' });
    }
    
    const updates = req.body;
    
    // Validate updates
    const errors = [];
    
    // Boolean validations
    if (updates.teacherDirectDetainAllowed !== undefined && typeof updates.teacherDirectDetainAllowed !== 'boolean') {
      errors.push('teacherDirectDetainAllowed must be a boolean');
    }
    if (updates.allowTeacherMultiDepartment !== undefined && typeof updates.allowTeacherMultiDepartment !== 'boolean') {
      errors.push('allowTeacherMultiDepartment must be a boolean');
    }
    if (updates.enableAuditLogging !== undefined && typeof updates.enableAuditLogging !== 'boolean') {
      errors.push('enableAuditLogging must be a boolean');
    }
    
    // Numeric validations
    if (updates.maxBulkUploadSizeMB !== undefined) {
      const val = Number(updates.maxBulkUploadSizeMB);
      if (isNaN(val) || val < 1 || val > 100) {
        errors.push('maxBulkUploadSizeMB must be between 1 and 100');
      }
    }
    
    if (updates.bulkUploadRateLimitPerHour !== undefined) {
      const val = Number(updates.bulkUploadRateLimitPerHour);
      if (isNaN(val) || val < 1 || val > 100) {
        errors.push('bulkUploadRateLimitPerHour must be between 1 and 100');
      }
    }
    
    if (updates.lowAttendanceThreshold !== undefined) {
      const val = Number(updates.lowAttendanceThreshold);
      if (isNaN(val) || val < 0 || val > 100) {
        errors.push('lowAttendanceThreshold must be between 0 and 100');
      }
    }
    
    if (updates.detentionAttendanceThreshold !== undefined) {
      const val = Number(updates.detentionAttendanceThreshold);
      if (isNaN(val) || val < 0 || val > 100) {
        errors.push('detentionAttendanceThreshold must be between 0 and 100');
      }
    }
    
    if (updates.sessionTimeoutMinutes !== undefined) {
      const val = Number(updates.sessionTimeoutMinutes);
      if (isNaN(val) || val < 5 || val > 1440) {
        errors.push('sessionTimeoutMinutes must be between 5 and 1440');
      }
    }
    
    if (updates.maxExportRecords !== undefined) {
      const val = Number(updates.maxExportRecords);
      if (isNaN(val) || val < 100 || val > 100000) {
        errors.push('maxExportRecords must be between 100 and 100000');
      }
    }
    
    // Email validation
    if (updates.detainNotificationEmail !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updates.detainNotificationEmail)) {
        errors.push('detainNotificationEmail must be a valid email address');
      }
    }
    
    // Semester validation
    if (updates.defaultSemesterId !== undefined && updates.defaultSemesterId) {
      const semester = await Semester.findById(updates.defaultSemesterId);
      if (!semester) {
        errors.push('defaultSemesterId references a non-existent semester');
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        errors 
      });
    }
    
    // Get current settings for audit log
    const before = await SystemSettings.findOne();
    
    // Update settings
    const settings = await SystemSettings.updateSettings(updates, req.user.userId);
    
    // Populate semester if set
    if (settings.defaultSemesterId) {
      await settings.populate('defaultSemesterId', 'name code startDate endDate isActive');
    }
    
    // Create audit log
    await AuditLog.logAction({
      action: 'update_settings',
      entityType: 'settings',
      entityId: settings._id,
      performedBy: req.user.userId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      payload: {
        changedFields: Object.keys(updates)
      },
      before: before ? before.toObject() : null,
      after: settings.toObject(),
      success: true
    });
    
    res.json({
      message: 'Settings updated successfully',
      settings
    });
    
  } catch (error) {
    console.error('Error updating system settings:', error);
    
    // Log failed attempt
    await AuditLog.logAction({
      action: 'update_settings',
      entityType: 'settings',
      performedBy: req.user.userId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      payload: req.body,
      success: false,
      errorMessage: error.message
    });
    
    next(error);
  }
};

/**
 * Reset settings to defaults
 * POST /admin/settings/reset
 * Permissions: admin only
 */
exports.resetSettings = async (req, res, next) => {
  try {
    // Only admin can reset settings
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can reset system settings' });
    }
    
    // Get current settings for audit log
    const before = await SystemSettings.findOne();
    
    // Get defaults
    const defaults = SystemSettings.getDefaults();
    
    // Update to defaults
    const settings = await SystemSettings.updateSettings(defaults, req.user.userId);
    
    // Create audit log
    await AuditLog.logAction({
      action: 'reset_settings',
      entityType: 'settings',
      entityId: settings._id,
      performedBy: req.user.userId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      before: before ? before.toObject() : null,
      after: settings.toObject(),
      success: true
    });
    
    res.json({
      message: 'Settings reset to defaults successfully',
      settings
    });
    
  } catch (error) {
    console.error('Error resetting system settings:', error);
    next(error);
  }
};

/**
 * Get audit logs for settings changes
 * GET /admin/settings/audit-logs
 * Permissions: admin only
 */
exports.getSettingsAuditLogs = async (req, res, next) => {
  try {
    // Only admin can view audit logs
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can view audit logs' });
    }
    
    const { page = 1, limit = 50, dateFrom, dateTo } = req.query;
    
    const result = await AuditLog.getLogsPaginated({
      entityType: 'settings',
      dateFrom,
      dateTo
    }, parseInt(page), parseInt(limit));
    
    res.json(result);
    
  } catch (error) {
    console.error('Error getting settings audit logs:', error);
    next(error);
  }
};

module.exports = {
  getSettings: exports.getSettings,
  updateSettings: exports.updateSettings,
  resetSettings: exports.resetSettings,
  getSettingsAuditLogs: exports.getSettingsAuditLogs
};

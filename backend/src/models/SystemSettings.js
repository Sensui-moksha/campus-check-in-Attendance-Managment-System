const mongoose = require('mongoose');

/**
 * SystemSettings Model
 * Stores global system configuration as key-value pairs
 * Single document pattern - only one settings document should exist
 */
const systemSettingsSchema = new mongoose.Schema({
  // Teacher & Staff Settings
  teacherDirectDetainAllowed: {
    type: Boolean,
    default: false,
    description: 'Allow teachers to detain students directly without HOD/Admin approval'
  },
  allowTeacherMultiDepartment: {
    type: Boolean,
    default: true,
    description: 'Allow teachers to be assigned to multiple departments'
  },
  
  // Bulk Upload Settings
  maxBulkUploadSizeMB: {
    type: Number,
    default: 10,
    min: 1,
    max: 100,
    description: 'Maximum file size for CSV bulk uploads in MB'
  },
  bulkUploadRateLimitPerHour: {
    type: Number,
    default: 10,
    min: 1,
    max: 100,
    description: 'Maximum number of bulk uploads allowed per user per hour'
  },
  
  // Academic Settings
  defaultSemesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    default: null,
    description: 'Default active semester for attendance and reports'
  },
  
  // Notification Settings
  detainNotificationEmail: {
    type: String,
    default: 'admin@college.edu',
    trim: true,
    lowercase: true,
    description: 'Email address for detention notifications'
  },
  lowAttendanceThreshold: {
    type: Number,
    default: 75,
    min: 0,
    max: 100,
    description: 'Attendance percentage threshold for low attendance warnings'
  },
  detentionAttendanceThreshold: {
    type: Number,
    default: 65,
    min: 0,
    max: 100,
    description: 'Attendance percentage threshold for automatic detention consideration'
  },
  
  // Session & Security Settings
  sessionTimeoutMinutes: {
    type: Number,
    default: 60,
    min: 5,
    max: 1440,
    description: 'User session timeout in minutes'
  },
  enableAuditLogging: {
    type: Boolean,
    default: true,
    description: 'Enable comprehensive audit logging for all admin actions'
  },
  
  // Export Settings
  maxExportRecords: {
    type: Number,
    default: 10000,
    min: 100,
    max: 100000,
    description: 'Maximum number of records allowed in a single export'
  },
  
  // Metadata
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    description: 'User who last modified settings'
  },
  lastModifiedAt: {
    type: Date,
    default: Date.now,
    description: 'Timestamp of last modification'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true,
  collection: 'systemSettings'
});

// Ensure only one settings document exists
systemSettingsSchema.index({}, { unique: true });

/**
 * Get or create default settings
 */
systemSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  
  if (!settings) {
    settings = await this.create({});
  }
  
  return settings;
};

/**
 * Update settings
 */
systemSettingsSchema.statics.updateSettings = async function(updates, userId) {
  const settings = await this.findOneAndUpdate(
    {},
    {
      ...updates,
      lastModifiedBy: userId,
      lastModifiedAt: new Date()
    },
    { 
      new: true, 
      upsert: true,
      runValidators: true
    }
  );
  
  return settings;
};

/**
 * Get default settings values
 */
systemSettingsSchema.statics.getDefaults = function() {
  return {
    teacherDirectDetainAllowed: false,
    allowTeacherMultiDepartment: true,
    maxBulkUploadSizeMB: 10,
    bulkUploadRateLimitPerHour: 10,
    defaultSemesterId: null,
    detainNotificationEmail: 'admin@college.edu',
    lowAttendanceThreshold: 75,
    detentionAttendanceThreshold: 65,
    sessionTimeoutMinutes: 60,
    enableAuditLogging: true,
    maxExportRecords: 10000
  };
};

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);

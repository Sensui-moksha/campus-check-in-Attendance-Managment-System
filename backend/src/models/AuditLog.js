const mongoose = require('mongoose');

/**
 * AuditLog Model
 * Tracks all create/update/delete operations for compliance and undo functionality
 */
const auditLogSchema = new mongoose.Schema({
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  action: {
    type: String,
    enum: [
      'ATTENDANCE_MARK',
      'ATTENDANCE_BULK_MARK',
      'ATTENDANCE_UNDO',
      'BULK_IMPORT_STUDENTS',
      'EXPORT_COURSE',
      'EXPORT_COLLEGE',
      'EXPORT_DEPARTMENT',
      'TIMETABLE_IMPORT',
      'SESSION_GENERATE',
      'USER_CREATE',
      'USER_UPDATE',
      'USER_DELETE',
      'COURSE_CREATE',
      'COURSE_UPDATE',
      'COURSE_DELETE',
    ],
    required: true,
    index: true,
  },
  targetCollection: {
    type: String,
    enum: ['attendance', 'user', 'course', 'session', 'timetable'],
    required: true,
    index: true,
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true,
  },
  meta: {
    type: mongoose.Schema.Types.Mixed,
    description: 'Store action-specific data: prev/new values, bulk records array, filters, counts',
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, { timestamps: true });

// Indexes for efficient querying
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ targetCollection: 1, targetId: 1, createdAt: -1 });
auditLogSchema.index({ actor: 1, action: 1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);

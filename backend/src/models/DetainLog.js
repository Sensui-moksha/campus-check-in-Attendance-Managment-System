const mongoose = require('mongoose');

/**
 * DetainLog Model
 * Audit log for all detention and release actions
 * Tracks who did what, when, and why for compliance and reporting
 */
const detainLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
    description: 'Student who was detained or released'
  },
  action: {
    type: String,
    enum: ['detain', 'release'],
    required: true,
    index: true,
    description: 'Type of action performed'
  },
  reason: {
    type: String,
    trim: true,
    description: 'Reason for detention or release'
  },
  reasonType: {
    type: String,
    enum: ['low_attendance', 'low_credit', 'disciplinary', 'custom', null],
    description: 'Categorized reason type for filtering'
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    description: 'Staff member who performed this action'
  },
  performedAt: {
    type: Date,
    default: Date.now,
    index: true,
    description: 'Timestamp of the action'
  },
  notes: {
    type: String,
    trim: true,
    description: 'Additional notes or context'
  },
  attendancePercent: {
    type: Number,
    min: 0,
    max: 100,
    description: 'Student attendance percentage at time of action'
  },
  creditScore: {
    type: Number,
    min: 0,
    description: 'Student credit score at time of action'
  }
}, {
  timestamps: true
});

// Compound index for efficient queries by user and date range
detainLogSchema.index({ user: 1, performedAt: -1 });

// Index for filtering by action type
detainLogSchema.index({ action: 1, performedAt: -1 });

// Index for finding actions by performer
detainLogSchema.index({ performedBy: 1, performedAt: -1 });

module.exports = mongoose.model('DetainLog', detainLogSchema);

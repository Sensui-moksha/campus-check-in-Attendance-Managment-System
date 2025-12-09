const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  sessionToken: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  userAgent: String,
  ipAddress: String,
  expiresAt: {
    type: Date,
    required: true,
    index: true,
    expires: 0, // Auto-delete expired sessions
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastActivityAt: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

// Index for finding active sessions
sessionSchema.index({ userId: 1, isActive: 1 });

// Update lastActivityAt on each request
sessionSchema.methods.updateActivity = function () {
  this.lastActivityAt = new Date();
  return this.save();
};

// Invalidate session (logout)
sessionSchema.methods.invalidate = function () {
  this.isActive = false;
  return this.save();
};

module.exports = mongoose.model('Session', sessionSchema);

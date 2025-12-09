const mongoose = require('mongoose');

/**
 * ClassSession Model
 * Represents a single class session for attendance marking
 */
const classSessionSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  sessionDate: {
    type: Date,
    required: true,
    description: 'Date of the class session'
  },
  startTime: {
    type: String,
    required: false,
    description: 'Session start time (HH:MM format)'
  },
  endTime: {
    type: String,
    required: false,
    description: 'Session end time (HH:MM format)'
  },
  academicYear: {
    type: String,
    required: true,
    description: 'Academic year (e.g., 2025-26)'
  },
  yearOfStudy: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cancelled: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Unique constraint: only one session per course per date
classSessionSchema.index({ course: 1, sessionDate: 1 }, { unique: true });
classSessionSchema.index({ academicYear: 1, yearOfStudy: 1, semester: 1 });

module.exports = mongoose.model('ClassSession', classSessionSchema);

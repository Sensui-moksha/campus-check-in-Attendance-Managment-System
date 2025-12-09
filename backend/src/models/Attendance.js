const mongoose = require('mongoose');

/**
 * Attendance Model
 * Records attendance status for a student in a specific class session
 */
const attendanceSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClassSession',
    required: false,
    description: 'Legacy session reference (optional for backward compatibility)'
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    required: false,
    description: 'Link to semester for better tracking'
  },
  date: {
    type: Date,
    required: true,
    description: 'Date of attendance'
  },
  yearOfStudy: {
    type: Number,
    required: true,
    enum: [1, 2, 3, 4]
  },
  section: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'leave', 'on hold'],
    required: true,
    description: 'Attendance status. "on hold" means not yet marked/pending'
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    description: 'Teacher, HOD, or admin who marked attendance'
  },
  markedAt: {
    type: Date,
    default: Date.now
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

// Unique constraint: one attendance record per student per subject per date
attendanceSchema.index({ student: 1, subject: 1, date: 1 }, { unique: true });
attendanceSchema.index({ student: 1, semester: 1 });
attendanceSchema.index({ session: 1 });
attendanceSchema.index({ department: 1, yearOfStudy: 1, section: 1, date: 1 });
attendanceSchema.index({ date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);

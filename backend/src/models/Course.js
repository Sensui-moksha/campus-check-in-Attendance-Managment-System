const mongoose = require('mongoose');

/**
 * Course Model
 * Represents courses offered in a department for a specific year and semester
 */
const courseSchema = new mongoose.Schema({
  // Link to subject and section so attendance queries can show year/section context
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  },
  section: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section'
  },
  code: {
    type: String,
    required: true,
    trim: true,
    description: 'Unique course code per department/year/semester'
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
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
  programmes: {
    type: [String],
    default: ['B.Tech']
  },
  eligibleBatches: {
    type: [Number],
    description: 'Array of batch years eligible for this course'
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  totalStudentsCache: {
    type: Number,
    default: 0,
    description: 'Cache of enrolled students (update after roster changes)'
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

// Unique index: code must be unique per department/year/semester
courseSchema.index({ department: 1, yearOfStudy: 1, semester: 1, code: 1 }, { unique: true });
courseSchema.index({ teacher: 1 });
courseSchema.index({ department: 1, yearOfStudy: 1, semester: 1 });
courseSchema.index({ subject: 1, section: 1 });

module.exports = mongoose.model('Course', courseSchema);

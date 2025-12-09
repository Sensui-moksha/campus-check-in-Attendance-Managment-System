const mongoose = require('mongoose');

/**
 * Section Model
 * Represents academic sections within a department and year
 * Example: CSE Year 1 has sections A, B, C
 */
const sectionSchema = new mongoose.Schema({
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    description: 'Section identifier (e.g., A, B, C)'
  },
  yearOfStudy: {
    type: Number,
    min: 1,
    max: 4,
    required: true,
    description: 'Year this section applies to (per-year sections)'
  },
  capacity: {
    type: Number,
    required: false,
    description: 'Max students in this section'
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

// Index for fast lookups; allow same section name across years within a department
sectionSchema.index({ department: 1, name: 1, yearOfStudy: 1 }, { unique: true });
sectionSchema.index({ department: 1, yearOfStudy: 1 });

module.exports = mongoose.model('Section', sectionSchema);

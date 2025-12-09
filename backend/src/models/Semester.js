const mongoose = require('mongoose');

/**
 * Semester Model
 * Manages academic semesters with start/end dates and active status
 * Used for attendance calculations, reports, and eligibility rules
 */
const semesterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    description: 'Semester name (e.g., Sem-1 2025, Fall 2024)'
  },
  code: {
    type: String,
    trim: true,
    uppercase: true,
    sparse: true,
    unique: true,
    description: 'Short code for semester (e.g., 2025-1, FA24)'
  },
  startDate: {
    type: Date,
    required: true,
    description: 'Semester start date'
  },
  endDate: {
    type: Date,
    required: true,
    description: 'Semester end date'
  },
  isActive: {
    type: Boolean,
    default: false,
    index: true,
    description: 'Whether this is the currently active semester'
  },
  academicYear: {
    type: String,
    required: true,
    description: 'Academic year (e.g., 2024-2025)'
  },
  semesterNumber: {
    type: Number,
    min: 1,
    max: 8,
    description: 'Semester number (1-8 for 4-year program)'
  },
  departments: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Department' }],
    default: [],
    description: 'Departments participating in this semester (empty = all)'
  },
  description: {
    type: String,
    trim: true,
    description: 'Additional notes about the semester'
  },
  registrationStartDate: {
    type: Date,
    description: 'When students can start registering'
  },
  registrationEndDate: {
    type: Date,
    description: 'Last date for registration'
  },
  examStartDate: {
    type: Date,
    description: 'Examination start date'
  },
  examEndDate: {
    type: Date,
    description: 'Examination end date'
  },
  resultDate: {
    type: Date,
    description: 'Expected result declaration date'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    description: 'Admin/HOD/Principal who created this semester'
  },
  promotionProcessed: {
    type: Boolean,
    default: false,
    index: true,
    description: 'Whether automatic promotion has been processed for this semester'
  },
  promotionProcessedAt: {
    type: Date,
    description: 'When automatic promotion was processed'
  },
  promotionProcessedBy: {
    type: String,
    description: 'Who/what system processed the promotion (SYSTEM or user ID)'
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

// Indexes
semesterSchema.index({ startDate: 1, endDate: 1 });
semesterSchema.index({ isActive: 1, startDate: -1 });
semesterSchema.index({ academicYear: 1, semesterNumber: 1 });

/**
 * Pre-save validation
 */
semesterSchema.pre('save', async function (next) {
  try {
    // Validate date range
    if (this.startDate >= this.endDate) {
      throw new Error('Start date must be before end date');
    }
    
    // Validate registration dates if provided
    if (this.registrationStartDate && this.registrationEndDate) {
      if (this.registrationStartDate >= this.registrationEndDate) {
        throw new Error('Registration start date must be before end date');
      }
    }
    
    // Validate exam dates if provided
    if (this.examStartDate && this.examEndDate) {
      if (this.examStartDate >= this.examEndDate) {
        throw new Error('Exam start date must be before end date');
      }
      if (this.examEndDate > this.endDate) {
        throw new Error('Exam end date cannot be after semester end date');
      }
    }
    
    // If setting this semester as active, check for overlapping active semesters
    if (this.isActive) {
      const overlapping = await this.constructor.findOne({
        _id: { $ne: this._id },
        isActive: true,
        $or: [
          // New semester starts during existing active semester
          { startDate: { $lte: this.startDate }, endDate: { $gte: this.startDate } },
          // New semester ends during existing active semester
          { startDate: { $lte: this.endDate }, endDate: { $gte: this.endDate } },
          // New semester completely contains existing semester
          { startDate: { $gte: this.startDate }, endDate: { $lte: this.endDate } }
        ]
      });
      
      if (overlapping) {
        throw new Error(`Cannot activate: overlaps with active semester "${overlapping.name}" (${overlapping.startDate.toISOString().split('T')[0]} to ${overlapping.endDate.toISOString().split('T')[0]})`);
      }
    }
    
    // Generate code if not provided
    if (!this.code) {
      const year = this.startDate.getFullYear();
      const semNum = this.semesterNumber || 1;
      this.code = `${year}-${semNum}`;
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Static method to get active semester
 */
semesterSchema.statics.getActive = function () {
  return this.findOne({ isActive: true });
};

/**
 * Static method to get current semester based on date
 */
semesterSchema.statics.getCurrentByDate = function (date = new Date()) {
  return this.findOne({
    startDate: { $lte: date },
    endDate: { $gte: date }
  }).sort({ startDate: -1 });
};

/**
 * Static method to deactivate all semesters (before activating a new one)
 */
semesterSchema.statics.deactivateAll = async function () {
  return this.updateMany({ isActive: true }, { isActive: false });
};

/**
 * Instance method to activate this semester (deactivates others)
 */
semesterSchema.methods.activate = async function () {
  // Deactivate all other semesters first
  await this.constructor.deactivateAll();
  
  // Activate this one
  this.isActive = true;
  return this.save();
};

/**
 * Instance method to check if semester is current
 */
semesterSchema.methods.isCurrent = function () {
  const now = new Date();
  return now >= this.startDate && now <= this.endDate;
};

/**
 * Instance method to check if semester is upcoming
 */
semesterSchema.methods.isUpcoming = function () {
  const now = new Date();
  return now < this.startDate;
};

/**
 * Instance method to check if semester is past
 */
semesterSchema.methods.isPast = function () {
  const now = new Date();
  return now > this.endDate;
};

module.exports = mongoose.model('Semester', semesterSchema);

const mongoose = require('mongoose');

/**
 * TeacherAssignment Model
 * Tracks teacher assignments to specific classes, subjects, and departments
 * Allows teachers to teach multiple subjects across different departments/years/sections
 */
const teacherAssignmentSchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
    description: 'Reference to teacher (User with role=teacher)'
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
    description: 'Department code (e.g., CSE, IT, ECE)'
  },
  year: {
    type: Number,
    required: true,
    min: 1,
    max: 4,
    description: 'Year of study (1-4)'
  },
  section: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    description: 'Section identifier (e.g., A, B, C)'
  },
  subjectCode: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    description: 'Subject code (e.g., CSE301)'
  },
  subjectName: {
    type: String,
    required: true,
    trim: true,
    description: 'Full subject name (e.g., Operating Systems)'
  },
  credits: {
    type: Number,
    min: 0,
    max: 10,
    default: 3,
    description: 'Credit hours for this subject'
  },
  isPrimary: {
    type: Boolean,
    default: false,
    description: 'Whether this is the teacher\'s primary assignment'
  },
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    description: 'Associated semester for this assignment'
  },
  academicYear: {
    type: String,
    description: 'Academic year (e.g., 2024-2025)'
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
    description: 'Whether this assignment is currently active'
  },
  startDate: {
    type: Date,
    description: 'Assignment start date'
  },
  endDate: {
    type: Date,
    description: 'Assignment end date'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    description: 'Admin/HOD who created this assignment'
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

// Compound index to prevent duplicate assignments
teacherAssignmentSchema.index(
  { teacherId: 1, department: 1, year: 1, section: 1, subjectCode: 1, isActive: 1 },
  { 
    unique: true,
    partialFilterExpression: { isActive: true },
    name: 'unique_active_assignment'
  }
);

// Index for efficient queries
teacherAssignmentSchema.index({ teacherId: 1, isActive: 1 });
teacherAssignmentSchema.index({ department: 1, year: 1, section: 1 });
teacherAssignmentSchema.index({ subjectCode: 1, isActive: 1 });
teacherAssignmentSchema.index({ semester: 1, isActive: 1 });

/**
 * Pre-save validation
 */
teacherAssignmentSchema.pre('save', async function (next) {
  try {
    // Validate that teacherId references a user with role=teacher
    const User = mongoose.model('User');
    const teacher = await User.findById(this.teacherId);
    
    if (!teacher) {
      throw new Error('Teacher not found');
    }
    
    if (teacher.role !== 'teacher') {
      throw new Error('User must have role=teacher for assignments');
    }
    
    // Validate date range if both dates provided
    if (this.startDate && this.endDate && this.startDate >= this.endDate) {
      throw new Error('Start date must be before end date');
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Static method to find assignments for a teacher
 */
teacherAssignmentSchema.statics.findByTeacher = function (teacherId, filters = {}) {
  const query = { teacherId, isActive: true, ...filters };
  return this.find(query)
    .populate('department')
    .populate('semester')
    .sort({ isPrimary: -1, department: 1, year: 1, section: 1 });
};

/**
 * Static method to find assignments for a class
 */
teacherAssignmentSchema.statics.findByClass = function (department, year, section, filters = {}) {
  const query = { department, year, section, isActive: true, ...filters };
  return this.find(query)
    .populate('teacherId', 'name email employeeId')
    .populate('department')
    .sort({ subjectCode: 1 });
};

/**
 * Static method to check if teacher can mark attendance for a subject/class
 */
teacherAssignmentSchema.statics.canTeacherMarkAttendance = async function (teacherId, department, year, section, subjectCode) {
  const assignment = await this.findOne({
    teacherId,
    department,
    year,
    section,
    subjectCode,
    isActive: true
  });
  return !!assignment;
};

module.exports = mongoose.model('TeacherAssignment', teacherAssignmentSchema);

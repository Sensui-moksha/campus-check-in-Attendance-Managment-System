const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const config = require('../config');

/**
 * User Model
 * Represents all users: students, teachers, HODs, admins, principals
 * Tracks year of study (1-4), batch year, and semester (1-8)
 */
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  displayName: {
    type: String,
    trim: true,
    required: false,
    description: 'Custom display name for dashboard (optional, defaults to first name)'
  },
  email: {
    type: String,
    sparse: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  rollNo: {
    type: String,
    sparse: true,
    unique: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'hod', 'admin', 'principal'],
    required: true
  },
  programme: {
    type: String,
    default: 'B.Tech',
    example: 'B.Tech'
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: false,
    description: 'Primary department for teachers/HODs, or student department'
  },
  workingDepartments: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Department' }],
    default: [],
    description: 'Additional departments teacher works in (for teachers with multiple dept assignments)'
  },
  employeeId: {
    type: String,
    sparse: true,
    unique: true,
    trim: true,
    description: 'Employee ID for teachers/HODs/admin'
  },
  designation: {
    type: String,
    trim: true,
    description: 'Job title/designation for staff'
  },
  batchYear: {
    type: Number,
    required: false,
    description: 'Year of entry (e.g., 2022, 2023, 2024, 2025)'
  },
  section: {
    type: String,
    required: false,
    trim: true,
    description: 'Section identifier (e.g., A, B, C)'
  },
  yearOfStudy: {
    type: Number,
    min: 1,
    max: 4,
    required: false,
    description: 'Current year in programme (1=first year, 4=final year)'
  },
  semester: {
    type: Number,
    min: 1,
    max: 8,
    required: false,
    description: 'Current semester (1-8)'
  },
  // Academic date tracking
  academicStartDate: {
    type: Date,
    required: false,
    description: 'Date student started their programme'
  },
  academicEndDate: {
    type: Date,
    required: false,
    description: 'Expected completion date of programme'
  },
  // Lateral entry tracking
  isLateralEntry: {
    type: Boolean,
    default: false,
    description: 'Whether student entered through lateral entry (starts from 2nd year)'
  },
  // Detention tracking
  isDetained: {
    type: Boolean,
    default: false,
    index: true,
    description: 'Whether student is currently detained'
  },
  detainReason: {
    type: String,
    trim: true,
    description: 'Reason for detention'
  },
  detainReasonType: {
    type: String,
    enum: ['low_attendance', 'low_credit', 'disciplinary', 'custom', null],
    description: 'Categorized reason type'
  },
  detainDate: {
    type: Date,
    description: 'Date student was detained'
  },
  detainBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    description: 'Staff member who detained the student'
  },
  detainNotes: {
    type: String,
    trim: true,
    description: 'Additional notes about detention'
  },
  detainReleaseDate: {
    type: Date,
    description: 'Date student was released from detention'
  },
  detainReleaseBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    description: 'Staff member who released the student'
  },
  detainReleaseNotes: {
    type: String,
    trim: true,
    description: 'Notes about the release'
  },
  // Academic performance
  creditScore: {
    type: Number,
    min: 0,
    description: 'Student credit score or grade points'
  },
  // Alumni status
  isAlumni: {
    type: Boolean,
    default: false,
    index: true,
    description: 'Whether student has graduated'
  },
  alumniDate: {
    type: Date,
    description: 'Date student became alumni'
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

/**
 * Hash password before saving
 */
userSchema.pre('save', async function (next) {
  // If neither password nor passwordHash modified, skip
  if (!this.isModified('passwordHash') && !this.isModified('password')) return next();
  
  try {
    // If plain password is provided, hash it
    if (this.password) {
      this.passwordHash = await bcrypt.hash(this.password, config.BCRYPT_SALT_ROUNDS);
      delete this.password;
    }
    // If passwordHash is already a hash (looks like bcrypt), don't re-hash
    // Bcrypt hashes start with $2a$, $2b$, $2x$, or $2y$
    else if (this.passwordHash && this.passwordHash.startsWith('$2')) {
      // Already hashed, skip re-hashing
      return next();
    }
    // If passwordHash is plain text, hash it
    else if (this.passwordHash && !this.passwordHash.startsWith('$2')) {
      this.passwordHash = await bcrypt.hash(this.passwordHash, config.BCRYPT_SALT_ROUNDS);
    }
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Compare provided password with hash
 */
userSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

/**
 * Hide sensitive fields in JSON output
 */
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.passwordHash;
  return user;
};

// Indexes for common queries
userSchema.index({ email: 1 }, { sparse: true });
userSchema.index({ rollNo: 1 }, { sparse: true });
userSchema.index({ department: 1, role: 1 });
userSchema.index({ batchYear: 1, yearOfStudy: 1 });
userSchema.index({ department: 1, yearOfStudy: 1, section: 1 });
userSchema.index({ isDetained: 1, detainDate: -1 });
userSchema.index({ isAlumni: 1, alumniDate: -1 });

module.exports = mongoose.model('User', userSchema);

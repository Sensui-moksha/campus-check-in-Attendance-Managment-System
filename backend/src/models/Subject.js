const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    yearOfStudy: {
      type: Number,
      required: true,
      enum: [1, 2, 3, 4],
    },
    semester: {
      type: Number,
      required: false,
      enum: [1, 2, 3, 4, 5, 6, 7, 8],
      description: 'Legacy semester number (optional, for backward compatibility)',
    },
    semesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Semester',
      required: false,
      description: 'Link to semester (recommended for new subjects)',
    },
    numberOfClasses: {
      type: Number,
      required: true,
      default: 40,
      min: 1,
      max: 200,
    },
    description: {
      type: String,
      default: '',
    },
    credits: {
      type: Number,
      default: 3,
      min: 1,
      max: 6,
    },
    // Array of section assignments with teachers
    sectionAssignments: [{
      section: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section',
        required: true
      },
      teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
      }
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index for efficient querying
SubjectSchema.index({ yearOfStudy: 1, semester: 1 });
SubjectSchema.index({ department: 1, yearOfStudy: 1 });
SubjectSchema.index({ semesterId: 1 });

module.exports = mongoose.model('Subject', SubjectSchema);

const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
  },
  teacher: {
    type: String,
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  room: {
    type: String,
  },
  rowSpan: {
    type: Number,
    min: 1,
  },
  colSpan: {
    type: Number,
    min: 1,
  },
  isHidden: {
    type: Boolean,
    default: false,
  },
}, { _id: false });

const dayScheduleSchema = new mongoose.Schema({
  day: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  },
  slots: [timeSlotSchema],
}, { _id: false });

const timetableSchema = new mongoose.Schema({
  department: {
    type: String,
    required: true,
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
  },
  year: {
    type: Number,
    required: true,
    min: 1,
    max: 4,
  },
  section: {
    type: String,
    required: true,
  },
  semester: {
    type: String,
    required: true,
  },
  semesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    required: true,
  },
  schedule: [dayScheduleSchema],
  timeSlots: [{
    start: String,
    end: String,
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Compound index to ensure only one timetable per department-year-section-semester combination
timetableSchema.index({ departmentId: 1, year: 1, section: 1, semesterId: 1 }, { unique: true });

// Index for efficient queries
timetableSchema.index({ departmentId: 1, year: 1 });
timetableSchema.index({ semesterId: 1 });

module.exports = mongoose.model('Timetable', timetableSchema);

const mongoose = require('mongoose');

/**
 * Department Model
 * Represents academic departments (CSE, ECE, ME, CE, etc.)
 */
const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    example: 'CSE'
  },
  programmes: {
    type: [String],
    default: ['B.Tech'],
    example: ['B.Tech', 'M.Tech']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Department', departmentSchema);

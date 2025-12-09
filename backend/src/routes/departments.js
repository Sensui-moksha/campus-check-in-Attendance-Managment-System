const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const Department = require('../models/Department');

/**
 * GET /api/departments
 * List all departments
 */
router.get('/', auth, async (req, res, next) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.json({ departments });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/departments/:id
 * Get department by ID
 */
router.get('/:id', auth, async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }
    res.json({ department });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/departments
 * Create new department
 */
router.post('/', auth, authorize(['admin', 'principal']), async (req, res, next) => {
  try {
    const { name, code } = req.body;
    
    if (!name || !code) {
      return res.status(400).json({ error: 'Name and code are required' });
    }

    // Check if department with same code already exists
    const existing = await Department.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ error: 'Department with this code already exists' });
    }

    const department = new Department({
      name,
      code: code.toUpperCase(),
    });

    await department.save();
    res.status(201).json({ department });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/departments/:id
 * Update department
 */
router.put('/:id', auth, authorize(['admin', 'principal']), async (req, res, next) => {
  try {
    const { name, code } = req.body;
    
    if (!name || !code) {
      return res.status(400).json({ error: 'Name and code are required' });
    }

    // Check if another department with same code exists
    const existing = await Department.findOne({ 
      code: code.toUpperCase(),
      _id: { $ne: req.params.id }
    });
    if (existing) {
      return res.status(400).json({ error: 'Department with this code already exists' });
    }

    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { name, code: code.toUpperCase() },
      { new: true, runValidators: true }
    );

    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    res.json({ department });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/departments/:id
 * Delete department
 */
router.delete('/:id', auth, authorize(['admin', 'principal']), async (req, res, next) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);
    
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    res.json({ message: 'Department deleted successfully', department });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/departments/:id/students
 * Get students in a department
 */
router.get('/:id/students', auth, async (req, res, next) => {
  try {
    const { page = 1, limit = 50, year, batchYear } = req.query;
    const User = require('../models/User');
    
    const filter = {
      department: req.params.id,
      role: 'student'
    };
    
    if (year) filter.yearOfStudy = parseInt(year);
    if (batchYear) filter.batchYear = parseInt(batchYear);
    
    const students = await User.find(filter)
      .populate('department', 'name code')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ rollNo: 1 });
    
    const total = await User.countDocuments(filter);
    
    res.json({
      students,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

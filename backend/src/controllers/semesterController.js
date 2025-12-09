const Semester = require('../models/Semester');

/**
 * Get all semesters
 * GET /semesters
 * Permissions: all authenticated users
 */
exports.list = async (req, res, next) => {
  try {
    const { isActive, academicYear, page = 1, limit = 50 } = req.query;
    
    const query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    if (academicYear) {
      query.academicYear = academicYear;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [semesters, total] = await Promise.all([
      Semester.find(query)
        .populate('createdBy', 'name email')
        .populate('departments', 'name code')
        .sort({ startDate: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Semester.countDocuments(query)
    ]);
    
    res.json({
      semesters,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error listing semesters:', error);
    next(error);
  }
};

/**
 * Get active semester
 * GET /semesters/active
 * Permissions: all authenticated users
 */
exports.getActive = async (req, res, next) => {
  try {
    const semester = await Semester.getActive();
    
    if (!semester) {
      return res.status(404).json({ error: 'No active semester found' });
    }
    
    await semester.populate('createdBy', 'name email');
    await semester.populate('departments', 'name code');
    
    res.json({ semester });
  } catch (error) {
    console.error('Error getting active semester:', error);
    next(error);
  }
};

/**
 * Get semester by ID
 * GET /semesters/:id
 * Permissions: all authenticated users
 */
exports.get = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const semester = await Semester.findById(id)
      .populate('createdBy', 'name email')
      .populate('departments', 'name code');
    
    if (!semester) {
      return res.status(404).json({ error: 'Semester not found' });
    }
    
    res.json({ semester });
  } catch (error) {
    console.error('Error getting semester:', error);
    next(error);
  }
};

/**
 * Create a new semester
 * POST /semesters
 * Permissions: admin, principal, hod
 */
exports.create = async (req, res, next) => {
  try {
    // Permission check
    if (!['admin', 'principal', 'hod'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    const {
      name,
      code,
      startDate,
      endDate,
      isActive,
      academicYear,
      semesterNumber,
      departments,
      description,
      registrationStartDate,
      registrationEndDate,
      examStartDate,
      examEndDate,
      resultDate
    } = req.body;
    
    // Validate required fields
    if (!name || !startDate || !endDate || !academicYear) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['name', 'startDate', 'endDate', 'academicYear']
      });
    }
    
    // Create semester
    const semester = await Semester.create({
      name,
      code,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive: isActive || false,
      academicYear,
      semesterNumber,
      departments,
      description,
      registrationStartDate: registrationStartDate ? new Date(registrationStartDate) : undefined,
      registrationEndDate: registrationEndDate ? new Date(registrationEndDate) : undefined,
      examStartDate: examStartDate ? new Date(examStartDate) : undefined,
      examEndDate: examEndDate ? new Date(examEndDate) : undefined,
      resultDate: resultDate ? new Date(resultDate) : undefined,
      createdBy: req.user.userId
    });
    
    await semester.populate('createdBy', 'name email');
    await semester.populate('departments', 'name code');
    
    res.status(201).json({
      message: 'Semester created successfully',
      semester
    });
  } catch (error) {
    console.error('Error creating semester:', error);
    
    // Handle validation errors
    if (error.message.includes('overlaps with active semester')) {
      return res.status(400).json({ error: error.message });
    }
    
    next(error);
  }
};

/**
 * Update a semester
 * PUT /semesters/:id
 * Permissions: admin, principal, hod
 */
exports.update = async (req, res, next) => {
  try {
    // Permission check
    if (!['admin', 'principal', 'hod'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    const { id } = req.params;
    const updates = req.body;
    
    const semester = await Semester.findById(id);
    if (!semester) {
      return res.status(404).json({ error: 'Semester not found' });
    }
    
    // Update allowed fields
    const allowedUpdates = [
      'name', 'code', 'startDate', 'endDate', 'isActive', 'academicYear',
      'semesterNumber', 'departments', 'description', 'registrationStartDate',
      'registrationEndDate', 'examStartDate', 'examEndDate', 'resultDate'
    ];
    
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        // Convert date strings to Date objects
        if (key.includes('Date') && updates[key]) {
          semester[key] = new Date(updates[key]);
        } else {
          semester[key] = updates[key];
        }
      }
    });
    
    await semester.save();
    await semester.populate('createdBy', 'name email');
    await semester.populate('departments', 'name code');
    
    res.json({
      message: 'Semester updated successfully',
      semester
    });
  } catch (error) {
    console.error('Error updating semester:', error);
    
    // Handle validation errors
    if (error.message.includes('overlaps with active semester')) {
      return res.status(400).json({ error: error.message });
    }
    
    next(error);
  }
};

/**
 * Delete a semester (soft delete by default)
 * DELETE /semesters/:id
 * Permissions: admin
 */
exports.delete = async (req, res, next) => {
  try {
    // Only admin can delete
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete semesters' });
    }
    
    const { id } = req.params;
    const { permanent } = req.query;
    
    const semester = await Semester.findById(id);
    if (!semester) {
      return res.status(404).json({ error: 'Semester not found' });
    }
    
    if (permanent === 'true') {
      // Permanent deletion
      await semester.deleteOne();
      res.json({ message: 'Semester permanently deleted' });
    } else {
      // Soft delete (deactivate)
      semester.isActive = false;
      await semester.save();
      res.json({ message: 'Semester deactivated', semester });
    }
  } catch (error) {
    console.error('Error deleting semester:', error);
    next(error);
  }
};

/**
 * Activate a semester (deactivates others)
 * POST /semesters/:id/activate
 * Permissions: admin, principal
 */
exports.activate = async (req, res, next) => {
  try {
    // Permission check
    if (!['admin', 'principal'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only admin or principal can activate semesters' });
    }
    
    const { id } = req.params;
    
    const semester = await Semester.findById(id);
    if (!semester) {
      return res.status(404).json({ error: 'Semester not found' });
    }
    
    // Use the instance method to activate (deactivates others)
    await semester.activate();
    await semester.populate('createdBy', 'name email');
    await semester.populate('departments', 'name code');
    
    res.json({
      message: 'Semester activated successfully',
      semester
    });
  } catch (error) {
    console.error('Error activating semester:', error);
    
    if (error.message.includes('overlaps')) {
      return res.status(400).json({ error: error.message });
    }
    
    next(error);
  }
};

module.exports = {
  list: exports.list,
  getActive: exports.getActive,
  get: exports.get,
  create: exports.create,
  update: exports.update,
  delete: exports.delete,
  activate: exports.activate
};

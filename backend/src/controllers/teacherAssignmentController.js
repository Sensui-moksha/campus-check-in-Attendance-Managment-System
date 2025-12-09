const TeacherAssignment = require('../models/TeacherAssignment');
const User = require('../models/User');
const Department = require('../models/Department');
const mongoose = require('mongoose');

/**
 * Get all assignments for a teacher
 * GET /teachers/:id/assignments
 * Permissions: teacher (self), admin, hod, principal
 */
exports.getTeacherAssignments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { includeInactive, semester, department } = req.query;
    
    // Permission check: teacher can only view their own, others need elevated permissions
    if (req.user.role === 'teacher' && req.user.userId !== id) {
      return res.status(403).json({ error: 'Teachers can only view their own assignments' });
    }
    
    // Verify teacher exists
    const teacher = await User.findById(id);
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    
    if (teacher.role !== 'teacher') {
      return res.status(400).json({ error: 'User is not a teacher' });
    }
    
    // Build query
    const query = { teacherId: id };
    if (includeInactive !== 'true') {
      query.isActive = true;
    }
    if (semester) {
      query.semester = semester;
    }
    if (department) {
      query.department = department;
    }
    
    // Get assignments
    const assignments = await TeacherAssignment.find(query)
      .populate('department', 'name code')
      .populate('semester', 'name code startDate endDate isActive')
      .populate('teacherId', 'name email employeeId')
      .sort({ isPrimary: -1, department: 1, year: 1, section: 1, subjectCode: 1 });
    
    // Get teacher info with working departments
    const teacherInfo = await User.findById(id)
      .populate('department', 'name code')
      .populate('workingDepartments', 'name code')
      .select('name email employeeId department workingDepartments designation');
    
    res.json({
      teacher: teacherInfo,
      assignments,
      total: assignments.length,
      primaryAssignments: assignments.filter(a => a.isPrimary).length,
      departments: [...new Set(assignments.map(a => a.department?._id?.toString()).filter(Boolean))]
    });
  } catch (error) {
    console.error('Error fetching teacher assignments:', error);
    next(error);
  }
};

/**
 * Create or update assignments for a teacher (bulk)
 * POST /teachers/:id/assignments
 * Permissions: admin, hod
 */
exports.createTeacherAssignments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { assignments, replaceAll } = req.body;
    
    // Only admin and HOD can assign
    if (!['admin', 'hod', 'principal'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    // Verify teacher exists
    const teacher = await User.findById(id);
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    
    if (teacher.role !== 'teacher') {
      return res.status(400).json({ error: 'User is not a teacher' });
    }
    
    // Validate assignments array
    if (!Array.isArray(assignments) || assignments.length === 0) {
      return res.status(400).json({ error: 'Assignments must be a non-empty array' });
    }
    
    const results = {
      created: [],
      updated: [],
      errors: [],
      skipped: []
    };
    
    // If replaceAll, deactivate existing assignments
    if (replaceAll) {
      await TeacherAssignment.updateMany(
        { teacherId: id, isActive: true },
        { isActive: false, updatedAt: new Date() }
      );
    }
    
    // Process each assignment
    for (let i = 0; i < assignments.length; i++) {
      const assignment = assignments[i];
      
      try {
        // Validate required fields
        const requiredFields = ['department', 'year', 'section', 'subjectCode', 'subjectName'];
        const missing = requiredFields.filter(f => !assignment[f]);
        
        if (missing.length > 0) {
          results.errors.push({
            index: i,
            assignment,
            error: `Missing required fields: ${missing.join(', ')}`
          });
          continue;
        }
        
        // Validate department exists
        const dept = await Department.findById(assignment.department);
        if (!dept) {
          results.errors.push({
            index: i,
            assignment,
            error: 'Department not found'
          });
          continue;
        }
        
        // Check for duplicate active assignment
        const existing = await TeacherAssignment.findOne({
          teacherId: id,
          department: assignment.department,
          year: assignment.year,
          section: assignment.section,
          subjectCode: assignment.subjectCode,
          isActive: true
        });
        
        if (existing && !replaceAll) {
          results.skipped.push({
            index: i,
            assignment,
            reason: 'Assignment already exists and is active',
            existingId: existing._id
          });
          continue;
        }
        
        // Create new assignment
        const newAssignment = await TeacherAssignment.create({
          teacherId: id,
          department: assignment.department,
          year: assignment.year,
          section: assignment.section,
          subjectCode: assignment.subjectCode.toUpperCase(),
          subjectName: assignment.subjectName,
          credits: assignment.credits || 3,
          isPrimary: assignment.isPrimary || false,
          semester: assignment.semester,
          academicYear: assignment.academicYear,
          startDate: assignment.startDate,
          endDate: assignment.endDate,
          createdBy: req.user.userId,
          isActive: true
        });
        
        // Populate for response
        await newAssignment.populate('department', 'name code');
        await newAssignment.populate('semester', 'name code');
        
        results.created.push(newAssignment);
        
        // Update teacher's workingDepartments if needed
        if (!teacher.workingDepartments.includes(assignment.department)) {
          if (!teacher.department || teacher.department.toString() !== assignment.department.toString()) {
            teacher.workingDepartments.push(assignment.department);
          }
        }
        
      } catch (error) {
        results.errors.push({
          index: i,
          assignment,
          error: error.message
        });
      }
    }
    
    // Save teacher's updated working departments
    if (teacher.isModified('workingDepartments')) {
      await teacher.save();
    }
    
    res.status(201).json({
      message: 'Assignments processed',
      ...results,
      totalProcessed: assignments.length,
      successCount: results.created.length + results.updated.length,
      errorCount: results.errors.length,
      skippedCount: results.skipped.length
    });
    
  } catch (error) {
    console.error('Error creating teacher assignments:', error);
    next(error);
  }
};

/**
 * Update a specific assignment
 * PUT /teachers/:teacherId/assignments/:assignmentId
 * Permissions: admin, hod
 */
exports.updateTeacherAssignment = async (req, res, next) => {
  try {
    const { teacherId, assignmentId } = req.params;
    const updates = req.body;
    
    // Only admin and HOD can update
    if (!['admin', 'hod', 'principal'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    const assignment = await TeacherAssignment.findOne({
      _id: assignmentId,
      teacherId
    });
    
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    
    // Update allowed fields
    const allowedUpdates = ['subjectName', 'credits', 'isPrimary', 'semester', 'academicYear', 'startDate', 'endDate', 'isActive'];
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        assignment[key] = updates[key];
      }
    });
    
    await assignment.save();
    await assignment.populate('department', 'name code');
    await assignment.populate('semester', 'name code');
    
    res.json({
      message: 'Assignment updated successfully',
      assignment
    });
    
  } catch (error) {
    console.error('Error updating teacher assignment:', error);
    next(error);
  }
};

/**
 * Delete/deactivate an assignment
 * DELETE /teachers/:teacherId/assignments/:assignmentId
 * Permissions: admin, hod
 */
exports.deleteTeacherAssignment = async (req, res, next) => {
  try {
    const { teacherId, assignmentId } = req.params;
    const { permanent } = req.query;
    
    // Only admin and HOD can delete
    if (!['admin', 'hod', 'principal'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    const assignment = await TeacherAssignment.findOne({
      _id: assignmentId,
      teacherId
    });
    
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    
    if (permanent === 'true' && req.user.role === 'admin') {
      // Permanent deletion (admin only)
      await assignment.deleteOne();
      res.json({ message: 'Assignment permanently deleted' });
    } else {
      // Soft delete (deactivate)
      assignment.isActive = false;
      assignment.endDate = new Date();
      await assignment.save();
      res.json({ message: 'Assignment deactivated', assignment });
    }
    
  } catch (error) {
    console.error('Error deleting teacher assignment:', error);
    next(error);
  }
};

/**
 * Get assignments for a specific class
 * GET /classes/:department/:year/:section/assignments
 * Permissions: admin, hod, teachers
 */
exports.getClassAssignments = async (req, res, next) => {
  try {
    const { department, year, section } = req.params;
    const { semester } = req.query;
    
    const query = {
      department,
      year: parseInt(year),
      section: section.toUpperCase(),
      isActive: true
    };
    
    if (semester) {
      query.semester = semester;
    }
    
    const assignments = await TeacherAssignment.find(query)
      .populate('teacherId', 'name email employeeId designation')
      .populate('department', 'name code')
      .populate('semester', 'name code startDate endDate')
      .sort({ subjectCode: 1 });
    
    res.json({
      class: { department, year, section },
      assignments,
      total: assignments.length
    });
    
  } catch (error) {
    console.error('Error fetching class assignments:', error);
    next(error);
  }
};

module.exports = {
  getTeacherAssignments: exports.getTeacherAssignments,
  createTeacherAssignments: exports.createTeacherAssignments,
  updateTeacherAssignment: exports.updateTeacherAssignment,
  deleteTeacherAssignment: exports.deleteTeacherAssignment,
  getClassAssignments: exports.getClassAssignments
};

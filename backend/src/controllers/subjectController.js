const Subject = require('../models/Subject');
const User = require('../models/User');
const ClassSession = require('../models/ClassSession');
const Attendance = require('../models/Attendance');
const mongoose = require('mongoose');

/**
 * Create a new subject
 */
exports.create = async (req, res, next) => {
  try {
    const { code, name, yearOfStudy, semester, numberOfClasses, description, sectionAssignments, department } = req.body;

    console.log('📝 Creating subject with data:', {
      code,
      name,
      yearOfStudy,
      semester,
      numberOfClasses,
      sectionAssignments
    });

    // Validate required fields
    if (!code || !name || !yearOfStudy || !semester || !department) {
      return res.status(400).json({ 
        error: 'Code, name, year of study, semester, and department are required' 
      });
    }

    // Allow duplicate subject codes (removed validation check)

    // Deduplicate section assignments by section ID
    let uniqueSectionAssignments = [];
    if (sectionAssignments && Array.isArray(sectionAssignments)) {
      const seenSections = new Set();
      uniqueSectionAssignments = sectionAssignments.filter(assignment => {
        const sectionId = assignment.section.toString();
        if (seenSections.has(sectionId)) {
          return false;
        }
        seenSections.add(sectionId);
        return true;
      });
    }

    // If HOD, enforce department ownership
    const userDeptId = req.user?.department;
    if (req.user?.role === 'hod' && userDeptId && department.toString() !== userDeptId.toString()) {
      return res.status(403).json({ error: 'HOD can only create subjects for their department' });
    }

    // Create subject with deduplicated section assignments
    const subject = await Subject.create({
      code: code.toUpperCase(),
      name,
      yearOfStudy: Number(yearOfStudy),
      semester: Number(semester),
      department,
      numberOfClasses: numberOfClasses || 40,
      description: description || '',
      sectionAssignments: uniqueSectionAssignments,
    });

    console.log('✅ Subject created:', subject);
    console.log('✅ Subject sectionAssignments:', subject.sectionAssignments);

    res.status(201).json({
      message: 'Subject created successfully',
      subject,
    });
  } catch (error) {
    console.error('Error creating subject:', error);
    next(error);
  }
};

/**
 * Get all subjects with optional filters
 */
exports.list = async (req, res, next) => {
  try {
    const { yearOfStudy, semester, departmentId } = req.query;

    const userDeptId = req.user?.department;

    // Build filter: only active subjects
    const filter = { isActive: true };
    if (yearOfStudy) filter.yearOfStudy = Number(yearOfStudy);
    if (semester) filter.semester = Number(semester);
    if (departmentId) filter.department = new mongoose.Types.ObjectId(departmentId);
    if (req.user?.role === 'hod' && userDeptId) {
      filter.department = new mongoose.Types.ObjectId(userDeptId);
    }

    console.log('🔍 Listing subjects with filter:', filter);

    let query = Subject.find(filter);

    query = query.populate('sectionAssignments.section', 'name department')
      .populate('sectionAssignments.teacher', 'name email')
      .sort({ 
        yearOfStudy: 1, 
        semester: 1, 
        name: 1 
      });

    const subjects = await query.exec();

    console.log('📚 Subjects found:', subjects.length);
    
    // Detailed logging
    subjects.forEach((s) => {
      console.log(`\n📚 Subject: ${s.code} - ${s.name}`);
      console.log('   sectionAssignments structure:', JSON.stringify(s.sectionAssignments, null, 2));
    });

    res.json({
      count: subjects.length,
      subjects,
    });
  } catch (error) {
    console.error('Error listing subjects:', error);
    next(error);
  }
};

/**
 * Get a specific subject
 */
exports.get = async (req, res, next) => {
  try {
    const { id } = req.params;

    const subject = await Subject.findById(id)
      .populate('sectionAssignments.section', 'name department yearOfStudy')
      .populate('sectionAssignments.teacher', 'name email');
    
    if (!subject) {
      return res.status(404).json({ 
        error: 'Subject not found' 
      });
    }

    // Fetch students for this subject
    // Students belong to the same department, year, and section as the subject's section assignment
    let students = [];
    
    if (subject.sectionAssignments && subject.sectionAssignments.length > 0) {
      const assignment = subject.sectionAssignments[0]; // Get first assignment
      if (assignment.section) {
        students = await User.find({
          role: 'student',
          department: assignment.section.department,
          yearOfStudy: subject.yearOfStudy,
          section: assignment.section.name
        }).select('_id name rollNo email section yearOfStudy');
      }
    }

    res.json({
      ...subject.toObject(),
      students
    });
  } catch (error) {
    console.error('Error getting subject:', error);
    next(error);
  }
};

/**
 * Update a subject
 */
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { code, name, yearOfStudy, semester, numberOfClasses, description, isActive, department } = req.body;

    const userDeptId = req.user?.department;

    // Check if subject exists
    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({ 
        error: 'Subject not found' 
      });
    }

    if (req.user?.role === 'hod' && userDeptId && subject.department?.toString() !== userDeptId.toString()) {
      return res.status(403).json({ error: 'HOD can only update subjects in their department' });
    }

    // Allow duplicate subject codes (removed validation check)

    // Update fields
    if (code) subject.code = code.toUpperCase();
    if (name) subject.name = name;
    if (yearOfStudy) subject.yearOfStudy = Number(yearOfStudy);
    if (semester) subject.semester = Number(semester);
    if (numberOfClasses) subject.numberOfClasses = Number(numberOfClasses);
    if (department && req.user?.role !== 'hod') {
      subject.department = department;
    }
    if (description !== undefined) subject.description = description;
    if (isActive !== undefined) subject.isActive = isActive;

    await subject.save();

    console.log('✅ Subject updated:', subject.code);

    res.json({
      message: 'Subject updated successfully',
      subject,
    });
  } catch (error) {
    console.error('Error updating subject:', error);
    next(error);
  }
};

/**
 * Delete a subject (soft delete - keeps all related data in DB)
 */
exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;

    const userDeptId = req.user?.department;

    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({ 
        error: 'Subject not found' 
      });
    }

    if (req.user?.role === 'hod' && userDeptId && subject.department?.toString() !== userDeptId.toString()) {
      return res.status(403).json({ error: 'HOD can only delete subjects in their department' });
    }

    // Soft delete: mark as inactive (skip validation to allow legacy subjects without required fields)
    subject.isActive = false;
    await subject.save({ validateBeforeSave: false });

    console.log('✅ Subject soft deleted (code can be reused):', subject.code);

    res.json({
      message: 'Subject deleted successfully',
      subject,
    });
  } catch (error) {
    console.error('Error deleting subject:', error);
    next(error);
  }
};

/**
 * Assign teacher to subject for a specific section
 */
exports.assignTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { sectionId, teacherId } = req.body;

    if (!sectionId) {
      return res.status(400).json({ 
        error: 'Section ID is required' 
      });
    }

    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({ 
        error: 'Subject not found' 
      });
    }

    // Find existing assignment for this section
    const existingIndex = subject.sectionAssignments.findIndex(
      assignment => assignment.section.toString() === sectionId
    );

    if (existingIndex >= 0) {
      // Update existing assignment
      subject.sectionAssignments[existingIndex].teacher = teacherId || null;
      console.log('Updated existing section assignment');
    } else {
      // Add new assignment if section doesn't exist
      subject.sectionAssignments.push({
        section: sectionId,
        teacher: teacherId || null
      });
      console.log('Added new section assignment');
    }

    await subject.save();

    // Populate and return updated subject
    await subject.populate([
      { path: 'sectionAssignments.section', select: 'name department' },
      { path: 'sectionAssignments.teacher', select: 'name email' }
    ]);

    console.log('✅ Teacher assigned to subject:', subject.code);

    res.json({
      message: 'Teacher assigned successfully',
      subject,
    });
  } catch (error) {
    console.error('Error assigning teacher:', error);
    next(error);
  }
};

/**
 * Get subjects assigned to a teacher
 * Filters by department, yearOfStudy, and section if provided
 */
exports.getTeacherSubjects = async (req, res, next) => {
  try {
    const teacherId = req.user.userId;
    const { departmentId, yearOfStudy, sectionId, semester } = req.query;

    console.log('🔍 getTeacherSubjects called');
    console.log('   Teacher ID from req.user.userId:', teacherId);
    console.log('   Full req.user:', req.user);

    if (!teacherId) {
      console.log('❌ ERROR: No teacherId found in req.user.userId');
      return res.status(400).json({ error: 'Teacher ID not found in authentication' });
    }

    // Convert to ObjectId
    const teacherObjectId = new mongoose.Types.ObjectId(teacherId);
    console.log('✅ Converted teacherId to ObjectId:', teacherObjectId);

    // Build aggregation pipeline
    const pipeline = [
      {
        $match: {
          isActive: true,
          'sectionAssignments.teacher': teacherObjectId
        }
      },
      {
        $unwind: '$sectionAssignments'
      },
      {
        $match: {
          'sectionAssignments.teacher': teacherObjectId
        }
      },
      {
        $lookup: {
          from: 'sections',
          localField: 'sectionAssignments.section',
          foreignField: '_id',
          as: 'sectionInfo'
        }
      },
      {
        $unwind: '$sectionInfo'
      },
      {
        $lookup: {
          from: 'departments',
          localField: 'sectionInfo.department',
          foreignField: '_id',
          as: 'deptInfo'
        }
      },
      {
        $unwind: '$deptInfo'
      }
    ];

    // Add optional filters
    if (departmentId) {
      pipeline.push({
        $match: { 'deptInfo._id': new mongoose.Types.ObjectId(departmentId) }
      });
    }
    if (yearOfStudy) {
      pipeline.push({
        $match: { yearOfStudy: Number(yearOfStudy) }
      });
    }
    if (sectionId) {
      pipeline.push({
        $match: { 'sectionAssignments.section': new mongoose.Types.ObjectId(sectionId) }
      });
    }
    if (semester) {
      pipeline.push({
        $match: { semester: Number(semester) }
      });
    }

    // Project fields
    pipeline.push({
      $project: {
        _id: 1,
        subjectId: '$_id',
        code: 1,
        name: 1,
        yearOfStudy: 1,
        semester: 1,
        numberOfClasses: 1,
        description: 1,
        section: {
          _id: '$sectionInfo._id',
          name: '$sectionInfo.name',
          yearOfStudy: '$sectionInfo.yearOfStudy'
        },
        department: {
          _id: '$deptInfo._id',
          name: '$deptInfo.name',
          code: '$deptInfo.code'
        }
      }
    });

    // Sort
    pipeline.push({
      $sort: { 'deptInfo.name': 1, yearOfStudy: 1, 'sectionInfo.name': 1, name: 1 }
    });

    let subjects = await Subject.aggregate(pipeline);

    console.log(`✓ Found ${subjects.length} subjects for teacher`);

    // Enrich with student counts and average attendance
    subjects = await Promise.all(subjects.map(async (subject) => {
      try {
        // Get student count for this section
        const studentCount = await User.countDocuments({
          role: 'student',
          yearOfStudy: subject.yearOfStudy,
          semester: subject.semester,
          department: subject.department._id
        });

        // Get average attendance for this subject
        let avgPercent = 0;
        const sessions = await ClassSession.find({
          course: subject._id,
          cancelled: false
        }).lean();

        if (sessions.length > 0) {
          const attendanceStats = await Attendance.aggregate([
            {
              $match: {
                session: { $in: sessions.map(s => s._id) }
              }
            },
            {
              $facet: {
                total: [{ $count: 'count' }],
                present: [
                  {
                    $match: { status: { $in: ['present', 'late'] } }
                  },
                  { $count: 'count' }
                ]
              }
            }
          ]);

          if (attendanceStats[0]?.total[0]?.count > 0) {
            const totalAttendance = attendanceStats[0].total[0].count;
            const presentCount = attendanceStats[0].present[0]?.count || 0;
            avgPercent = Math.round((presentCount / totalAttendance) * 100);
          }
        }

        return {
          ...subject,
          students: studentCount,
          avgPercent: avgPercent
        };
      } catch (err) {
        console.error('Error enriching subject data:', err);
        return {
          ...subject,
          students: 0,
          avgPercent: 0
        };
      }
    }));

    res.json({
      count: subjects.length,
      subjects
    });
    console.log('✅ Returning', subjects.length, 'subjects for teacher:', teacherId);
  } catch (error) {
    console.error('Error getting teacher subjects:', error);
    next(error);
  }
    }

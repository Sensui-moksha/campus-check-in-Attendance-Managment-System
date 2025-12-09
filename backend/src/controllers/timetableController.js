const Timetable = require('../models/Timetable');
const Semester = require('../models/Semester');
const User = require('../models/User');

/**
 * Get timetables with optional filters
 */
exports.getTimetables = async (req, res) => {
  try {
    const { departmentId, year, section, semesterId } = req.query;
    const filter = {};

    if (departmentId) filter.departmentId = departmentId;
    if (year) filter.year = parseInt(year);
    if (section) filter.section = section;
    if (semesterId) filter.semesterId = semesterId;

    const timetables = await Timetable.find(filter)
      .populate('departmentId', 'name code')
      .populate('semesterId', 'name academicYear startDate endDate isActive')
      .sort({ year: 1, section: 1 });

    res.json({
      success: true,
      count: timetables.length,
      timetables,
    });
  } catch (error) {
    console.error('Error fetching timetables:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch timetables',
    });
  }
};

/**
 * Get timetable by query parameters (for specific class/semester)
 */
exports.getTimetableByQuery = async (req, res) => {
  try {
    const { departmentId, year, section, semesterId } = req.query;

    if (!departmentId || !year || !section || !semesterId) {
      return res.status(400).json({
        success: false,
        error: 'Department, year, section, and semester are required',
      });
    }

    const timetable = await Timetable.findOne({
      departmentId,
      year: parseInt(year),
      section,
      semesterId,
    })
      .populate('departmentId', 'name code')
      .populate('semesterId', 'name academicYear startDate endDate isActive')
      .populate('schedule.slots.subjectId', 'name code')
      .populate('schedule.slots.teacherId', 'name email');

    if (!timetable) {
      return res.status(404).json({
        success: false,
        error: 'Timetable not found',
      });
    }

    res.json({
      success: true,
      timetable,
    });
  } catch (error) {
    console.error('Error fetching timetable:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch timetable',
    });
  }
};

/**
 * Get timetable by ID
 */
exports.getTimetableById = async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id)
      .populate('departmentId', 'name code')
      .populate('semesterId', 'name academicYear startDate endDate isActive')
      .populate('schedule.slots.subjectId', 'name code')
      .populate('schedule.slots.teacherId', 'name email');

    if (!timetable) {
      return res.status(404).json({
        success: false,
        error: 'Timetable not found',
      });
    }

    res.json({
      success: true,
      timetable,
    });
  } catch (error) {
    console.error('Error fetching timetable:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch timetable',
    });
  }
};

/**
 * Create new timetable
 */
exports.createTimetable = async (req, res) => {
  try {
    const { departmentId, year, section, semesterId } = req.body;

    // Check if timetable already exists for this combination
    const existingTimetable = await Timetable.findOne({
      departmentId,
      year,
      section,
      semesterId,
    });

    if (existingTimetable) {
      return res.status(400).json({
        success: false,
        error: 'Timetable already exists for this class and semester',
      });
    }

    const timetable = new Timetable({
      ...req.body,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    await timetable.save();

    await timetable.populate('departmentId', 'name code');
    await timetable.populate('semesterId', 'name academicYear startDate endDate isActive');

    console.log(`Timetable created for ${timetable.department} Year ${timetable.year} Section ${timetable.section}`, {
      userId: req.user._id,
      timetableId: timetable._id,
    });

    res.status(201).json({
      success: true,
      message: 'Timetable created successfully',
      timetable,
    });
  } catch (error) {
    console.error('Error creating timetable:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Timetable already exists for this class and semester',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create timetable',
    });
  }
};

/**
 * Update timetable
 */
exports.updateTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id);

    if (!timetable) {
      return res.status(404).json({
        success: false,
        error: 'Timetable not found',
      });
    }

    // Update fields
    Object.keys(req.body).forEach((key) => {
      if (key !== 'createdBy') {
        timetable[key] = req.body[key];
      }
    });

    timetable.updatedBy = req.user._id;
    await timetable.save();

    await timetable.populate('departmentId', 'name code');
    await timetable.populate('semesterId', 'name academicYear startDate endDate isActive');

    console.log(`Timetable updated for ${timetable.department} Year ${timetable.year} Section ${timetable.section}`, {
      userId: req.user._id,
      timetableId: timetable._id,
    });

    res.json({
      success: true,
      message: 'Timetable updated successfully',
      timetable,
    });
  } catch (error) {
    console.error('Error updating timetable:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Timetable already exists for this class and semester',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update timetable',
    });
  }
};

/**
 * Delete timetable
 */
exports.deleteTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id);

    if (!timetable) {
      return res.status(404).json({
        success: false,
        error: 'Timetable not found',
      });
    }

    await timetable.deleteOne();

    console.log(`Timetable deleted for ${timetable.department} Year ${timetable.year} Section ${timetable.section}`, {
      userId: req.user._id,
      timetableId: timetable._id,
    });

    res.json({
      success: true,
      message: 'Timetable deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting timetable:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete timetable',
    });
  }
};

/**
 * Get timetable for a specific teacher
 */
exports.getTeacherTimetable = async (req, res) => {
  try {
    const teacherId = req.params.teacherId || req.user._id;
    const { semesterId } = req.query;

    const filter = {
      'schedule.slots.teacherId': teacherId,
    };

    if (semesterId) {
      filter.semesterId = semesterId;
    }

    const timetables = await Timetable.find(filter)
      .populate('departmentId', 'name code')
      .populate('semesterId', 'name academicYear startDate endDate isActive')
      .populate('schedule.slots.subjectId', 'name code')
      .sort({ year: 1, section: 1 });

    res.json({
      success: true,
      count: timetables.length,
      timetables,
    });
  } catch (error) {
    console.error('Error fetching teacher timetable:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch teacher timetable',
    });
  }
};

/**
 * Get timetable for a specific student based on their class
 */
exports.getStudentTimetable = async (req, res) => {
  try {
    const studentId = req.params.studentId || req.user._id;
    const { semesterId } = req.query;

    // Get student details
    const student = await User.findById(studentId).populate('section');

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found',
      });
    }

    const filter = {
      departmentId: student.department,
      year: student.yearOfStudy,
      section: student.section?.name || student.section,
    };

    if (semesterId) {
      filter.semesterId = semesterId;
    }

    const timetable = await Timetable.findOne(filter)
      .populate('departmentId', 'name code')
      .populate('semesterId', 'name academicYear startDate endDate isActive')
      .populate('schedule.slots.subjectId', 'name code')
      .populate('schedule.slots.teacherId', 'name email');

    if (!timetable) {
      return res.status(404).json({
        success: false,
        error: 'Timetable not found for this student',
      });
    }

    res.json({
      success: true,
      timetable,
    });
  } catch (error) {
    console.error('Error fetching student timetable:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch student timetable',
    });
  }
};

/**
 * Get timetable for current user (role-based)
 */
exports.getTimetableForUser = async (req, res) => {
  try {
    console.log('🎯 getTimetableForUser called - User:', req.user?.email, 'Role:', req.user?.role);
    const userId = req.user._id;
    const user = await User.findById(userId).populate('department');
    console.log('👤 User loaded:', user?.name, user?.role, 'Section:', user?.section);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Get active semester or use provided semesterId
    const { semesterId } = req.query;
    let activeSemester;
    
    if (semesterId) {
      activeSemester = await Semester.findById(semesterId);
    } else {
      activeSemester = await Semester.findOne({ isActive: true });
    }

    if (!activeSemester) {
      return res.status(404).json({
        success: false,
        error: 'No active semester found',
      });
    }

    console.log('📅 Active semester:', activeSemester.name);

    let timetables = [];

    if (user.role === 'student') {
      // For students, get their class timetable
      if (!user.department || !user.yearOfStudy || !user.section) {
        console.log('❌ Student profile incomplete:', { 
          department: user.department?._id, 
          yearOfStudy: user.yearOfStudy, 
          section: user.section 
        });
        return res.status(400).json({
          success: false,
          error: 'Student profile is incomplete',
        });
      }

      console.log('🔍 Looking for timetable:', {
        departmentId: user.department._id,
        year: user.yearOfStudy,
        section: user.section,
        semesterId: activeSemester._id
      });

      const timetable = await Timetable.findOne({
        departmentId: user.department._id,
        year: user.yearOfStudy,
        section: user.section,
        semesterId: activeSemester._id,
      })
        .populate('departmentId', 'name code')
        .populate('semesterId', 'name academicYear startDate endDate')
        .populate('schedule.slots.subjectId', 'name code')
        .populate('schedule.slots.teacherId', 'name email');

      console.log('📋 Timetable found:', timetable ? 'Yes' : 'No');

      if (timetable) {
        timetables = [timetable];
      }
    } else if (user.role === 'teacher') {
      // For teachers, get all timetables where they teach
      console.log('🔍 Looking for teacher timetables:', {
        semesterId: activeSemester._id,
        teacherId: userId
      });

      timetables = await Timetable.find({
        semesterId: activeSemester._id,
        'schedule.slots.teacherId': userId,
      })
        .populate('departmentId', 'name code')
        .populate('semesterId', 'name academicYear startDate endDate')
        .populate('schedule.slots.subjectId', 'name code')
        .populate('schedule.slots.teacherId', 'name email');

      console.log('📋 Timetables found for teacher:', timetables.length);
    } else if (user.role === 'hod') {
      // HOD can see all timetables in their department
      if (!user.department) {
        return res.status(400).json({
          success: false,
          error: 'HOD department not assigned',
        });
      }

      timetables = await Timetable.find({
        departmentId: user.department._id,
        semesterId: activeSemester._id,
      })
        .populate('departmentId', 'name code')
        .populate('semesterId', 'name academicYear startDate endDate')
        .populate('schedule.slots.subjectId', 'name code')
        .populate('schedule.slots.teacherId', 'name email');
    } else if (user.role === 'admin' || user.role === 'principal') {
      // Admin/Principal can see all timetables
      timetables = await Timetable.find({
        semesterId: activeSemester._id,
      })
        .populate('departmentId', 'name code')
        .populate('semesterId', 'name academicYear startDate endDate')
        .populate('schedule.slots.subjectId', 'name code')
        .populate('schedule.slots.teacherId', 'name email');
    }

    res.json({
      success: true,
      timetables,
      userRole: user.role,
      semester: activeSemester,
    });
  } catch (error) {
    console.error('Error fetching user timetable:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch timetable',
    });
  }
};

/**
 * Get subjects for teacher on a specific day
 */
exports.getTeacherSubjectsForDay = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { day, date } = req.query;

    if (!day) {
      return res.status(400).json({
        success: false,
        error: 'Day is required',
      });
    }

    // Get active semester
    const activeSemester = await Semester.findOne({ isActive: true });
    if (!activeSemester) {
      return res.status(404).json({
        success: false,
        error: 'No active semester found',
      });
    }

    // Find all timetables where teacher teaches
    const timetables = await Timetable.find({
      semesterId: activeSemester._id,
      'schedule.day': day,
      'schedule.slots.teacherId': teacherId,
    })
      .populate('departmentId', 'name code')
      .populate('semesterId', 'name academicYear')
      .populate('schedule.slots.subjectId', 'name code')
      .populate('schedule.slots.teacherId', 'name email');

    // Extract subjects for the specific day
    const subjectsForDay = [];
    
    timetables.forEach(timetable => {
      const daySchedule = timetable.schedule.find(s => s.day === day);
      if (daySchedule) {
        daySchedule.slots.forEach(slot => {
          if (slot.teacherId && slot.teacherId._id.toString() === teacherId.toString() && slot.subjectId) {
            subjectsForDay.push({
              subjectId: slot.subjectId._id,
              subjectName: slot.subjectId.name,
              subjectCode: slot.subjectId.code,
              department: timetable.departmentId,
              departmentId: timetable.departmentId._id,
              year: timetable.year,
              section: timetable.section,
              startTime: slot.startTime,
              endTime: slot.endTime,
              room: slot.room,
              timetableId: timetable._id,
            });
          }
        });
      }
    });

    res.json({
      success: true,
      subjects: subjectsForDay,
      day,
      date,
      count: subjectsForDay.length,
    });
  } catch (error) {
    console.error('Error fetching teacher subjects:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subjects',
    });
  }
};


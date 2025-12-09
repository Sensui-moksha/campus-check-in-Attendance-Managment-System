const User = require('../models/User');
const Department = require('../models/Department');
const bcrypt = require('bcrypt');
const config = require('../config');

/**
 * Create new user (admin/principal only)
 */
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, rollNo, role, password, departmentId, programme, batchYear, yearOfStudy, semester, section, academicStartDate, academicEndDate, employeeId, designation, isLateralEntry } = req.body;

    if (!name || !role || !password) {
      return res.status(400).json({ error: 'Name, role, and password required' });
    }

    // Validate department exists if provided
    if (departmentId) {
      const dept = await Department.findById(departmentId);
      if (!dept) return res.status(404).json({ error: 'Department not found' });
    }

    const user = new User({
      name,
      email: email && email.trim() ? email : undefined,
      rollNo: rollNo && rollNo.trim() ? rollNo : undefined,
      role,
      passwordHash: password,
      department: departmentId || undefined,
      programme: programme || 'B.Tech',
      batchYear: batchYear ? parseInt(batchYear) : undefined,
      yearOfStudy: yearOfStudy ? parseInt(yearOfStudy) : undefined,
      semester: semester ? parseInt(semester) : undefined,
      section: section && section.trim() ? section : undefined,
      academicStartDate: academicStartDate ? new Date(academicStartDate) : undefined,
      academicEndDate: academicEndDate ? new Date(academicEndDate) : undefined,
      employeeId: employeeId && employeeId.trim() ? employeeId : undefined,
      designation: designation && designation.trim() ? designation : undefined,
      isLateralEntry: role === 'student' && isLateralEntry === true ? true : false
    });

    await user.save();

    res.status(201).json({
      ok: true,
      userId: user._id,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('User creation error:', error.message, error);
    next(error);
  }
};

/**
 * Get list of students with optional filters
 */
exports.listStudents = async (req, res, next) => {
  try {
    const { departmentId, year, batchYear, page = 1, limit = 500 } = req.query;
    const query = { role: 'student' };

    if (departmentId) query.department = departmentId;
    if (year) query.yearOfStudy = parseInt(year, 10);
    if (batchYear) query.batchYear = parseInt(batchYear, 10);

    const skip = (page - 1) * limit;
    const students = await User.find(query)
      .populate('department')
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean();

    const total = await User.countDocuments(query);

    res.json({
      students,
      pagination: { page: parseInt(page, 10), limit: parseInt(limit, 10), total }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get list of students by department
 */
exports.listStudentsByDept = async (req, res, next) => {
  try {
    const { deptId } = req.params;
    const { year, batchYear, section, page = 1, limit = 500 } = req.query;

    const query = { role: 'student', department: deptId };
    if (year) query.yearOfStudy = parseInt(year, 10);
    if (batchYear) query.batchYear = parseInt(batchYear, 10);
    if (section) query.section = section;

    const skip = (page - 1) * limit;
    const students = await User.find(query)
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean();

    const total = await User.countDocuments(query);

    res.json({
      students,
      pagination: { page: parseInt(page, 10), limit: parseInt(limit, 10), total }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single student by ID
 */
exports.getStudent = async (req, res, next) => {
  try {
    const student = await User.findById(req.params.studentId)
      .populate('department')
      .lean();

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    next(error);
  }
};

/**
 * Update student (admin/principal/hod)
 */
exports.updateStudent = async (req, res, next) => {
  try {
    console.log('🔄 Update student request body:', JSON.stringify(req.body, null, 2));
    const { name, displayName, email, rollNo, departmentId, role, batchYear, yearOfStudy, semester, password, section, academicStartDate, academicEndDate, programme, employeeId, designation, isLateralEntry } = req.body;
    const student = await User.findById(req.params.studentId);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    console.log('👤 Found student:', student.email || student.rollNo);

    if (name) student.name = name;
    if (displayName !== undefined) student.displayName = displayName; // Allow empty string to clear displayName
    if (email) student.email = email;
    if (rollNo) student.rollNo = rollNo;
    if (role) student.role = role;
    if (departmentId) student.department = departmentId;
    if (batchYear) student.batchYear = parseInt(batchYear);
    if (yearOfStudy) student.yearOfStudy = parseInt(yearOfStudy);
    if (semester) student.semester = parseInt(semester);
    if (section) student.section = section;
    if (isLateralEntry !== undefined && student.role === 'student') student.isLateralEntry = isLateralEntry;
    if (password) {
      console.log('🔐 Password change requested, hashing password...');
      console.log('📝 Plain password length:', password.length);
      // Hash the password before storing
      const hashedPassword = await bcrypt.hash(password, config.BCRYPT_SALT_ROUNDS);
      console.log('✅ Password hashed successfully, hash length:', hashedPassword.length);
      console.log('🔑 Hash preview:', hashedPassword.substring(0, 20) + '...');
      student.passwordHash = hashedPassword;
    }
    if (programme) student.programme = programme;
    if (academicStartDate) student.academicStartDate = new Date(academicStartDate);
    if (academicEndDate) student.academicEndDate = new Date(academicEndDate);
    if (employeeId !== undefined) student.employeeId = employeeId && employeeId.trim() ? employeeId : null;
    if (designation !== undefined) student.designation = designation && designation.trim() ? designation : null;

    console.log('💾 Saving student updates...');
    await student.save();
    console.log('✅ Student saved successfully');

    res.json({
      ok: true,
      user: student.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete student (admin/principal only)
 */
exports.deleteStudent = async (req, res, next) => {
  try {
    const student = await User.findByIdAndDelete(req.params.studentId);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
};

/**
 * List users by role (teachers, admin, etc.)
 */
exports.listByRole = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 500 } = req.query;

    if (!role) {
      return res.status(400).json({ error: 'Role parameter required' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find({ role })
      .populate('department')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ name: 1 });

    const total = await User.countDocuments({ role });

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get list of teachers
 */
exports.listTeachers = async (req, res, next) => {
  try {
    const { departmentId, page = 1, limit = 500 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { role: 'teacher' };
    if (departmentId) {
      query.department = departmentId;
    }

    const teachers = await User.find(query)
      .populate('department')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ name: 1 });

    const total = await User.countDocuments(query);

    res.json({
      teachers,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk delete users (admin/principal only)
 */
exports.bulkDeleteUsers = async (req, res, next) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'userIds array is required and must not be empty' });
    }

    // Delete all users with the provided IDs
    const result = await User.deleteMany({ _id: { $in: userIds } });

    res.json({
      ok: true,
      deletedCount: result.deletedCount,
      message: `Successfully deleted ${result.deletedCount} user(s)`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get students by section and department
 */
exports.getStudentsBySection = async (req, res, next) => {
  try {
    const { departmentId, sectionId, yearOfStudy, page = 1, limit = 500 } = req.query;

    if (!departmentId || !sectionId) {
      return res.status(400).json({ error: 'departmentId and sectionId are required' });
    }

    // First, try to find the Section document by ID to get its name
    const Section = require('../models/Section');
    let sectionName = sectionId;
    
    try {
      const sectionDoc = await Section.findById(sectionId);
      if (sectionDoc) {
        sectionName = sectionDoc.name;
        console.log('📍 Found section by ID:', sectionId, '-> name:', sectionName);
      }
    } catch (err) {
      // If sectionId is not a valid ObjectId, treat it as a section name
      console.log('📍 sectionId is not an ObjectId, treating as name:', sectionId);
    }

    // Handle sectionName - could be "Section A" or just "A"
    let sectionValue = sectionName;
    if (typeof sectionName === 'string') {
      // If it starts with "Section", extract the part after "Section "
      if (sectionName.includes('Section ')) {
        sectionValue = sectionName.split('Section ')[1]?.trim();
      }
    }

    console.log('📍 Looking for students with section:', sectionValue, 'in department:', departmentId, 'year:', yearOfStudy);

    const query = { 
      role: 'student', 
      department: departmentId,
      section: { $regex: `^${sectionValue}$`, $options: 'i' }  // Case-insensitive match
    };

    if (yearOfStudy) {
      query.yearOfStudy = parseInt(yearOfStudy, 10);
    }

    const skip = (page - 1) * limit;
    const students = await User.find(query)
      .select('_id name rollNo email yearOfStudy section department isDetained detainReason detainReasonType')
      .skip(skip)
      .limit(parseInt(limit, 10))
      .sort({ rollNo: 1 })
      .lean();

    console.log('📍 Found students:', students.length);

    const total = await User.countDocuments(query);

    res.json({
      students,
      pagination: { 
        page: parseInt(page, 10), 
        limit: parseInt(limit, 10), 
        total 
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/students/:studentId/attendance
 * Get subject-wise and monthly attendance for a student
 */
exports.getStudentAttendance = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const Attendance = require('../models/Attendance');
    const ClassSession = require('../models/ClassSession');
    const Course = require('../models/Course');
    const Subject = require('../models/Subject');

    // Verify student exists
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get all attendance records for this student
    const attendanceRecords = await Attendance.find({ student: studentId })
      .populate({
        path: 'session',
        populate: {
          path: 'course',
          populate: {
            path: 'subject'
          }
        }
      })
      .populate('subject', 'code name')
      .sort({ date: -1 })
      .lean();

    // Get all courses the student's department has
    const courses = await Course.find({ department: student.department })
      .populate('subject', '_id code name numberOfClasses')
      .lean();

    // Calculate subject-wise attendance
    const subjectMap = new Map();
    attendanceRecords.forEach(record => {
      let subjectInfo = null;
      let subjectId = null;
      let numberOfClasses = 0;

      // Try to get subject from direct subject field
      if (record.subject) {
        subjectInfo = `${record.subject.code} - ${record.subject.name}`;
        subjectId = record.subject._id?.toString();
      } 
      // Or try to get from session -> course -> subject
      else if (record.session?.course?.subject) {
        subjectInfo = `${record.session.course.subject.code} - ${record.session.course.subject.name}`;
        subjectId = record.session.course.subject._id?.toString();
        numberOfClasses = record.session.course.subject.numberOfClasses || 0;
      }

      if (!subjectInfo || !subjectId) return;
      
      if (!subjectMap.has(subjectId)) {
        subjectMap.set(subjectId, {
          subject: subjectInfo,
          present: 0,
          attended: 0,
          total: numberOfClasses,
          subjectId: subjectId
        });
      }
      
      const data = subjectMap.get(subjectId);
      data.attended++;
      if (record.status === 'present' || record.status === 'late') {
        data.present++;
      }
    });

    // Update total classes from subject numberOfClasses field
    courses.forEach(course => {
      if (course.subject) {
        const subjectId = course.subject._id?.toString();
        const subjectInfo = `${course.subject.code} - ${course.subject.name}`;
        const numberOfClasses = course.subject.numberOfClasses || 40; // Default to 40 if not set
        
        if (!subjectMap.has(subjectId)) {
          subjectMap.set(subjectId, {
            subject: subjectInfo,
            present: 0,
            attended: 0,
            total: numberOfClasses,
            subjectId: subjectId
          });
        } else {
          // Update total if not already set from attendance
          if (subjectMap.get(subjectId).total === 0) {
            subjectMap.get(subjectId).total = numberOfClasses;
          }
        }
      }
    });

    const subjectWise = Array.from(subjectMap.values()).map(item => ({
      subject: item.subject,
      presentCount: item.present,
      totalCount: item.total,
      attendancePct: item.total > 0 ? Math.round((item.present / item.total) * 100) : 0
    }));

    // Calculate monthly attendance
    const monthMap = new Map();
    attendanceRecords.forEach(record => {
      // Skip if no date
      if (!record.date) return;
      
      const date = new Date(record.date);
      
      // Check if date is valid
      if (isNaN(date.getTime())) return;
      
      const monthKey = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
      
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, {
          month: monthKey,
          present: 0,
          total: 0
        });
      }
      
      const data = monthMap.get(monthKey);
      data.total++;
      if (record.status === 'present' || record.status === 'late') {
        data.present++;
      }
    });

    const monthlyAttendance = Array.from(monthMap.values())
      .map(item => {
        const [year, month] = item.month.split('-');
        const monthDate = new Date(parseInt(year), parseInt(month) - 1);
        const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        return {
          month: item.month,
          monthName: monthName,
          presentCount: item.present,
          totalCount: item.total,
          attendancePct: item.total > 0 ? Math.round((item.present / item.total) * 100) : 0
        };
      })
      .sort((a, b) => b.month.localeCompare(a.month));

    // Calculate overall attendance
    let totalPresent = 0;
    let totalRecords = attendanceRecords.length;
    attendanceRecords.forEach(record => {
      if (record.status === 'present' || record.status === 'late') {
        totalPresent++;
      }
    });

    const overallAttendancePct = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;

    res.json({
      student: {
        _id: student._id,
        name: student.name,
        rollNo: student.rollNo,
        yearOfStudy: student.yearOfStudy,
        section: student.section
      },
      overall: {
        attendancePct: overallAttendancePct,
        presentCount: totalPresent,
        totalCount: totalRecords
      },
      subjectWise,
      monthlyAttendance
    });
  } catch (error) {
    next(error);
  }
};

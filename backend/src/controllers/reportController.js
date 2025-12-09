const Attendance = require('../models/Attendance');
const ClassSession = require('../models/ClassSession');
const Course = require('../models/Course');
const User = require('../models/User');
const Department = require('../models/Department');
const { getPeriodRange } = require('../utils/periodUtils');

/**
 * Get department attendance report
 * GET /api/reports/department/:departmentId
 * Query params: period (day|week|month), startDate, endDate
 * Response: aggregated stats, course-wise breakdown, CSV-ready format
 * Auth: hod (own dept), admin, principal
 */
const getDepartmentReport = async (req, res, next) => {
  try {
    const { departmentId } = req.params;
    const { period = 'week', startDate, endDate } = req.query;
    const userRole = req.user.role;

    // Authorization
    if (userRole === 'hod') {
      const userDeptId = typeof req.user.department === 'string' ? req.user.department : req.user.department?._id?.toString();
      if (String(userDeptId) !== String(departmentId)) {
        return res.status(403).json({ error: 'Cannot access another department' });
      }
    }

    if (!['admin', 'principal', 'hod'].includes(userRole)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const dept = await Department.findById(departmentId);
    if (!dept) {
      return res.status(404).json({ error: 'Department not found' });
    }

    // Get date range
    const dateRange = getPeriodRange(period, startDate, endDate);

    // Get all courses in department with students
    const courses = await Course.find({ department: departmentId })
      .populate('teacher', 'name email');

    // Get all students in department
    const students = await User.find({
      department: departmentId,
      role: 'student',
    });

    // Build report
    const courseBreakdown = [];
    let totalSessionsMarked = 0;
    let totalAttendanceRecords = 0;

    for (const course of courses) {
      const sessions = await ClassSession.countDocuments({
        course: course._id,
        sessionDate: { $gte: dateRange.start, $lte: dateRange.end },
        cancelled: false,
      });

      const attendance = await Attendance.find({
        markedAt: { $gte: dateRange.start, $lte: dateRange.end },
      })
        .populate('session')
        .populate('student', '_id');

      const courseAttendance = attendance.filter(
        a => a.session?.course.toString() === course._id.toString()
      );

      const present = courseAttendance.filter(a => a.status === 'present').length;

      courseBreakdown.push({
        courseCode: course.code,
        courseName: course.name,
        teacher: course.teacher.name,
        sessionsHeld: sessions,
        totalRecords: courseAttendance.length,
        presentCount: present,
        attendancePercentage:
          courseAttendance.length > 0
            ? ((present / courseAttendance.length) * 100).toFixed(2)
            : 0,
      });

      totalSessionsMarked += sessions;
      totalAttendanceRecords += courseAttendance.length;
    }

    const overallPercentage =
      totalAttendanceRecords > 0
        ? (
            (courseBreakdown.reduce((sum, c) => sum + c.presentCount, 0) /
              totalAttendanceRecords) *
            100
          ).toFixed(2)
        : 0;

    res.json({
      department: dept.name,
      period,
      dateRange,
      studentCount: students.length,
      courseCount: courses.length,
      totalSessionsMarked,
      totalAttendanceRecords,
      overallAttendancePercentage: overallPercentage,
      courseBreakdown,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get course attendance report
 * GET /api/reports/course/:courseId
 * Query params: period, startDate, endDate
 * Response: student-wise breakdown with attendance status
 * Auth: teacher (own course), hod (own dept), admin, principal
 */
const getCourseReport = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { period = 'week', startDate, endDate } = req.query;
    const userRole = req.user.role;

    const course = await Course.findById(courseId)
      .populate('teacher', 'name email')
      .populate('department', 'name');

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Authorization
    if (userRole === 'teacher' && course.teacher._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (userRole === 'hod') {
      const userDeptId = typeof req.user.department === 'string' ? req.user.department : req.user.department?._id?.toString();
      const courseDeptId = course.department._id.toString();
      if (String(userDeptId) !== String(courseDeptId)) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
    }

    if (!['admin', 'principal', 'teacher', 'hod'].includes(userRole)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const dateRange = getPeriodRange(period, startDate, endDate);

    // Get eligible students for this course based on yearOfStudy
    const students = await User.find({
      role: 'student',
      yearOfStudy: course.yearOfStudy,
      department: course.department._id,
    })
      .select('_id name email rollNo');

    // Get sessions in period
    const sessions = await ClassSession.find({
      course: courseId,
      sessionDate: { $gte: dateRange.start, $lte: dateRange.end },
      cancelled: false,
    }).sort({ sessionDate: 1 });

    // Build student attendance breakdown
    const studentBreakdown = [];

    for (const student of students) {
      const records = await Attendance.find({
        student: student._id,
        markedAt: { $gte: dateRange.start, $lte: dateRange.end },
      })
        .populate('session')
        .select('status');

      const courseRecords = records.filter(
        r => r.session?.course.toString() === courseId
      );

      const present = courseRecords.filter(r => r.status === 'present').length;
      const late = courseRecords.filter(r => r.status === 'late').length;
      const absent = courseRecords.filter(r => r.status === 'absent').length;

      const percentage =
        courseRecords.length > 0
          ? (((present + late * 0.5) / courseRecords.length) * 100).toFixed(2)
          : 0;

      studentBreakdown.push({
        studentId: student._id,
        rollNo: student.rollNo,
        name: student.name,
        email: student.email,
        sessionsAttended: present,
        sessionsLate: late,
        sessionsAbsent: absent,
        totalSessions: courseRecords.length,
        attendancePercentage: percentage,
      });
    }

    res.json({
      course: {
        code: course.code,
        name: course.name,
        teacher: course.teacher.name,
        department: course.department.name,
      },
      period,
      dateRange,
      sessionsInPeriod: sessions.length,
      studentCount: students.length,
      studentBreakdown,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get college-wide attendance report
 * GET /api/reports/college
 * Query params: period, startDate, endDate
 * Response: department-wise and course-wise aggregate stats
 * Auth: admin, principal
 */
const getCollegeReport = async (req, res, next) => {
  try {
    const { period = 'month', startDate, endDate } = req.query;
    const userRole = req.user.role;

    if (!['admin', 'principal'].includes(userRole)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const dateRange = getPeriodRange(period, startDate, endDate);

    // Get all departments
    const departments = await Department.find();

    const deptBreakdown = [];
    let collegeTotal = 0;
    let collegePresent = 0;

    for (const dept of departments) {
      const courses = await Course.find({ department: dept._id });
      const students = await User.countDocuments({
        department: dept._id,
        role: 'student',
      });

      let deptAttendance = 0;
      let deptPresent = 0;

      for (const course of courses) {
        const records = await Attendance.countDocuments({
          markedAt: { $gte: dateRange.start, $lte: dateRange.end },
        })
          .populate('session')
          .where('session.course')
          .equals(course._id);

        const presentCount = await Attendance.countDocuments({
          status: 'present',
          markedAt: { $gte: dateRange.start, $lte: dateRange.end },
        })
          .populate('session')
          .where('session.course')
          .equals(course._id);

        deptAttendance += records;
        deptPresent += presentCount;
      }

      const percentage =
        deptAttendance > 0 ? ((deptPresent / deptAttendance) * 100).toFixed(2) : 0;

      deptBreakdown.push({
        department: dept.name,
        studentCount: students,
        courseCount: courses.length,
        totalRecords: deptAttendance,
        presentCount: deptPresent,
        attendancePercentage: percentage,
      });

      collegeTotal += deptAttendance;
      collegePresent += deptPresent;
    }

    const collegePercentage =
      collegeTotal > 0 ? ((collegePresent / collegeTotal) * 100).toFixed(2) : 0;

    res.json({
      collegeName: 'Campus Check-in System',
      period,
      dateRange,
      departmentCount: departments.length,
      totalRecords: collegeTotal,
      totalPresent: collegePresent,
      collegeAttendancePercentage: collegePercentage,
      departmentBreakdown: deptBreakdown,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDepartmentReport,
  getCourseReport,
  getCollegeReport,
};

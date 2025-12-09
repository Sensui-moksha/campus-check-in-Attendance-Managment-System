const Course = require('../models/Course');
const ClassSession = require('../models/ClassSession');
const Attendance = require('../models/Attendance');
const User = require('../models/User');

/**
 * Analytics Controller
 * Provides attendance analytics, trends, and per-student summaries
 */

/**
 * Get course attendance summary with per-student aggregation and trends
 * GET /api/analytics/courses/:courseId/summary
 */
const getCourseSummary = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { from, to, batchYear, yearOfStudy } = req.query;

    // Build session filter
    const sessionFilter = { course: courseId };
    if (from || to) {
      sessionFilter.sessionDate = {};
      if (from) sessionFilter.sessionDate.$gte = new Date(from);
      if (to) sessionFilter.sessionDate.$lte = new Date(to);
    }

    // Get all sessions for this course
    const sessions = await ClassSession.find(sessionFilter)
      .populate('course')
      .sort({ sessionDate: 1 });

    if (!sessions.length) {
      return res.json({
        perStudent: [],
        trend: [],
        courseInfo: await Course.findById(courseId),
      });
    }

    const sessionIds = sessions.map(s => s._id);

    // Get all attendances for these sessions
    const attendances = await Attendance.find({
      session: { $in: sessionIds },
    })
      .populate('student', 'name email rollNo yearOfStudy batchYear');

    // Aggregate per-student stats
    const studentStats = {};
    attendances.forEach(att => {
      if (!att.student) return;

      // Filter by yearOfStudy if provided
      if (yearOfStudy && att.student.yearOfStudy !== parseInt(yearOfStudy)) {
        return;
      }
      // Filter by batchYear if provided
      if (batchYear && att.student.batchYear !== parseInt(batchYear)) {
        return;
      }

      const key = att.student._id;
      if (!studentStats[key]) {
        studentStats[key] = {
          studentId: att.student._id,
          name: att.student.name,
          email: att.student.email,
          rollNo: att.student.rollNo,
          totalSessions: 0,
          presentCount: 0,
          absentCount: 0,
          lateCount: 0,
          leaveCount: 0,
          attendancePercentage: 0,
        };
      }

      studentStats[key].totalSessions += 1;
      if (att.status === 'present') studentStats[key].presentCount += 1;
      if (att.status === 'absent') studentStats[key].absentCount += 1;
      if (att.status === 'late') studentStats[key].lateCount += 1;
      if (att.status === 'leave') studentStats[key].leaveCount += 1;
    });

    // Calculate percentages
    const perStudent = Object.values(studentStats).map(stats => ({
      ...stats,
      attendancePercentage: stats.totalSessions > 0 
        ? Math.round((stats.presentCount / stats.totalSessions) * 100)
        : 0,
    }));

    // Generate trend data (per session)
    const trend = sessions.map(session => {
      const sessionAttendances = attendances.filter(a => a.session.toString() === session._id.toString());
      const presentCount = sessionAttendances.filter(a => a.status === 'present').length;
      const totalCount = sessionAttendances.length;

      return {
        sessionDate: session.sessionDate.toISOString().split('T')[0],
        sessionId: session._id,
        totalStudents: totalCount,
        presentCount,
        attendancePercentage: totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0,
      };
    });

    res.json({
      perStudent: perStudent.sort((a, b) => b.attendancePercentage - a.attendancePercentage),
      trend,
      courseInfo: {
        id: sessions[0].course._id,
        code: sessions[0].course.code,
        name: sessions[0].course.name,
        totalSessions: sessions.length,
      },
      filters: {
        from: from || 'all',
        to: to || 'all',
        batchYear: batchYear || 'all',
        yearOfStudy: yearOfStudy || 'all',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get department attendance summary
 * GET /api/analytics/departments/:departmentId/summary
 */
const getDepartmentSummary = async (req, res, next) => {
  try {
    const { departmentId } = req.params;
    const { from, to } = req.query;

    // Get all students in this department
    const students = await User.find({ 
      role: 'student',
      department: departmentId 
    })
      .select('_id name rollNo email yearOfStudy section')
      .sort({ rollNo: 1 });

    const studentCount = students.length;
    const studentIds = students.map(s => s._id);

    // Get all courses for department
    const courses = await Course.find({ department: departmentId });
    const courseIds = courses.map(c => c._id);

    // Get sessions within date range
    const sessionFilter = { course: { $in: courseIds } };
    if (from || to) {
      sessionFilter.sessionDate = {};
      if (from) sessionFilter.sessionDate.$gte = new Date(from);
      if (to) sessionFilter.sessionDate.$lte = new Date(to);
    }

    const sessions = await ClassSession.find(sessionFilter);
    const sessionIds = sessions.map(s => s._id);

    // Aggregate attendance
    const attendances = await Attendance.find({
      session: { $in: sessionIds },
      student: { $in: studentIds }
    });

    // Calculate per-student attendance
    const studentAttendanceMap = {};
    students.forEach(student => {
      studentAttendanceMap[student._id] = {
        total: 0,
        present: 0,
      };
    });

    attendances.forEach(att => {
      if (att.student && studentAttendanceMap[att.student]) {
        studentAttendanceMap[att.student].total += 1;
        if (att.status === 'present' || att.status === 'late') {
          studentAttendanceMap[att.student].present += 1;
        }
      }
    });

    // Build student data with attendance percentages
    const studentData = students.map(student => ({
      _id: student._id,
      name: student.name,
      rollNo: student.rollNo,
      yearOfStudy: student.yearOfStudy || null,
      section: student.section || null,
      attendancePct: studentAttendanceMap[student._id].total > 0 
        ? Math.round((studentAttendanceMap[student._id].present / studentAttendanceMap[student._id].total) * 100)
        : 0
    }));

    // Summary by year of study
    const byYear = {};
    [1, 2, 3, 4].forEach(year => {
      byYear[year] = {
        year,
        total: 0,
        present: 0,
        absent: 0,
      };
    });

    attendances.forEach(att => {
      const student = students.find(s => s._id.toString() === att.student.toString());
      if (student) {
        const year = student.yearOfStudy || 1;
        byYear[year].total += 1;
        if (att.status === 'present' || att.status === 'late' || att.status === 'leave') byYear[year].present += 1;
        if (att.status === 'absent') byYear[year].absent += 1;
      }
    });

    Object.keys(byYear).forEach(year => {
      if (byYear[year].total > 0) {
        byYear[year].percentage = Math.round((byYear[year].present / byYear[year].total) * 100);
      }
    });

    // Calculate average attendance percentage
    const totalAttendance = attendances.length;
    const presentCount = attendances.filter(a => a.status === 'present' || a.status === 'late' || a.status === 'leave').length;
    const avgPercent = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

    res.json({
      departmentId,
      studentCount,
      students: studentData,
      avgPercent,
      summary: byYear,
      totalSessions: sessions.length,
      totalAttendanceRecords: attendances.length,
      dateRange: { from: from || 'all', to: to || 'all' },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get college-wide attendance summary
 * GET /api/analytics/college/summary
 */
const getCollegeSummary = async (req, res, next) => {
  try {
    const { from, to } = req.query;

    const sessionFilter = {};
    if (from || to) {
      sessionFilter.sessionDate = {};
      if (from) sessionFilter.sessionDate.$gte = new Date(from);
      if (to) sessionFilter.sessionDate.$lte = new Date(to);
    }

    const sessions = await ClassSession.find(sessionFilter);
    const sessionIds = sessions.map(s => s._id);

    const attendances = await Attendance.find({
      session: { $in: sessionIds },
    });

    const presentCount = attendances.filter(a => a.status === 'present').length;
    const absentCount = attendances.filter(a => a.status === 'absent').length;
    const lateCount = attendances.filter(a => a.status === 'late').length;
    const leaveCount = attendances.filter(a => a.status === 'leave').length;

    const total = attendances.length;

    res.json({
      summary: {
        totalSessions: sessions.length,
        totalAttendanceRecords: total,
        presentCount,
        absentCount,
        lateCount,
        leaveCount,
        overallPercentage: total > 0 ? Math.round((presentCount / total) * 100) : 0,
      },
      breakdown: {
        present: ((presentCount / total) * 100).toFixed(2) + '%',
        absent: ((absentCount / total) * 100).toFixed(2) + '%',
        late: ((lateCount / total) * 100).toFixed(2) + '%',
        leave: ((leaveCount / total) * 100).toFixed(2) + '%',
      },
      dateRange: { from: from || 'all', to: to || 'all' },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get department students with accurate attendance for HOD Dashboard
 * GET /api/analytics/departments/:departmentId/students
 */
const getDepartmentStudents = async (req, res, next) => {
  try {
    const { departmentId } = req.params;

    // Get all students in this department
    const students = await User.find({ 
      role: 'student',
      department: departmentId 
    })
      .select('_id name rollNo email yearOfStudy section')
      .sort({ rollNo: 1 });

    // Get all courses for this department
    const courses = await Course.find({ department: departmentId });
    const courseIds = courses.map(c => c._id);

    // Get all sessions for department courses
    const sessions = await ClassSession.find({ 
      course: { $in: courseIds } 
    });
    const sessionIds = sessions.map(s => s._id);

    // Get all attendance records for these sessions
    const attendances = await Attendance.find({
      session: { $in: sessionIds },
      student: { $in: students.map(s => s._id) }
    });

    // Calculate per-student attendance
    const studentsWithAttendance = students.map(student => {
      const studentAttendances = attendances.filter(
        a => a.student.toString() === student._id.toString()
      );

      const totalClasses = studentAttendances.length;
      const presentCount = studentAttendances.filter(
        a => a.status === 'present'
      ).length;

      const attendancePercentage = totalClasses > 0 
        ? Math.round((presentCount / totalClasses) * 100) 
        : 0;

      return {
        _id: student._id,
        name: student.name,
        rollNo: student.rollNo,
        email: student.email,
        yearOfStudy: student.yearOfStudy,
        section: student.section,
        attendancePercentage,
        totalClasses,
        presentCount
      };
    });

    res.json({ students: studentsWithAttendance });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCourseSummary,
  getDepartmentSummary,
  getCollegeSummary,
  getDepartmentStudents,
};

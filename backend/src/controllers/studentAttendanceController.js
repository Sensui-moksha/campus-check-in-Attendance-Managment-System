const Attendance = require('../models/Attendance');
const ClassSession = require('../models/ClassSession');
const Subject = require('../models/Subject');
const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * Get per-subject attendance summary for a student
 * GET /students/:id/attendance/summary
 * Permissions: student (self), teacher (assigned), hod, admin, principal
 */
exports.getAttendanceSummary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { semester, academicYear } = req.query;
    
    // Permission check: student can only view their own
    if (req.user.role === 'student' && req.user.userId?.toString() !== id) {
      return res.status(403).json({ error: 'Students can only view their own attendance' });
    }
    
    // Verify student exists
    const student = await User.findById(id).populate('department');
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    if (student.role !== 'student') {
      return res.status(400).json({ error: 'User is not a student' });
    }
    
    // Build query for class sessions
    const sessionQuery = {
      yearOfStudy: student.yearOfStudy
    };
    
    if (semester) {
      sessionQuery.semester = parseInt(semester);
    } else if (student.semester) {
      sessionQuery.semester = student.semester;
    }
    
    if (academicYear) {
      sessionQuery.academicYear = academicYear;
    }
    
    // Get all subjects for this student's year and semester
    const subjects = await Subject.find({
      yearOfStudy: student.yearOfStudy,
      semester: sessionQuery.semester || student.semester,
      isActive: true
    }).populate('sectionAssignments.section');
    
    // Filter subjects by student's section and department
    const studentSubjects = subjects.filter(subject => {
      return subject.sectionAssignments.some(sa => {
        return sa.section && 
               sa.section.department?.toString() === student.department?._id?.toString() &&
               sa.section.name === student.section;
      });
    });
    
    // Calculate attendance for each subject
    const subjectAttendance = await Promise.all(
      studentSubjects.map(async (subject) => {
        // Get all sessions for this subject
        const sessions = await ClassSession.find({
          ...sessionQuery,
          cancelled: false
        }).populate({
          path: 'course',
          match: { subjectCode: subject.code }
        });
        
        const validSessions = sessions.filter(s => s.course);
        
        if (validSessions.length === 0) {
          return {
            subjectCode: subject.code,
            subjectName: subject.name,
            totalClasses: 0,
            attended: 0,
            absent: 0,
            late: 0,
            leave: 0,
            percentage: 0,
            lastUpdated: null
          };
        }
        
        // Get attendance records for this student in these sessions
        const attendanceRecords = await Attendance.find({
          session: { $in: validSessions.map(s => s._id) },
          student: id
        }).sort({ markedAt: -1 });
        
        const attended = attendanceRecords.filter(a => a.status === 'present').length;
        const absent = attendanceRecords.filter(a => a.status === 'absent').length;
        const late = attendanceRecords.filter(a => a.status === 'late').length;
        const leave = attendanceRecords.filter(a => a.status === 'leave').length;
        
        const totalClasses = validSessions.length;
        const percentage = totalClasses > 0 
          ? Math.round(((attended + late) / totalClasses) * 100)
          : 0;
        
        return {
          subjectCode: subject.code,
          subjectName: subject.name,
          totalClasses,
          attended,
          absent,
          late,
          leave,
          percentage,
          lastUpdated: attendanceRecords.length > 0 ? attendanceRecords[0].markedAt : null
        };
      })
    );
    
    // Calculate overall statistics
    const totalClasses = subjectAttendance.reduce((sum, s) => sum + s.totalClasses, 0);
    const totalAttended = subjectAttendance.reduce((sum, s) => sum + s.attended + s.late, 0);
    const overallPercentage = totalClasses > 0 
      ? Math.round((totalAttended / totalClasses) * 100)
      : 0;
    
    res.json({
      student: {
        id: student._id,
        name: student.name,
        rollNo: student.rollNo,
        department: student.department?.name,
        yearOfStudy: student.yearOfStudy,
        section: student.section,
        semester: student.semester
      },
      subjects: subjectAttendance,
      overall: {
        totalSubjects: subjectAttendance.length,
        totalClasses,
        totalAttended,
        totalAbsent: subjectAttendance.reduce((sum, s) => sum + s.absent, 0),
        overallPercentage
      },
      filters: {
        semester: sessionQuery.semester,
        academicYear: sessionQuery.academicYear
      }
    });
    
  } catch (error) {
    console.error('Error getting attendance summary:', error);
    next(error);
  }
};

/**
 * Get detailed attendance history for a student with filters
 * GET /students/:id/attendance/history
 * Permissions: student (self), teacher (assigned), hod, admin, principal
 */
exports.getAttendanceHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      subjectCode, 
      dateFrom, 
      dateTo, 
      status,
      page = 1, 
      limit = 50,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;
    
    // Permission check: student can only view their own
    if (req.user.role === 'student' && req.user.userId !== id) {
      return res.status(403).json({ error: 'Students can only view their own attendance' });
    }
    
    // Verify student exists
    const student = await User.findById(id).populate('department');
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    if (student.role !== 'student') {
      return res.status(400).json({ error: 'User is not a student' });
    }
    
    // Build session query
    const sessionQuery = {};
    
    // Date range filter
    if (dateFrom || dateTo) {
      sessionQuery.sessionDate = {};
      if (dateFrom) {
        sessionQuery.sessionDate.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        sessionQuery.sessionDate.$lte = new Date(dateTo);
      }
    }
    
    // Subject filter
    let sessions;
    if (subjectCode) {
      const course = await mongoose.model('Course').findOne({ subjectCode });
      if (course) {
        sessionQuery.course = course._id;
        sessions = await ClassSession.find(sessionQuery).sort({ sessionDate: -1 });
      } else {
        sessions = [];
      }
    } else {
      sessions = await ClassSession.find(sessionQuery).sort({ sessionDate: -1 });
    }
    
    // Build attendance query
    const attendanceQuery = {
      student: id,
      session: { $in: sessions.map(s => s._id) }
    };
    
    // Status filter
    if (status) {
      attendanceQuery.status = status;
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get attendance records
    const [attendanceRecords, total] = await Promise.all([
      Attendance.find(attendanceQuery)
        .populate({
          path: 'session',
          populate: [
            { path: 'course', select: 'subjectCode subjectName' }
          ]
        })
        .populate('markedBy', 'name email role')
        .sort({ 
          [sortBy === 'date' ? 'markedAt' : sortBy]: sortOrder === 'asc' ? 1 : -1 
        })
        .skip(skip)
        .limit(parseInt(limit)),
      Attendance.countDocuments(attendanceQuery)
    ]);
    
    // Format response
    const history = attendanceRecords.map(record => ({
      id: record._id,
      date: record.session?.sessionDate,
      subjectCode: record.session?.course?.subjectCode,
      subjectName: record.session?.course?.subjectName,
      status: record.status,
      markedBy: record.markedBy?.name,
      markedByRole: record.markedBy?.role,
      markedAt: record.markedAt,
      sessionTime: record.session?.startTime && record.session?.endTime
        ? `${record.session.startTime} - ${record.session.endTime}`
        : null
    }));
    
    res.json({
      student: {
        id: student._id,
        name: student.name,
        rollNo: student.rollNo,
        department: student.department?.name,
        yearOfStudy: student.yearOfStudy,
        section: student.section
      },
      history,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      filters: {
        subjectCode,
        dateFrom,
        dateTo,
        status,
        sortBy,
        sortOrder
      }
    });
    
  } catch (error) {
    console.error('Error getting attendance history:', error);
    next(error);
  }
};

/**
 * Export attendance history as CSV
 * GET /students/:id/attendance/export
 * Permissions: student (self), teacher (assigned), hod, admin, principal
 */
exports.exportAttendanceHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { subjectCode, dateFrom, dateTo } = req.query;
    
    // Permission check
    if (req.user.role === 'student' && req.user.userId !== id) {
      return res.status(403).json({ error: 'Students can only export their own attendance' });
    }
    
    // Verify student
    const student = await User.findById(id).populate('department');
    if (!student || student.role !== 'student') {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // Build query (similar to history endpoint)
    const sessionQuery = {};
    if (dateFrom || dateTo) {
      sessionQuery.sessionDate = {};
      if (dateFrom) sessionQuery.sessionDate.$gte = new Date(dateFrom);
      if (dateTo) sessionQuery.sessionDate.$lte = new Date(dateTo);
    }
    
    let sessions;
    if (subjectCode) {
      const course = await mongoose.model('Course').findOne({ subjectCode });
      if (course) {
        sessionQuery.course = course._id;
        sessions = await ClassSession.find(sessionQuery).sort({ sessionDate: -1 });
      } else {
        sessions = [];
      }
    } else {
      sessions = await ClassSession.find(sessionQuery).sort({ sessionDate: -1 });
    }
    
    const attendanceRecords = await Attendance.find({
      student: id,
      session: { $in: sessions.map(s => s._id) }
    })
      .populate({
        path: 'session',
        populate: { path: 'course', select: 'subjectCode subjectName' }
      })
      .populate('markedBy', 'name')
      .sort({ markedAt: -1 });
    
    // Generate CSV
    const csvRows = [
      ['Date', 'Subject Code', 'Subject Name', 'Status', 'Marked By', 'Marked At']
    ];
    
    attendanceRecords.forEach(record => {
      csvRows.push([
        record.session?.sessionDate?.toISOString().split('T')[0] || '',
        record.session?.course?.subjectCode || '',
        record.session?.course?.subjectName || '',
        record.status,
        record.markedBy?.name || '',
        record.markedAt?.toISOString() || ''
      ]);
    });
    
    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="attendance_${student.rollNo}_${Date.now()}.csv"`);
    res.send(csvContent);
    
  } catch (error) {
    console.error('Error exporting attendance:', error);
    next(error);
  }
};

module.exports = {
  getAttendanceSummary: exports.getAttendanceSummary,
  getAttendanceHistory: exports.getAttendanceHistory,
  exportAttendanceHistory: exports.exportAttendanceHistory
};

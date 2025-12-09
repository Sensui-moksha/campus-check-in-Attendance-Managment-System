const Attendance = require('../models/Attendance');
const ClassSession = require('../models/ClassSession');
const User = require('../models/User');
const Course = require('../models/Course');
const Subject = require('../models/Subject');
const Section = require('../models/Section');
const Department = require('../models/Department');
const mongoose = require('mongoose');

/**
 * Bulk mark/upsert attendance for a session
 */
exports.bulkMarkAttendance = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { records, batchYear, yearOfStudy, semester, academicYear } = req.body;

    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Records array required' });
    }

    const session = await ClassSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Bulk upsert attendance records
    const bulkOps = records.map(record => ({
      updateOne: {
        filter: { session: sessionId, student: record.studentId },
        update: {
          $set: {
            status: record.status,
            markedBy: req.user.userId,
            markedAt: new Date()
          }
        },
        upsert: true
      }
    }));

    await Attendance.bulkWrite(bulkOps);

    res.json({ ok: true, count: records.length });
  } catch (error) {
    next(error);
  }
};

/**
 * Get attendance for a course by period (day/week/month)
 */
exports.getCourseAttendanceByPeriod = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { period, date, year, semester, batchYear } = req.query;

    if (!period || !date) {
      return res.status(400).json({ error: 'Period and date required' });
    }

    const course = await Course.findById(courseId)
      .populate('department')
      .lean();

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Calculate period range
    const refDate = new Date(date);
    let periodStart, periodEnd;

    if (period === 'day') {
      periodStart = new Date(refDate.setHours(0, 0, 0, 0));
      periodEnd = new Date(refDate.setHours(23, 59, 59, 999));
    } else if (period === 'week') {
      const dayOfWeek = refDate.getDay();
      const diff = refDate.getDate() - dayOfWeek;
      periodStart = new Date(refDate.setDate(diff));
      periodStart.setHours(0, 0, 0, 0);
      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodEnd.getDate() + 6);
      periodEnd.setHours(23, 59, 59, 999);
    } else if (period === 'month') {
      periodStart = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
      periodEnd = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0);
      periodEnd.setHours(23, 59, 59, 999);
    }

    // Find sessions in period
    const sessions = await ClassSession.find({
      course: courseId,
      sessionDate: { $gte: periodStart, $lte: periodEnd },
      cancelled: false
    }).lean();

    if (sessions.length === 0) {
      return res.json({
        course,
        period,
        periodRange: { from: periodStart, to: periodEnd },
        summary: { attended: 0, total: 0, attendancePct: 0 },
        attendanceRows: []
      });
    }

    // Get attendance records for these sessions
    const attendances = await Attendance.find({
      session: { $in: sessions.map(s => s._id) }
    })
      .populate('student', 'name rollNo')
      .populate('markedBy', 'name')
      .lean();

    // Compute summary
    const presented = attendances.filter(a => a.status === 'present').length;
    const total = attendances.length;
    const attendancePct = total > 0 ? ((presented / total) * 100).toFixed(2) : 0;

    res.json({
      course,
      period,
      periodRange: { from: periodStart, to: periodEnd },
      summary: { attended: presented, total, attendancePct },
      attendanceRows: attendances
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get student attendance overview (per-course percentages)
 * Updated to support both legacy courses and new subject-based system
 */
exports.getStudentAttendanceOverview = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    const student = await User.findById(studentId)
      .populate('department')
      .lean();

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // If student has a section, find the section document to link courses properly
    let sectionId = null;
    if (student.section) {
      const Section = require('../models/Section');
      const sectionDoc = await Section.findOne({
        department: student.department?._id,
        name: student.section,
        yearOfStudy: student.yearOfStudy
      }).lean();
      
      if (sectionDoc) {
        sectionId = sectionDoc._id;
      }
    }

    // Get all courses for this student's section and year
    const courseQuery = {
      yearOfStudy: student.yearOfStudy,
      department: student.department?._id
    };
    
    if (student.semester) {
      courseQuery.semester = student.semester;
    }

    // CRITICAL: Filter by section if student has one
    if (sectionId) {
      courseQuery.section = sectionId;
    }

    const allCourses = await Course.find(courseQuery).lean();
    
    if (allCourses.length === 0) {
      return res.json({
        student: { id: student._id, name: student.name, rollNo: student.rollNo },
        overview: [],
        overall: { attended: 0, total: 0, percentage: 0 }
      });
    }

    // Get attendance records for this student
    const attendanceRecords = await Attendance.find({ student: studentId })
      .populate({
        path: 'session',
        populate: [
          { path: 'course', select: 'name code subject', populate: { path: 'subject', select: 'name code numberOfClasses' } }
        ]
      })
      .lean();

    // Populate subject for courses to get numberOfClasses
    const coursesWithSubjects = await Course.populate(allCourses, {
      path: 'subject',
      select: 'name code numberOfClasses'
    });

    // For each course, get total sessions and student's attendance
    const overviewData = await Promise.all(
      coursesWithSubjects.map(async course => {
        // Use subject's numberOfClasses if available, otherwise count scheduled sessions
        const subjectTotalClasses = course.subject?.numberOfClasses;
        const scheduledSessions = await ClassSession.countDocuments({
          course: course._id,
          cancelled: false
        });
        
        // Prefer subject's configured total classes, fallback to scheduled sessions
        const totalClasses = subjectTotalClasses || scheduledSessions;

        // Get student's attendance records for this course
        const courseAttendances = attendanceRecords.filter(r => 
          r.session?.course?._id?.toString() === course._id.toString()
        );

        const attended = courseAttendances.filter(r => 
          r.status === 'present' || r.status === 'late'
        ).length;

        const percentage = totalClasses > 0 ? ((attended / totalClasses) * 100).toFixed(2) : 0;

        return {
          courseId: course._id,
          subjectId: course.subject?._id || course._id,
          course: course.name,
          subject: course.subject?.name || course.name,
          attended,
          total: totalClasses,
          percentage
        };
      })
    );

    const totalAttendances = overviewData.reduce((sum, o) => sum + o.total, 0);
    const totalPresent = overviewData.reduce((sum, o) => sum + o.attended, 0);
    const overallPercentage = totalAttendances > 0 ? ((totalPresent / totalAttendances) * 100).toFixed(2) : 0;

    return res.json({
      student: { id: student._id, name: student.name, rollNo: student.rollNo },
      overview: overviewData,
      overall: { attended: totalPresent, total: totalAttendances, percentage: overallPercentage }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get student attendance history with optional filters
 * Updated to support both legacy courses and new subject-based system
 */
exports.getStudentAttendanceHistory = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { from, to, courseId, academicYear } = req.query;

    const query = { student: studentId };

    if (courseId) {
      const sessions = await ClassSession.find({ course: courseId }).select('_id');
      query.session = { $in: sessions.map(s => s._id) };
    }

    // Date range filter if provided
    if (from || to) {
      query.markedAt = {};
      if (from) query.markedAt.$gte = new Date(from);
      if (to) query.markedAt.$lte = new Date(to);
    }

    const history = await Attendance.find(query)
      .populate({
        path: 'session',
        populate: ['course']
      })
      .populate('markedBy', 'name')
      .sort({ markedAt: -1 })
      .lean();

    // Format response with proper course names
    const formattedHistory = history.map(record => ({
      _id: record._id,
      sessionDate: record.session?.sessionDate || record.markedAt,
      courseId: record.session?.course?._id,
      courseName: record.session?.course?.name || 'Unknown Course',
      courseCode: record.session?.course?.code || 'N/A',
      status: record.status,
      markedBy: record.markedBy?.name || 'System',
      markedAt: record.markedAt
    }));

    res.json({ history: formattedHistory });
  } catch (error) {
    next(error);
  }
};

/**
 * Get attendance marking history across sessions (who marked attendance by date/section/year)
 * Query params: departmentId?, sectionId?, year?, from?, to?
 * Roles: teacher, hod, admin, principal
 */
exports.getAttendanceHistoryAll = async (req, res, next) => {
  try {
    const { departmentId, sectionId, year, from, to } = req.query;

    const startDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = to ? new Date(to) : new Date();

    const sessionQuery = {
      sessionDate: { $gte: startDate, $lte: endDate }
    };

    // Pull sessions with course context
    const sessions = await ClassSession.find(sessionQuery)
      .populate({
        path: 'course',
        select: 'name code department yearOfStudy section',
        populate: [
          { path: 'department', select: 'name code' },
          { path: 'section', select: 'name yearOfStudy department' }
        ]
      })
      .lean();

    // Apply department/section/year filters after populate (simpler than aggregation here)
    const filteredSessions = sessions.filter(s => {
      const course = s.course || {};
      const deptOk = departmentId ? course.department?._id?.toString() === departmentId : true;
      const sectionOk = sectionId ? course.section?._id?.toString() === sectionId : true;
      const yearOk = year ? course.yearOfStudy === Number(year) || course.section?.yearOfStudy === Number(year) : true;
      return deptOk && sectionOk && yearOk;
    });

    const sessionIds = filteredSessions.map(s => s._id);

    if (sessionIds.length === 0) {
      return res.json({ history: [], total: 0 });
    }

    const records = await Attendance.find({ session: { $in: sessionIds } })
      .populate({
        path: 'session',
        populate: {
          path: 'course',
          select: 'name code department yearOfStudy section',
          populate: [
            { path: 'department', select: 'name code' },
            { path: 'section', select: 'name yearOfStudy department' }
          ]
        }
      })
      .populate('markedBy', 'name role email')
      .sort({ markedAt: -1 })
      .lean();

    const historyMap = new Map();

    records.forEach(rec => {
      const sessionId = rec.session?._id?.toString();
      if (!sessionId) return;
      const existing = historyMap.get(sessionId) || {
        sessionId,
        date: rec.session?.sessionDate,
        courseName: rec.session?.course?.name,
        courseCode: rec.session?.course?.code,
        yearOfStudy: rec.session?.course?.yearOfStudy,
        section: rec.session?.course?.section ? {
          id: rec.session.course.section._id,
          name: rec.session.course.section.name,
          yearOfStudy: rec.session.course.section.yearOfStudy
        } : null,
        department: rec.session?.course?.department ? {
          id: rec.session.course.department._id,
          name: rec.session.course.department.name,
          code: rec.session.course.department.code
        } : null,
        markedBy: rec.markedBy ? {
          id: rec.markedBy._id,
          name: rec.markedBy.name,
          role: rec.markedBy.role
        } : null,
        markedAt: rec.markedAt,
        counts: { present: 0, absent: 0, late: 0, leave: 0, total: 0 }
      };

      existing.counts.total += 1;
      if (rec.status && existing.counts[rec.status] !== undefined) {
        existing.counts[rec.status] += 1;
      }

      // If markedBy missing earlier, fill it from another record in the same session
      if (!existing.markedBy && rec.markedBy) {
        existing.markedBy = {
          id: rec.markedBy._id,
          name: rec.markedBy.name,
          role: rec.markedBy.role
        };
        existing.markedAt = rec.markedAt;
      }

      historyMap.set(sessionId, existing);
    });

    const history = Array.from(historyMap.values()).sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({ history, total: history.length });
  } catch (error) {
    console.error('Error getting attendance history:', error);
    next(error);
  }
};

/**
 * Get monthly attendance for a user
 * GET /api/users/:userId/attendance?month=YYYY-MM
 * 
 * Returns calendar view of attendance for a specific month
 */
exports.getMonthlyAttendance = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { month } = req.query; // Format: YYYY-MM

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ 
        error: 'month parameter required in YYYY-MM format' 
      });
    }

    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59); // Last day of month

    // Find sessions within the month
    const sessionsInMonth = await ClassSession.find({
      sessionDate: { $gte: startDate, $lte: endDate },
    })
      .select('_id sessionDate course')
      .populate({ 
        path: 'course', 
        select: 'name code subject',
        populate: { path: 'subject', select: 'name code' }
      })
      .lean();

    const sessionIds = sessionsInMonth.map(s => s._id);

    // Fetch attendance records for this student within these sessions
    const records = await Attendance.find({
      student: userId,
      session: { $in: sessionIds },
    })
      .populate({
        path: 'session',
        populate: { 
          path: 'course', 
          select: 'name code subject',
          populate: { path: 'subject', select: 'name code' }
        },
      })
      .populate({
        path: 'markedBy',
        select: 'name email role'
      })
      .sort({ markedAt: 1 })
      .lean();

    // Calculate working days (exclude Sundays)
    const daysInMonth = endDate.getDate();
    let workingDays = 0;
    const calendar = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthNum - 1, day);
      const dayOfWeek = date.getDay();
      const isSunday = dayOfWeek === 0;

      if (!isSunday) {
        workingDays++;
      }

      // Find attendance records for this day (use sessionDate from populated session)
      const dayRecords = records.filter(r => {
        const recDate = new Date(r.session?.sessionDate || r.markedAt);
        return recDate.getDate() === day;
      });

      calendar.push({
        date: date.toISOString().split('T')[0], // YYYY-MM-DD
        dayOfWeek,
        isSunday,
        isWorkingDay: !isSunday,
        sessions: dayRecords.map(r => ({
          _id: r._id,
          status: r.status,
          session: r.session,
          markedBy: r.markedBy,
          markedAt: r.markedAt
        }))
      });
    }

    // Calculate attendance stats
    const totalSessions = records.length;
    const presentCount = records.filter(r => r.status === 'present' || r.status === 'late').length;
    const absentCount = records.filter(r => r.status === 'absent').length;
    const leaveCount = records.filter(r => r.status === 'leave').length;

    const attendancePercent = totalSessions > 0 
      ? ((presentCount / totalSessions) * 100).toFixed(2)
      : null;

    res.json({
      userId,
      month,
      workingDays,
      totalDays: daysInMonth,
      calendar,
      stats: {
        totalSessions,
        present: presentCount,
        absent: absentCount,
        leave: leaveCount,
        attendancePercent
      }
    });

  } catch (error) {
    console.error('Error in getMonthlyAttendance:', error);
    next(error);
  }
};

/**
 * Mark attendance for a subject-section combination
 * Creates/finds session and marks attendance
 */
exports.markSubjectAttendance = async (req, res, next) => {
  try {
    const { subjectId, sectionId, departmentId, date, records } = req.body;
    const teacherId = req.user.userId;

    console.log('📥 Received attendance submission:', {
      subjectId,
      sectionId,
      departmentId,
      date,
      recordsCount: records?.length,
      teacherId
    });

    if (!subjectId || !sectionId || !departmentId || !date || !records || !Array.isArray(records)) {
      console.log('❌ Validation failed - missing required fields');
      return res.status(400).json({ 
        error: 'subjectId, sectionId, departmentId, date, and records array required',
        received: { subjectId, sectionId, departmentId, date, recordsCount: records?.length }
      });
    }

    // Verify subject and section exist
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    const section = await Section.findById(sectionId);
    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    // Ensure the requested section is actually linked to the subject
    const sectionIsLinked = subject.sectionAssignments.some(
      assignment => assignment.section.toString() === sectionId
    );
    if (!sectionIsLinked) {
      return res.status(400).json({ error: 'Section is not assigned to this subject' });
    }

    // Permission: allow the assigned teacher OR any teacher working in this department (for coverage when primary teacher is absent)
    const teacher = await User.findById(teacherId).select('role department workingDepartments');
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const allowedDepartments = [teacher.department, ...(teacher.workingDepartments || [])]
      .filter(Boolean)
      .map(id => id.toString());

    const isDeptTeacher = allowedDepartments.includes(departmentId.toString());
    const isAssignedTeacher = subject.sectionAssignments.some(
      assignment => assignment.section.toString() === sectionId && assignment.teacher?.toString() === teacherId
    );

    if (req.user.role === 'teacher' && !isDeptTeacher && !isAssignedTeacher) {
      return res.status(403).json({ 
        error: 'You are not allowed to mark attendance for this department/section' 
      });
    }

    // Get department info for course code generation
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    const courseCode = `${department.code}-${subject.code}-${section.name}`;
    
    // Try to find course by multiple criteria (most specific to least specific)
    let course = await Course.findOne({
      subject: subjectId,
      section: sectionId,
      department: departmentId
    });

    // If not found by subject+section+dept, try by code (handles legacy courses)
    if (!course) {
      console.log('🔍 Course not found by subject/section/dept, trying by code:', courseCode);
      course = await Course.findOne({
        code: courseCode,
        department: departmentId
      });
    }

    console.log('🔍 Course lookup result:', course ? `Found (${course._id})` : 'Not found');

    if (!course) {
      console.log('📝 Creating new course with code:', courseCode);
      
      try {
        course = new Course({
          subject: subjectId,
          section: sectionId,
          department: departmentId,
          code: courseCode,
          name: `${subject.name} - Section ${section.name}`,
          teacher: teacherId,
          yearOfStudy: subject.yearOfStudy,
          semester: subject.semester
        });
        await course.save();
        console.log('✅ Course created successfully:', course._id);
      } catch (courseError) {
        // If duplicate key error, fetch the existing course by code
        if (courseError.code === 11000) {
          console.log('⚠️ Course already exists (duplicate key), fetching by code...');
          
          // Wait a moment and try again (handles race conditions)
          await new Promise(resolve => setTimeout(resolve, 100));
          
          course = await Course.findOne({
            code: courseCode,
            department: departmentId
          });
          
          if (!course) {
            // Try one more time with just the code
            course = await Course.findOne({ code: courseCode });
          }
          
          if (course) {
            console.log('✅ Found existing course by code:', course._id);
          } else {
            console.error('❌ Failed to find existing course');
            console.error('Search criteria:', { code: courseCode, departmentId });
            return res.status(500).json({ 
              error: 'Course creation failed and could not retrieve existing course. Please try again.' 
            });
          }
        } else {
          throw courseError;
        }
      }
    }

    // Create or find session
    const sessionDate = new Date(date);
    sessionDate.setHours(0, 0, 0, 0);

    let session = await ClassSession.findOne({
      course: course._id,
      sessionDate: sessionDate
    });

    if (!session) {
      session = new ClassSession({
        course: course._id,
        sessionDate: sessionDate,
        academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
        yearOfStudy: subject.yearOfStudy,
        semester: subject.semester,
        createdBy: teacherId
      });
      await session.save();
    }

    // Bulk upsert attendance records
    // If status is not provided, mark as 'on hold' (pending)
    const bulkOps = records.map(record => ({
      updateOne: {
        filter: { 
          session: session._id, 
          student: record.studentId 
        },
        update: {
          $set: {
            status: record.status || 'on hold', // Default to 'on hold' if no status provided
            subject: subjectId,
            department: departmentId,
            date: sessionDate,
            yearOfStudy: subject.yearOfStudy,
            section: section.name,
            markedBy: teacherId,
            markedAt: new Date()
          }
        },
        upsert: true
      }
    }));

    await Attendance.bulkWrite(bulkOps);

    res.json({ 
      ok: true, 
      count: records.length,
      sessionId: session._id,
      courseId: course._id
    });
  } catch (error) {
    console.error('Error marking subject attendance:', error);
    next(error);
  }
};

/**
 * Get attendance for a subject-section by period
 */
exports.getSubjectAttendance = async (req, res, next) => {
  try {
    const { subjectId, sectionId, departmentId, period, date } = req.query;

    if (!subjectId || !sectionId || !departmentId || !period || !date) {
      return res.status(400).json({ 
        error: 'subjectId, sectionId, departmentId, period, and date required' 
      });
    }

    const subject = await Subject.findById(subjectId)
      .select('code name yearOfStudy semester');
    
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    const section = await Section.findById(sectionId)
      .select('name');
    
    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    // Find course for this subject-section
    let course = await Course.findOne({
      subject: subjectId,
      section: sectionId,
      department: departmentId
    });

    // Try alternate lookup if not found (same as mark attendance logic)
    if (!course) {
      const department = await Department.findById(departmentId);
      if (department) {
        const courseCode = `${department.code}-${subject.code}-${section.name}`;
        course = await Course.findOne({
          code: courseCode,
          department: departmentId
        });
      }
    }

    if (!course) {
      console.log('⚠️ No course found for subject/section, returning empty attendance');
      return res.json({
        subject,
        section,
        period,
        periodRange: { from: date, to: date },
        summary: { attended: 0, total: 0, attendancePct: 0 },
        attendanceRows: []
      });
    }
    
    console.log('✅ Found course for attendance retrieval:', course._id);

    // Calculate period range
    const refDate = new Date(date);
    let periodStart, periodEnd;

    if (period === 'day') {
      periodStart = new Date(refDate.setHours(0, 0, 0, 0));
      periodEnd = new Date(refDate.setHours(23, 59, 59, 999));
    } else if (period === 'week') {
      const dayOfWeek = refDate.getDay();
      const diff = refDate.getDate() - dayOfWeek;
      periodStart = new Date(refDate.setDate(diff));
      periodStart.setHours(0, 0, 0, 0);
      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodEnd.getDate() + 6);
      periodEnd.setHours(23, 59, 59, 999);
    } else if (period === 'month') {
      periodStart = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
      periodEnd = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0);
      periodEnd.setHours(23, 59, 59, 999);
    }

    // Find sessions in period
    const sessions = await ClassSession.find({
      course: course._id,
      sessionDate: { $gte: periodStart, $lte: periodEnd },
      cancelled: false
    }).lean();

    if (sessions.length === 0) {
      return res.json({
        subject,
        section,
        period,
        periodRange: { from: periodStart, to: periodEnd },
        summary: { attended: 0, total: 0, attendancePct: 0 },
        attendanceRows: []
      });
    }

    const sessionIds = sessions.map(s => s._id);

    // Get all attendance records for these sessions
    const records = await Attendance.find({
      session: { $in: sessionIds }
    })
      .populate('student', 'name rollNo email')
      .populate('markedBy', 'name')
      .lean();

    // Group by student
    const studentMap = {};
    records.forEach(record => {
      const studentId = record.student._id.toString();
      if (!studentMap[studentId]) {
        studentMap[studentId] = {
          studentId: record.student._id,
          name: record.student.name,
          rollNo: record.student.rollNo,
          email: record.student.email,
          attended: 0,
          total: sessions.length,
          records: []
        };
      }
      if (record.status === 'present' || record.status === 'late') {
        studentMap[studentId].attended += 1;
      }
      studentMap[studentId].records.push({
        date: record.session,
        status: record.status,
        markedBy: record.markedBy?.name,
        markedAt: record.markedAt
      });
    });

    const attendanceRows = Object.values(studentMap).map(row => ({
      ...row,
      percentage: row.total > 0 ? ((row.attended / row.total) * 100).toFixed(2) : 0
    }));

    // Calculate summary
    const totalAttended = attendanceRows.reduce((sum, row) => sum + row.attended, 0);
    const totalSessions = attendanceRows.reduce((sum, row) => sum + row.total, 0);

    res.json({
      subject,
      section,
      period,
      periodRange: { from: periodStart, to: periodEnd },
      summary: {
        attended: totalAttended,
        total: totalSessions,
        attendancePct: totalSessions > 0 ? ((totalAttended / totalSessions) * 100).toFixed(2) : 0
      },
      attendanceRows
    });
  } catch (error) {
    console.error('Error getting subject attendance:', error);
    next(error);
  }
};

/**
 * Get student attendance overview (now supports both courses and subjects)
 * Returns overall and per-subject/course attendance
 */
exports.getStudentAttendanceOverviewV2 = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    const student = await User.findById(studentId)
      .populate('department')
      .lean();

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get all sessions where this student has attendance records
    const attendanceRecords = await Attendance.find({ student: studentId })
      .populate({
        path: 'session',
        populate: [
          { path: 'course', select: 'name code subject' }
        ]
      })
      .lean();

    if (attendanceRecords.length === 0) {
      return res.json({
        student: { id: student._id, name: student.name, rollNo: student.rollNo },
        overview: [],
        overall: { attended: 0, total: 0, percentage: 0 }
      });
    }

    // Group by course/subject
    const subjectMap = {};
    const courseMap = {};

    attendanceRecords.forEach(record => {
      if (record.session?.course) {
        const courseName = record.session.course.name || 'Unknown Course';
        const courseId = record.session.course._id;

        if (!courseMap[courseId]) {
          courseMap[courseId] = {
            courseId,
            course: courseName,
            attended: 0,
            total: 0
          };
        }

        courseMap[courseId].total += 1;
        if (record.status === 'present' || record.status === 'late') {
          courseMap[courseId].attended += 1;
        }
      }
    });

    // Convert to array and calculate percentages
    const overviewData = Object.values(courseMap).map((data) => ({
      ...data,
      percentage: data.total > 0 ? ((data.attended / data.total) * 100).toFixed(2) : 0
    }));

    // Calculate totals
    const totalAttendances = overviewData.reduce((sum, o) => sum + o.total, 0);
    const totalPresent = overviewData.reduce((sum, o) => sum + o.attended, 0);
    const overallPercentage = totalAttendances > 0 ? ((totalPresent / totalAttendances) * 100).toFixed(2) : 0;

    res.json({
      student: { id: student._id, name: student.name, rollNo: student.rollNo },
      overview: overviewData,
      overall: { attended: totalPresent, total: totalAttendances, percentage: overallPercentage }
    });
  } catch (error) {
    console.error('Error getting student overview v2:', error);
    next(error);
  }
};

/**
 * Get student attendance history (supports both courses and subjects)
 */
exports.getStudentAttendanceHistoryV2 = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { from, to, courseId } = req.query;

    const query = { student: studentId };

    if (courseId) {
      const sessions = await ClassSession.find({ course: courseId }).select('_id');
      query.session = { $in: sessions.map(s => s._id) };
    }

    // Date range filter
    if (from || to) {
      query.markedAt = {};
      if (from) query.markedAt.$gte = new Date(from);
      if (to) query.markedAt.$lte = new Date(to);
    }

    const history = await Attendance.find(query)
      .populate({
        path: 'session',
        populate: [
          { path: 'course', select: 'name code' }
        ]
      })
      .populate('markedBy', 'name')
      .sort({ markedAt: -1 })
      .lean();

    // Format the response
    const formattedHistory = history.map(record => ({
      _id: record._id,
      date: record.markedAt,
      sessionDate: record.session?.sessionDate,
      courseName: record.session?.course?.name || 'Unknown Course',
      status: record.status,
      markedBy: record.markedBy?.name || 'System',
      markedAt: record.markedAt
    }));

    res.json({ history: formattedHistory });
  } catch (error) {
    console.error('Error getting student history v2:', error);
    next(error);
  }
};

/**
 * Get detailed attendance records for a specific session
 */
exports.getSessionDetails = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    // Get all attendance records for this session
    const records = await Attendance.find({ session: sessionId })
      .populate('student', 'name rollNo email')
      .sort({ 'student.rollNo': 1 })
      .lean();

    res.json({ records });
  } catch (error) {
    console.error('Error getting session details:', error);
    next(error);
  }
};

/**
 * Update attendance records for a specific session
 */
exports.updateSessionAttendance = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { records } = req.body;
    const teacherId = req.user.userId;

    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'records array is required' });
    }

    // Update each record
    const bulkOps = records.map(record => ({
      updateOne: {
        filter: { 
          session: sessionId, 
          student: record.studentId 
        },
        update: {
          $set: {
            status: record.status,
            markedBy: teacherId,
            markedAt: new Date()
          }
        }
      }
    }));

    await Attendance.bulkWrite(bulkOps);

    res.json({ ok: true, updated: records.length });
  } catch (error) {
    console.error('Error updating session attendance:', error);
    next(error);
  }
};

/**
 * Mark attendance using new semester-based schema
 * POST /api/attendance/mark-v2
 */
exports.markAttendanceV2 = async (req, res, next) => {
  try {
    const { subjectId, departmentId, yearOfStudy, section, date, records, semesterId } = req.body;
    const markedBy = req.user._id || req.user.userId;

    // Validation
    if (!subjectId || !departmentId || !yearOfStudy || !section || !date || !records || !Array.isArray(records)) {
      return res.status(400).json({ 
        error: 'subjectId, departmentId, yearOfStudy, section, date, and records array required'
      });
    }

    // Verify subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    // Verify department exists
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    // Prepare bulk operations
    const bulkOps = records.map(record => ({
      updateOne: {
        filter: { 
          student: record.studentId, 
          subject: subjectId, 
          date: new Date(date),
          department: departmentId,
          yearOfStudy: yearOfStudy,
          section: section
        },
        update: { 
          $set: {
            status: record.status,
            markedBy: markedBy,
            markedAt: new Date(),
            semester: semesterId || null
          },
          $setOnInsert: {
            student: record.studentId,
            subject: subjectId,
            department: departmentId,
            yearOfStudy: yearOfStudy,
            section: section,
            date: new Date(date)
          }
        },
        upsert: true
      }
    }));

    await Attendance.bulkWrite(bulkOps);

    res.json({ 
      success: true, 
      message: 'Attendance marked successfully',
      markedCount: records.length 
    });
  } catch (error) {
    console.error('Error marking attendance V2:', error);
    res.status(500).json({ 
      error: 'Failed to mark attendance',
      details: error.message 
    });
  }
};

/**
 * Get attendance by subject, date, and class
 * GET /api/attendance/by-class?subjectId=&departmentId=&year=&section=&date=
 */
exports.getAttendanceByClass = async (req, res, next) => {
  try {
    const { subjectId, departmentId, year, section, date, semesterId } = req.query;

    const filter = {};
    if (subjectId) filter.subject = subjectId;
    if (departmentId) filter.department = departmentId;
    if (year) filter.yearOfStudy = parseInt(year);
    if (section) filter.section = section;
    if (date) filter.date = new Date(date);
    if (semesterId) filter.semester = semesterId;

    const attendance = await Attendance.find(filter)
      .populate('student', 'name email enrollmentNumber')
      .populate('subject', 'name code')
      .populate('markedBy', 'name')
      .sort({ date: -1, 'student.name': 1 });

    res.json({
      success: true,
      count: attendance.length,
      attendance
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ 
      error: 'Failed to fetch attendance',
      details: error.message 
    });
  }
};

const Course = require('../models/Course');
const Subject = require('../models/Subject');
const ClassSession = require('../models/ClassSession');
const Attendance = require('../models/Attendance');
const { writeAudit } = require('../utils/audit');
const exporter = require('../utils/exporter');

/**
 * Exports Controller
 * Generates CSV, XLSX, PDF exports of attendance data
 */

/**
 * Export course attendance as CSV/XLSX/PDF
 * GET /api/exports/course/:courseId?format=csv&period=month&date=YYYY-MM-DD
 */
const exportCourseAttendance = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { format = 'csv', period, date } = req.query;

    if (!['csv', 'xlsx', 'pdf'].includes(format)) {
      return res.status(400).json({ error: 'Invalid format. Use csv, xlsx, or pdf' });
    }

    // Verify course exists
    const course = await Course.findById(courseId).populate('department');
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Build date filter
    const sessionFilter = { course: courseId };
    if (date && period) {
      const startDate = new Date(date);
      const endDate = new Date(startDate);

      if (period === 'day') {
        endDate.setDate(endDate.getDate() + 1);
      } else if (period === 'week') {
        endDate.setDate(endDate.getDate() + 7);
      } else if (period === 'month') {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      sessionFilter.sessionDate = {
        $gte: startDate,
        $lt: endDate,
      };
    }

    // Get sessions and attendances
    const sessions = await ClassSession.find(sessionFilter)
      .populate('course')
      .sort({ sessionDate: -1 });

    const sessionIds = sessions.map(s => s._id);
    const attendances = await Attendance.find({ session: { $in: sessionIds } })
      .populate('student', 'name email rollNo _id')
      .populate('markedBy', 'name role')
      .lean();

    // Fetch subject to get configured total classes (from Manage Subjects)
    const subject = await Subject.findOne({ code: course.code, isActive: true }).lean();
    const subjectTotalClasses = subject?.numberOfClasses || undefined;

    // Build student stats from all attendance records for this course
    const studentStats = {};
    attendances.forEach(att => {
      const studentId = att.student?._id?.toString();
      if (studentId) {
        if (!studentStats[studentId]) {
          studentStats[studentId] = { attended: 0, total: 0 };
        }
        studentStats[studentId].total += 1;
        if (att.status === 'present' || att.status === 'late') {
          studentStats[studentId].attended += 1;
        }
      }
    });

    // Get the marked by role from the first attendance record or user role
    const markedByRole = req.user?.role?.toUpperCase() || 'UNKNOWN';

    // Format data with updated structure
    const formattedData = exporter.formatAttendanceForExport(
      attendances.map(att => ({
        ...att,
        session: sessions.find(s => s._id.toString() === att.session.toString()),
        totalClasses: subjectTotalClasses,
      })),
      studentStats,
      markedByRole
    );

    // Generate file
    const filename = `${course.code}_attendance_${new Date().getTime()}`;
    let buffer, contentType;

    if (format === 'csv') {
      const csv = exporter.generateCSVString(formattedData);
      buffer = Buffer.from(csv);
      contentType = 'text/csv';
    } else if (format === 'xlsx') {
      buffer = await exporter.generateXLSXBuffer(
        formattedData,
        `${course.code} Attendance`
      );
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else if (format === 'pdf') {
      buffer = await exporter.generatePDFBuffer(
        formattedData,
        `${course.name} - Attendance Report`
      );
      contentType = 'application/pdf';
    }

    // Write audit
    await writeAudit({
      actorId: req.user.id,
      action: 'EXPORT_COURSE',
      targetCollection: 'course',
      targetId: courseId,
      meta: {
        format,
        period: period || 'all',
        date: date || 'all',
        recordCount: formattedData.length,
        sessionCount: sessions.length,
      },
    });

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}.${format}"`,
      'X-Total-Records': formattedData.length.toString(),
    });

    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Export college-wide attendance report
 * GET /api/exports/college?format=csv&from=YYYY-MM-DD&to=YYYY-MM-DD
 */
const exportCollegeAttendance = async (req, res, next) => {
  try {
    const { format = 'csv', from, to } = req.query;

    if (!['csv', 'xlsx', 'pdf'].includes(format)) {
      return res.status(400).json({ error: 'Invalid format' });
    }

    // Build filter
    const sessionFilter = {};
    if (from || to) {
      sessionFilter.sessionDate = {};
      if (from) sessionFilter.sessionDate.$gte = new Date(from);
      if (to) sessionFilter.sessionDate.$lte = new Date(to);
    }

    // Get all data
    const sessions = await ClassSession.find(sessionFilter)
      .populate('course')
      .sort({ sessionDate: -1 });

    const sessionIds = sessions.map(s => s._id);
    const attendances = await Attendance.find({ session: { $in: sessionIds } })
      .populate('student', 'name email rollNo')
      .populate('markedBy', 'name')
      .lean();

    // Build map of course -> subject total classes (using course code)
    const courseCodes = [...new Set(sessions.map(s => s.course?.code).filter(Boolean))];
    const subjects = await Subject.find({ code: { $in: courseCodes }, isActive: true }).lean();
    const totalClassesByCourseId = new Map(
      sessions
        .filter(s => s.course?._id)
        .map(s => [s.course._id.toString(), subjects.find(sub => sub.code === s.course.code)?.numberOfClasses])
    );

    const formattedData = exporter.formatAttendanceForExport(
      attendances.map(att => {
        const session = sessions.find(s => s._id.toString() === att.session.toString());
        const totalClasses = session?.course?._id
          ? totalClassesByCourseId.get(session.course._id.toString())
          : undefined;
        return {
          ...att,
          session,
          totalClasses,
        };
      })
    );

    // Generate file
    const filename = `college_attendance_${new Date().getTime()}`;
    let buffer, contentType;

    if (format === 'csv') {
      const csv = exporter.generateCSVString(formattedData);
      buffer = Buffer.from(csv);
      contentType = 'text/csv';
    } else if (format === 'xlsx') {
      buffer = await exporter.generateXLSXBuffer(formattedData, 'College Attendance');
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else if (format === 'pdf') {
      buffer = await exporter.generatePDFBuffer(formattedData, 'College Attendance Report');
      contentType = 'application/pdf';
    }

    // Audit
    await writeAudit({
      actorId: req.user.id,
      action: 'EXPORT_COLLEGE',
      targetCollection: 'attendance',
      meta: {
        format,
        from: from || 'all',
        to: to || 'all',
        recordCount: formattedData.length,
      },
    });

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}.${format}"`,
    });

    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Export department attendance report
 * GET /api/exports/department/:departmentId?format=csv
 */
const exportDepartmentAttendance = async (req, res, next) => {
  try {
    const { departmentId } = req.params;
    const { format = 'csv', from, to } = req.query;

    // Get courses for department
    const courses = await Course.find({ department: departmentId });
    const courseIds = courses.map(c => c._id);

    // Get sessions
    const sessionFilter = { course: { $in: courseIds } };
    if (from || to) {
      sessionFilter.sessionDate = {};
      if (from) sessionFilter.sessionDate.$gte = new Date(from);
      if (to) sessionFilter.sessionDate.$lte = new Date(to);
    }

    const sessions = await ClassSession.find(sessionFilter);
    const sessionIds = sessions.map(s => s._id);

    // Get attendances
    const attendances = await Attendance.find({ session: { $in: sessionIds } })
      .populate('student', 'name email rollNo')
      .lean();

    const formattedData = exporter.formatAttendanceForExport(
      attendances.map(att => ({
        ...att,
        session: sessions.find(s => s._id.toString() === att.session.toString()),
      }))
    );

    // Generate
    const filename = `department_attendance_${new Date().getTime()}`;
    let buffer, contentType;

    if (format === 'csv') {
      buffer = Buffer.from(exporter.generateCSVString(formattedData));
      contentType = 'text/csv';
    } else if (format === 'xlsx') {
      buffer = await exporter.generateXLSXBuffer(formattedData, 'Department Attendance');
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else {
      buffer = await exporter.generatePDFBuffer(formattedData, 'Department Attendance');
      contentType = 'application/pdf';
    }

    // Audit
    await writeAudit({
      actorId: req.user.id,
      action: 'EXPORT_DEPARTMENT',
      targetCollection: 'attendance',
      targetId: departmentId,
      meta: { format, recordCount: formattedData.length },
    });

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}.${format}"`,
    });

    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Export section-wise attendance summary
 * GET /api/exports/section-wise/:departmentId/:year?format=csv|xlsx|pdf
 * Creates separate files for each section with columns:
 * Roll No, Name, [Subject1 (Present/Total)], [Subject2], ..., Total Classes, Attended, Percentage
 */
const exportSectionWiseAttendance = async (req, res, next) => {
  try {
    const { departmentId, year } = req.params;
    const { format = 'csv' } = req.query;

    console.log('📊 Export Section-Wise Request:', { departmentId, year, format });

    if (!['csv', 'xlsx', 'pdf'].includes(format)) {
      return res.status(400).json({ error: 'Invalid format. Use csv, xlsx, or pdf' });
    }

    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 1 || yearNum > 4) {
      return res.status(400).json({ error: 'Invalid year. Must be 1-4' });
    }

    const Department = require('../models/Department');
    const User = require('../models/User');
    const Section = require('../models/Section');

    // Verify department exists
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    console.log('🏢 Department found:', department.name);

    // Try to get courses first
    let courses = await Course.find({
      department: departmentId,
      yearOfStudy: yearNum,
    }).populate('subject', 'code name').populate('section', 'name').lean();

    console.log('📚 Courses found:', courses.length);

    // If no courses, try using subjects directly
    if (courses.length === 0) {
      console.log('⚠️ No courses found, trying subjects directly...');
      const Subject = require('../models/Subject');
      const subjects = await Subject.find({
        department: departmentId,
        yearOfStudy: yearNum,
        isActive: true,
      }).populate({
        path: 'sectionAssignments.section',
        select: 'name',
      }).lean();

      console.log('📚 Subjects found:', subjects.length);

      if (subjects.length === 0) {
        return res.status(404).json({ error: 'No subjects or courses found for this department and year' });
      }

      // Convert subjects to course-like format for compatibility
      courses = [];
      subjects.forEach(subject => {
        subject.sectionAssignments?.forEach(sa => {
          if (sa.section) {
            courses.push({
              _id: `${subject._id}_${sa.section._id}`,
              code: subject.code,
              name: subject.name,
              subject: {
                code: subject.code,
                name: subject.name,
              },
              section: sa.section,
              department: departmentId,
              yearOfStudy: yearNum,
            });
          }
        });
      });

      console.log('📝 Created virtual courses from subjects:', courses.length);
    }

    if (courses.length === 0) {
      console.log('❌ No data to export');
      return res.status(404).json({ error: 'No courses or subjects found for this department and year' });
    }

    // Get unique sections
    const sectionSet = new Set();
    courses.forEach(course => {
      if (course.section?.name) {
        sectionSet.add(course.section.name);
      }
    });
    const uniqueSections = Array.from(sectionSet).sort();

    console.log('📑 Unique sections:', uniqueSections);

    if (uniqueSections.length === 0) {
      console.log('❌ No sections found in courses');
      return res.status(404).json({ error: 'No sections found for courses' });
    }

    // Get all students for this department and year
    const students = await User.find({
      role: 'student',
      department: departmentId,
      yearOfStudy: yearNum,
    }).select('_id name rollNo section').lean();

    console.log('👥 Students found:', students.length);
    if (students.length > 0) {
      console.log('Sample student:', students[0]);
    }
    // Get real course IDs (filter out virtual ones that are strings)
    const realCourseIds = courses
      .filter(c => typeof c._id === 'object' || !c._id.toString().includes('_'))
      .map(c => c._id);

    // Get subject codes for fallback
    const subjectCodes = courses.map(c => c.subject?.code || c.code).filter(Boolean);

    console.log('🔍 Looking for sessions with courseIds:', realCourseIds.length, 'or subject codes:', subjectCodes);

    // Get all class sessions - try by course ID first, then by subject code
    let sessions = [];
    if (realCourseIds.length > 0) {
      sessions = await ClassSession.find({
        course: { $in: realCourseIds },
      }).lean();
    }

    // If no sessions found by course ID, try finding courses by subject code
    if (sessions.length === 0 && subjectCodes.length > 0) {
      const coursesWithCode = await Course.find({
        code: { $in: subjectCodes },
        department: departmentId,
      }).lean();
      
      if (coursesWithCode.length > 0) {
        const courseIds = coursesWithCode.map(c => c._id);
        sessions = await ClassSession.find({
          course: { $in: courseIds },
        }).lean();
        
        // Update courses array to use the real course IDs
        courses.forEach(c => {
          const realCourse = coursesWithCode.find(rc => rc.code === (c.subject?.code || c.code));
          if (realCourse) {
            c._id = realCourse._id;
          }
        });
      }
    }

    console.log('📅 Sessions found:', sessions.length);

    const sessionIds = sessions.map(s => s._id);

    // Get all attendance records
    const attendances = await Attendance.find({
      session: { $in: sessionIds },
      student: { $in: students.map(s => s._id) },
    }).lean();

    // Build attendance data structure: { sectionName: { studentId: { courseCode: { present, total, name }, totalPresent, totalClasses } } }
    const sectionData = {};

    uniqueSections.forEach(sectionName => {
      sectionData[sectionName] = {};
      
      // Get students in this section
      const sectionStudents = students.filter(s => s.section === sectionName);
      
      // Get courses for this section
      const sectionCourses = courses.filter(c => c.section?.name === sectionName);
      
      sectionStudents.forEach(student => {
        sectionData[sectionName][student._id.toString()] = {
          rollNo: student.rollNo,
          name: student.name,
          subjects: {},
          totalPresent: 0,
          totalClasses: 0,
        };

        // Initialize subjects for this student
        sectionCourses.forEach(course => {
          const subjectCode = course.subject?.code || course.code;
          const subjectName = course.subject?.name || course.name;
          sectionData[sectionName][student._id.toString()].subjects[subjectCode] = {
            present: 0,
            total: 0,
            name: subjectName,
          };
        });
      });
    });

    // Populate attendance data
    attendances.forEach(att => {
      const studentId = att.student.toString();
      const session = sessions.find(s => s._id.toString() === att.session.toString());
      if (!session) return;

      const course = courses.find(c => c._id.toString() === session.course.toString());
      if (!course) return;

      const student = students.find(s => s._id.toString() === studentId);
      if (!student) return;

      const sectionName = student.section;
      if (!sectionData[sectionName] || !sectionData[sectionName][studentId]) return;

      const subjectCode = course.subject?.code || course.code;
      if (!sectionData[sectionName][studentId].subjects[subjectCode]) {
        sectionData[sectionName][studentId].subjects[subjectCode] = {
          present: 0,
          total: 0,
          name: '',
        };
      }

      sectionData[sectionName][studentId].subjects[subjectCode].total += 1;
      sectionData[sectionName][studentId].totalClasses += 1;

      if (att.status === 'present' || att.status === 'late') {
        sectionData[sectionName][studentId].subjects[subjectCode].present += 1;
        sectionData[sectionName][studentId].totalPresent += 1;
      }
    });

    // Format data for export - separate file per section
    const allSectionBuffers = [];
    
    for (const sectionName of uniqueSections) {
      const sectionStudents = Object.values(sectionData[sectionName]);
      
      if (sectionStudents.length === 0) continue;

      // Get all subject codes for this section
      const subjectCodes = new Set();
      sectionStudents.forEach(student => {
        Object.keys(student.subjects).forEach(code => subjectCodes.add(code));
      });
      const sortedSubjectCodes = Array.from(subjectCodes).sort();

      // Build rows
      const rows = sectionStudents.map(student => {
        const row = {
          'Roll No': student.rollNo,
          'Name': student.name,
        };

        // Add subject columns
        sortedSubjectCodes.forEach(code => {
          const subData = student.subjects[code] || { present: 0, total: 0 };
          row[code] = `${subData.present}/${subData.total}`;
        });

        row['Total Classes'] = student.totalClasses;
        row['Attended'] = student.totalPresent;
        row['Percentage'] = student.totalClasses > 0
          ? ((student.totalPresent / student.totalClasses) * 100).toFixed(2) + '%'
          : '0%';

        return row;
      });

      // Add totals row
      const totalsRow = {
        'Roll No': 'TOTAL',
        'Name': '',
      };
      
      sortedSubjectCodes.forEach(code => {
        const totalPresent = sectionStudents.reduce((sum, s) => sum + (s.subjects[code]?.present || 0), 0);
        const totalClasses = sectionStudents.reduce((sum, s) => sum + (s.subjects[code]?.total || 0), 0);
        totalsRow[code] = `${totalPresent}/${totalClasses}`;
      });

      totalsRow['Total Classes'] = sectionStudents.reduce((sum, s) => sum + s.totalClasses, 0);
      totalsRow['Attended'] = sectionStudents.reduce((sum, s) => sum + s.totalPresent, 0);
      totalsRow['Percentage'] = totalsRow['Total Classes'] > 0
        ? ((totalsRow['Attended'] / totalsRow['Total Classes']) * 100).toFixed(2) + '%'
        : '0%';

      rows.push(totalsRow);

      // Generate file for this section
      const filename = `${department.name}_Year${yearNum}_Section${sectionName}_${new Date().getTime()}`;
      let buffer, contentType;

      if (format === 'csv') {
        buffer = Buffer.from(exporter.generateCSVString(rows));
        contentType = 'text/csv';
      } else if (format === 'xlsx') {
        buffer = await exporter.generateXLSXBuffer(rows, `Section ${sectionName}`);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else {
        buffer = await exporter.generatePDFBuffer(rows, `Section ${sectionName} Attendance`);
        contentType = 'application/pdf';
      }

      allSectionBuffers.push({ filename, buffer, contentType, sectionName });
    }

    // If only one section, send it directly
    if (allSectionBuffers.length === 1) {
      const { filename, buffer, contentType } = allSectionBuffers[0];
      
      await writeAudit({
        actorId: req.user.id,
        action: 'EXPORT_SECTION_WISE',
        targetCollection: 'attendance',
        targetId: departmentId,
        meta: { format, year: yearNum, sections: uniqueSections },
      });

      res.set({
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}.${format}"`,
      });

      return res.send(buffer);
    }

    // If multiple sections, create a ZIP file
    const AdmZip = require('adm-zip');
    const zip = new AdmZip();

    allSectionBuffers.forEach(({ filename, buffer }) => {
      zip.addFile(`${filename}.${format}`, buffer);
    });

    const zipBuffer = zip.toBuffer();

    await writeAudit({
      actorId: req.user.id,
      action: 'EXPORT_SECTION_WISE',
      targetCollection: 'attendance',
      targetId: departmentId,
      meta: { format, year: yearNum, sections: uniqueSections },
    });

    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${department.name}_Year${yearNum}_Attendance.zip"`,
    });

    res.send(zipBuffer);
  } catch (error) {
    console.error('Export section-wise error:', error);
    next(error);
  }
};

module.exports = {
  exportCourseAttendance,
  exportCollegeAttendance,
  exportDepartmentAttendance,
  exportSectionWiseAttendance,
};

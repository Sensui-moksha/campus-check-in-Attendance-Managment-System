const ExportTemplate = require('../models/ExportTemplate');
const Course = require('../models/Course');
const Attendance = require('../models/Attendance');
const ClassSession = require('../models/ClassSession');
const { generateCSVString, generateXLSXBuffer, generatePDFBuffer } = require('../utils/exporter');

/**
 * Get all export templates for admin
 */
const getTemplates = async (req, res) => {
  try {
    const templates = await ExportTemplate.find({}).sort({ createdAt: -1 });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Create a new export template
 */
const createTemplate = async (req, res) => {
  try {
    const { name, description, scope, columns, filters } = req.body;

    if (!name || !scope || !columns || columns.length === 0) {
      return res.status(422).json({ error: 'Name, scope, and at least one column are required' });
    }

    const template = new ExportTemplate({
      name,
      description,
      scope,
      columns,
      filters: filters || {},
      createdBy: req.user._id,
    });

    await template.save();
    res.status(201).json(template);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Delete an export template
 */
const deleteTemplate = async (req, res) => {
  try {
    const template = await ExportTemplate.findByIdAndDelete(req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json({ message: 'Template deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Export using a saved template
 */
const exportWithTemplate = async (req, res) => {
  try {
    const { templateId, format } = req.body;

    if (!templateId || !format) {
      return res.status(422).json({ error: 'Template ID and format are required' });
    }

    const template = await ExportTemplate.findById(templateId);
    if (!template) return res.status(404).json({ error: 'Template not found' });

    let data = [];
    let filename = template.name;

    if (template.scope === 'course') {
      // Requires courseId in request (can be passed via query or body)
      const { courseId } = req.body;
      if (!courseId) return res.status(422).json({ error: 'courseId is required for course export' });

      const course = await Course.findById(courseId).populate('department');
      if (!course) return res.status(404).json({ error: 'Course not found' });

      const attendances = await Attendance.find({ course: courseId })
        .populate('student', 'name email rollNo')
        .populate('session');

      // Group by student
      const studentMap = {};
      attendances.forEach(att => {
        if (!studentMap[att.student._id]) {
          studentMap[att.student._id] = {
            studentName: att.student.name,
            studentEmail: att.student.email,
            studentRollNo: att.student.rollNo,
            presentCount: 0,
            absentCount: 0,
            lateCount: 0,
            leaveCount: 0,
            sessionDates: [],
          };
        }

        const student = studentMap[att.student._id];
        if (att.status === 'present') student.presentCount++;
        else if (att.status === 'absent') student.absentCount++;
        else if (att.status === 'late') student.lateCount++;
        else if (att.status === 'leave') student.leaveCount++;

        student.sessionDates.push(att.session?.date?.toISOString().split('T')[0] || 'N/A');
      });

      data = Object.values(studentMap);
      filename = `${course.name}_${new Date().toISOString().split('T')[0]}`;
    } else if (template.scope === 'department') {
      // Aggregate by year of study across all courses
      const { departmentId } = req.body;
      if (!departmentId) return res.status(422).json({ error: 'departmentId is required for department export' });

      const courses = await Course.find({ department: departmentId });
      const courseIds = courses.map(c => c._id);

      const attendances = await Attendance.find({ course: { $in: courseIds } })
        .populate('student', 'yearOfStudy')
        .populate('session')
        .populate('course', 'name');

      // Group by year of study
      const yearMap = {};
      attendances.forEach(att => {
        const year = att.student?.yearOfStudy || 'Unknown';
        if (!yearMap[year]) {
          yearMap[year] = {
            yearOfStudy: year,
            courseName: att.course?.name || 'N/A',
            totalStudents: 0,
            presentCount: 0,
            absentCount: 0,
          };
        }

        const entry = yearMap[year];
        entry.totalStudents++;
        if (att.status === 'present') entry.presentCount++;
        else if (att.status === 'absent') entry.absentCount++;
        entry.attendancePercentage = Math.round((entry.presentCount / entry.totalStudents) * 100);
      });

      data = Object.values(yearMap);
      filename = `department_report_${new Date().toISOString().split('T')[0]}`;
    } else if (template.scope === 'college') {
      // Overall college statistics
      const allAttendances = await Attendance.find()
        .populate('course', 'name department')
        .populate('student', 'name')
        .populate('session');

      const courseMap = {};
      allAttendances.forEach(att => {
        const courseId = att.course?._id;
        if (!courseMap[courseId]) {
          courseMap[courseId] = {
            departmentName: att.course?.department || 'N/A',
            courseName: att.course?.name || 'N/A',
            totalStudents: 0,
            presentCount: 0,
            absentCount: 0,
          };
        }

        const course = courseMap[courseId];
        course.totalStudents++;
        if (att.status === 'present') course.presentCount++;
        else if (att.status === 'absent') course.absentCount++;
        course.attendancePercentage = Math.round((course.presentCount / course.totalStudents) * 100);
      });

      data = Object.values(courseMap);
      filename = `college_report_${new Date().toISOString().split('T')[0]}`;
    }

    // Filter columns based on template
    const filteredData = data.map(row => {
      const filtered = {};
      template.columns.forEach(col => {
        if (row.hasOwnProperty(col)) {
          filtered[col] = row[col];
        }
      });
      return filtered;
    });

    // Generate export in requested format
    let fileData, contentType;

    if (format === 'csv') {
      fileData = generateCSVString(filteredData);
      contentType = 'text/csv';
    } else if (format === 'xlsx') {
      fileData = await generateXLSXBuffer(filteredData);
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else if (format === 'pdf') {
      fileData = await generatePDFBuffer(filteredData);
      contentType = 'application/pdf';
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.${format}"`);
    res.send(fileData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getTemplates,
  createTemplate,
  deleteTemplate,
  exportWithTemplate,
};

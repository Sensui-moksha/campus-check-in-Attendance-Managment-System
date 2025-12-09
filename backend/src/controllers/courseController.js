const Course = require('../models/Course');
const User = require('../models/User');

/**
 * Create course (admin/principal only)
 */
exports.createCourse = async (req, res, next) => {
  try {
    const { code, name, departmentId, yearOfStudy, semester, programmes, eligibleBatches } = req.body;

    if (!code || !name || !departmentId || !yearOfStudy || !semester) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const course = new Course({
      code,
      name,
      department: departmentId,
      yearOfStudy,
      semester,
      programmes: programmes || ['B.Tech'],
      eligibleBatches: eligibleBatches || []
    });

    await course.save();
    await course.populate(['department', 'teacher']);

    res.status(201).json(course);
  } catch (error) {
    next(error);
  }
};

/**
 * List courses with filters
 */
exports.listCourses = async (req, res, next) => {
  try {
    const { departmentId, year, semester, programme, batchYear } = req.query;
    const query = {};

    if (departmentId) query.department = departmentId;
    if (year) query.yearOfStudy = parseInt(year, 10);
    if (semester) query.semester = parseInt(semester, 10);
    if (programme) query.programmes = programme;

    const courses = await Course.find(query)
      .populate(['department', 'teacher'])
      .lean();

    res.json(courses);
  } catch (error) {
    next(error);
  }
};

/**
 * Get course roster (students eligible for the course)
 */
exports.getCourseRoster = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { batchYear, year, semester } = req.query;

    const course = await Course.findById(courseId).populate('department');
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Find students matching course criteria
    const query = {
      role: 'student',
      department: course.department._id,
      yearOfStudy: year || course.yearOfStudy,
      semester: semester || course.semester
    };

    if (batchYear) {
      query.batchYear = parseInt(batchYear, 10);
    } else if (course.eligibleBatches && course.eligibleBatches.length > 0) {
      query.batchYear = { $in: course.eligibleBatches };
    }

    const students = await User.find(query)
      .select('_id name rollNo email batchYear yearOfStudy')
      .lean();

    res.json({
      course,
      students,
      totalStudents: students.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign teacher to course
 */
exports.assignTeacher = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { teacherId } = req.body;

    const course = await Course.findByIdAndUpdate(
      courseId,
      { teacher: teacherId },
      { new: true }
    ).populate(['department', 'teacher']);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json(course);
  } catch (error) {
    next(error);
  }
};

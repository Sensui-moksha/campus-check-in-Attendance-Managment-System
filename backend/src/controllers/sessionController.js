const ClassSession = require('../models/ClassSession');
const Course = require('../models/Course');
const { validationResult } = require('express-validator');

/**
 * Create attendance session for a course on a given date
 * POST /api/sessions
 * Auth: teacher, hod, admin, principal
 */
const createSession = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { courseId, sessionDate, academicYear } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Verify course exists
    const course = await Course.findById(courseId).populate('teacher department');
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Verify authorization: only course teacher or admin/principal can create sessions
    if (userRole === 'teacher' && course.teacher._id.toString() !== userId) {
      return res.status(403).json({ error: 'Only the assigned teacher can create sessions' });
    }

    if (userRole === 'hod') {
      // HOD can only create for their department
      const userDeptId = typeof req.user.department === 'string' ? req.user.department : req.user.department?._id?.toString();
      const courseDeptId = course.department._id.toString();
      if (String(userDeptId) !== String(courseDeptId)) {
        return res.status(403).json({ error: 'Cannot create session for another department' });
      }
    }

    // Check if session already exists for this course on this date
    const existing = await ClassSession.findOne({
      course: courseId,
      sessionDate: new Date(sessionDate),
      academicYear,
    });

    if (existing) {
      return res.status(409).json({ error: 'Session already exists for this date' });
    }

    const session = new ClassSession({
      course: courseId,
      sessionDate,
      academicYear,
      yearOfStudy: course.yearOfStudy,
      semester: course.semester,
      createdBy: userId,
    });

    await session.save();

    res.status(201).json({
      message: 'Session created successfully',
      session: await session.populate('course createdBy', 'name email'),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get session by ID
 * GET /api/sessions/:sessionId
 * Auth: all authenticated users
 */
const getSession = async (req, res, next) => {
  try {
    const session = await ClassSession.findById(req.params.sessionId)
      .populate('course createdBy', 'name email');

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(session);
  } catch (error) {
    next(error);
  }
};

/**
 * Get sessions for a course with optional date range filter
 * GET /api/courses/:courseId/sessions
 * Query params: startDate, endDate (ISO strings)
 * Auth: teacher, hod, admin, principal
 */
const getCourseSession = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { startDate, endDate, cancelled } = req.query;

    const course = await Course.findById(courseId).populate('department');
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Authorization: teacher of course, HOD of dept, or admin/principal
    const userRole = req.user.role;
    const userId = req.user.id;

    if (userRole === 'teacher') {
      if (course.teacher.toString() !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
    } else if (userRole === 'hod') {
      const userDeptId = typeof req.user.department === 'string' ? req.user.department : req.user.department?._id?.toString();
      const courseDeptId = course.department._id.toString();
      if (String(userDeptId) !== String(courseDeptId)) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
    } else if (!['admin', 'principal'].includes(userRole)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const filter = { course: courseId };

    if (startDate || endDate) {
      filter.sessionDate = {};
      if (startDate) filter.sessionDate.$gte = new Date(startDate);
      if (endDate) filter.sessionDate.$lte = new Date(endDate);
    }

    if (cancelled !== undefined) {
      filter.cancelled = cancelled === 'true';
    }

    const sessions = await ClassSession.find(filter)
      .sort({ sessionDate: -1 })
      .populate('course createdBy', 'name email');

    res.json(sessions);
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel a session (soft delete)
 * PUT /api/sessions/:sessionId/cancel
 * Auth: teacher, hod, admin, principal
 */
const cancelSession = async (req, res, next) => {
  try {
    const session = await ClassSession.findById(req.params.sessionId).populate('course');

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Authorization
    const userRole = req.user.role;
    const userId = req.user.id;

    const course = await Course.findById(session.course._id).populate('department');

    if (userRole === 'teacher' && course.teacher.toString() !== userId) {
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

    session.cancelled = true;
    await session.save();

    res.json({ message: 'Session cancelled', session });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSession,
  getSession,
  getCourseSession,
  cancelSession,
};

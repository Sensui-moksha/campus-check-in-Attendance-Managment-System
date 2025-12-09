const User = require('../models/User');
const DetainLog = require('../models/DetainLog');
const Attendance = require('../models/Attendance');

/**
 * Calculate attendance percentage for a student
 */
const calculateAttendancePercent = async (userId, startDate, endDate) => {
  const now = endDate || new Date();
  const start = startDate || new Date(now.getFullYear(), now.getMonth() - 3, 1); // Last 3 months default

  const attendanceRecords = await Attendance.find({
    user: userId,
    date: { $gte: start, $lte: now }
  });

  if (attendanceRecords.length === 0) return null;

  const present = attendanceRecords.filter(r => r.status === 'P' || r.status === 'present').length;
  const total = attendanceRecords.length;

  return ((present / total) * 100).toFixed(2);
};

/**
 * Bulk detain students
 * POST /api/detain
 */
exports.detainStudents = async (req, res, next) => {
  try {
    const {
      userIds,
      reason,
      reasonType,
      detainDate,
      notes,
      performedBy,
      notify = false
    } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'userIds array is required' });
    }

    if (!reason || !reasonType) {
      return res.status(400).json({ error: 'reason and reasonType are required' });
    }

    if (!performedBy) {
      return res.status(400).json({ error: 'performedBy is required' });
    }

    const detained = [];
    const failed = [];

    for (const userId of userIds) {
      try {
        const user = await User.findById(userId);

        if (!user) {
          failed.push({ userId, error: 'User not found' });
          continue;
        }

        if (user.role !== 'student') {
          failed.push({ userId, error: 'Can only detain students' });
          continue;
        }

        if (user.isDetained) {
          failed.push({ userId, error: 'Already detained' });
          continue;
        }

        // Calculate current attendance and credit score
        const attendancePercent = await calculateAttendancePercent(userId);

        // Update user detention status
        user.isDetained = true;
        user.detainReason = reason;
        user.detainReasonType = reasonType;
        user.detainDate = detainDate || new Date();
        user.detainBy = performedBy;
        user.detainNotes = notes || null;
        await user.save();

        // Create audit log
        await DetainLog.create({
          user: userId,
          action: 'detain',
          reason,
          reasonType,
          performedBy,
          performedAt: new Date(),
          notes,
          attendancePercent: attendancePercent ? parseFloat(attendancePercent) : null,
          creditScore: user.creditScore || null
        });

        detained.push({
          userId,
          name: user.name,
          rollNo: user.rollNo,
          attendancePercent,
          creditScore: user.creditScore
        });

        // TODO: Send notification if notify is true
        if (notify) {
          console.log(`📧 Should notify student ${user.rollNo} about detention`);
        }

      } catch (err) {
        console.error(`Failed to detain user ${userId}:`, err);
        failed.push({ userId, error: err.message });
      }
    }

    res.json({
      message: `Successfully detained ${detained.length} student(s)`,
      detained,
      failed
    });

  } catch (error) {
    console.error('Error in detainStudents:', error);
    next(error);
  }
};

/**
 * Release students from detention
 * POST /api/detain/release
 */
exports.releaseStudents = async (req, res, next) => {
  try {
    const {
      userIds,
      releaseDate,
      releaseNotes,
      performedBy
    } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'userIds array is required' });
    }

    if (!performedBy) {
      return res.status(400).json({ error: 'performedBy is required' });
    }

    const released = [];
    const failed = [];

    for (const userId of userIds) {
      try {
        const user = await User.findById(userId);

        if (!user) {
          failed.push({ userId, error: 'User not found' });
          continue;
        }

        if (!user.isDetained) {
          failed.push({ userId, error: 'User is not detained' });
          continue;
        }

        // Update user release status
        user.isDetained = false;
        user.detainReleaseDate = releaseDate || new Date();
        user.detainReleaseBy = performedBy;
        user.detainReleaseNotes = releaseNotes || null;
        await user.save();

        // Create audit log
        await DetainLog.create({
          user: userId,
          action: 'release',
          reason: releaseNotes || 'Released from detention',
          performedBy,
          performedAt: new Date(),
          notes: releaseNotes
        });

        released.push({
          userId,
          name: user.name,
          rollNo: user.rollNo
        });

      } catch (err) {
        console.error(`Failed to release user ${userId}:`, err);
        failed.push({ userId, error: err.message });
      }
    }

    res.json({
      message: `Successfully released ${released.length} student(s)`,
      released,
      failed
    });

  } catch (error) {
    console.error('Error in releaseStudents:', error);
    next(error);
  }
};

/**
 * Get list of detained students with filters
 * GET /api/detain
 */
exports.getDetainedStudents = async (req, res, next) => {
  try {
    const {
      department,
      year,
      reasonType,
      from,
      to,
      page = 1,
      limit = 50
    } = req.query;

    const query = { isDetained: true, role: 'student' };

    if (department) query.department = department;
    if (year) query.yearOfStudy = parseInt(year);
    if (reasonType) query.detainReasonType = reasonType;
    if (from || to) {
      query.detainDate = {};
      if (from) query.detainDate.$gte = new Date(from);
      if (to) query.detainDate.$lte = new Date(to);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const students = await User.find(query)
      .populate('department', 'name code')
      .populate('detainBy', 'name email')
      .populate('detainReleaseBy', 'name email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ detainDate: -1 });

    const total = await User.countDocuments(query);

    // Calculate attendance for each
    const studentsWithAttendance = await Promise.all(
      students.map(async (student) => {
        const attendancePercent = await calculateAttendancePercent(student._id);
        return {
          ...student.toJSON(),
          attendancePercent: attendancePercent ? parseFloat(attendancePercent) : null
        };
      })
    );

    res.json({
      students: studentsWithAttendance,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error in getDetainedStudents:', error);
    next(error);
  }
};

/**
 * Suggest students for detention based on thresholds
 * POST /api/detain/suggest
 */
exports.suggestDetain = async (req, res, next) => {
  try {
    const {
      attendanceLt = 75,
      creditLt = 40,
      department,
      year
    } = req.body;

    const query = {
      role: 'student',
      isDetained: false  // Only suggest non-detained students
    };

    if (department) query.department = department;
    if (year) query.yearOfStudy = parseInt(year);

    const students = await User.find(query)
      .populate('department', 'name code')
      .limit(200);  // Limit for performance

    const suggestions = [];

    for (const student of students) {
      const attendancePercent = await calculateAttendancePercent(student._id);
      const creditScore = student.creditScore || 0;

      let shouldSuggest = false;
      const reasons = [];

      if (attendancePercent !== null && parseFloat(attendancePercent) < attendanceLt) {
        shouldSuggest = true;
        reasons.push(`Low attendance: ${attendancePercent}% (threshold: ${attendanceLt}%)`);
      }

      if (creditScore < creditLt) {
        shouldSuggest = true;
        reasons.push(`Low credit score: ${creditScore} (threshold: ${creditLt})`);
      }

      if (shouldSuggest) {
        suggestions.push({
          _id: student._id,
          name: student.name,
          rollNo: student.rollNo,
          department: student.department,
          yearOfStudy: student.yearOfStudy,
          attendancePercent: attendancePercent ? parseFloat(attendancePercent) : null,
          creditScore,
          suggestedReasons: reasons
        });
      }
    }

    res.json({
      count: suggestions.length,
      suggestions,
      criteria: {
        attendanceLt,
        creditLt
      }
    });

  } catch (error) {
    console.error('Error in suggestDetain:', error);
    next(error);
  }
};

/**
 * Get detention history for a student
 * GET /api/detain/history/:userId
 */
exports.getDetainHistory = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const history = await DetainLog.find({ user: userId })
      .populate('performedBy', 'name email role')
      .sort({ performedAt: -1 });

    res.json({
      userId,
      count: history.length,
      history
    });

  } catch (error) {
    console.error('Error in getDetainHistory:', error);
    next(error);
  }
};

module.exports = exports;

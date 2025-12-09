const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { processEndedSemesters, manualPromotionTrigger } = require('../utils/autoPromotion');

/**
 * Promote students to next academic year
 * POST /api/admin/promote
 * 
 * Logic:
 * - Year 1 -> Year 2
 * - Year 2 -> Year 3
 * - Year 3 -> Year 4
 * - Year 4 -> Alumni (isAlumni = true)
 * - Detained students DO NOT get promoted
 * 
 * Supports dry-run mode to preview changes
 */
exports.promoteStudents = async (req, res, next) => {
  try {
    const {
      dryRun = false,
      department = null,
      year = null,  // Optional: only promote specific year
      performedBy
    } = req.body;

    if (!performedBy) {
      return res.status(400).json({ error: 'performedBy is required' });
    }

    // Build query
    const query = {
      role: 'student',
      isDetained: false  // Only promote non-detained students
    };

    if (department) {
      query.department = department;
    }

    if (year) {
      query.yearOfStudy = parseInt(year);
    }

    // Find eligible students
    const students = await User.find(query)
      .populate('department', 'name code')
      .sort({ yearOfStudy: 1, rollNo: 1 });

    const promoted = [];
    const madeAlumni = [];
    const detained = [];

    // Also fetch detained students for reporting
    const detainedQuery = { ...query };
    delete detainedQuery.isDetained;
    detainedQuery.isDetained = true;

    const detainedStudents = await User.find(detainedQuery)
      .populate('department', 'name code');

    detained.push(...detainedStudents.map(s => ({
      _id: s._id,
      name: s.name,
      rollNo: s.rollNo,
      department: s.department,
      currentYear: s.yearOfStudy,
      detainReason: s.detainReason,
      detainDate: s.detainDate
    })));

    // Process promotions
    for (const student of students) {
      const oldYear = student.yearOfStudy;
      const isLateralEntry = student.isLateralEntry || false;
      let newYear = oldYear;
      let becameAlumni = false;

      if (oldYear === 4) {
        // 4th year becomes alumni
        if (!dryRun) {
          student.isAlumni = true;
          student.alumniDate = new Date();
          await student.save();

          // Create audit log
          await AuditLog.create({
            user: performedBy,
            action: 'promote_to_alumni',
            targetUser: student._id,
            details: `Promoted ${student.rollNo} from Year 4 to Alumni`,
            timestamp: new Date()
          });
        }

        becameAlumni = true;
        madeAlumni.push({
          _id: student._id,
          name: student.name,
          rollNo: student.rollNo,
          department: student.department,
          oldYear: 4,
          newStatus: 'Alumni'
        });

      } else if (oldYear === 3 && isLateralEntry) {
        // Year 3 lateral entry students become alumni (3-year programme)
        if (!dryRun) {
          student.isAlumni = true;
          student.alumniDate = new Date();
          await student.save();

          // Create audit log
          await AuditLog.create({
            user: performedBy,
            action: 'promote_to_alumni',
            targetUser: student._id,
            details: `Promoted ${student.rollNo} [Lateral Entry] from Year 3 to Alumni`,
            timestamp: new Date()
          });
        }

        becameAlumni = true;
        madeAlumni.push({
          _id: student._id,
          name: student.name,
          rollNo: student.rollNo,
          department: student.department,
          oldYear: 3,
          newStatus: 'Alumni (Lateral Entry)'
        });

      } else {
        // Promote to next year (1->2, 2->3, 3->4)
        newYear = oldYear + 1;

        if (!dryRun) {
          student.yearOfStudy = newYear;
          await student.save();

          // Create audit log
          await AuditLog.create({
            user: performedBy,
            action: 'promote_year',
            targetUser: student._id,
            details: `Promoted ${student.rollNo} from Year ${oldYear} to Year ${newYear}`,
            timestamp: new Date()
          });
        }

        promoted.push({
          _id: student._id,
          name: student.name,
          rollNo: student.rollNo,
          department: student.department,
          oldYear,
          newYear
        });
      }
    }

    res.json({
      dryRun,
      message: dryRun 
        ? 'Preview mode - no changes made' 
        : `Promoted ${promoted.length} students, ${madeAlumni.length} became alumni`,
      summary: {
        promoted: promoted.length,
        madeAlumni: madeAlumni.length,
        detained: detained.length
      },
      promoted,
      madeAlumni,
      detained
    });

  } catch (error) {
    console.error('Error in promoteStudents:', error);
    next(error);
  }
};

/**
 * Get promotion preview
 * GET /api/admin/promote/preview
 * 
 * Shows who would be promoted without making changes
 */
exports.getPromotionPreview = async (req, res, next) => {
  try {
    const { department, year } = req.query;

    const query = {
      role: 'student'
    };

    if (department) {
      query.department = department;
    }

    if (year) {
      query.yearOfStudy = parseInt(year);
    }

    // Count eligible (non-detained)
    const eligible = await User.countDocuments({
      ...query,
      isDetained: false
    });

    // Count detained
    const detained = await User.countDocuments({
      ...query,
      isDetained: true
    });

    // Breakdown by year
    const breakdown = [];
    for (let y = 1; y <= 4; y++) {
      const yearQuery = { ...query, yearOfStudy: y };
      
      const total = await User.countDocuments(yearQuery);
      const eligibleCount = await User.countDocuments({
        ...yearQuery,
        isDetained: false
      });
      const detainedCount = await User.countDocuments({
        ...yearQuery,
        isDetained: true
      });

      breakdown.push({
        year: y,
        total,
        eligible: eligibleCount,
        detained: detainedCount,
        willPromoteTo: y === 4 ? 'Alumni' : `Year ${y + 1}`
      });
    }

    res.json({
      summary: {
        totalEligible: eligible,
        totalDetained: detained
      },
      breakdown
    });

  } catch (error) {
    console.error('Error in getPromotionPreview:', error);
    next(error);
  }
};

/**
 * Rollback last promotion (emergency use only)
 * POST /api/admin/promote/rollback
 * 
 * WARNING: This should be used carefully and only immediately after a promotion
 */
exports.rollbackPromotion = async (req, res, next) => {
  try {
    const { performedBy, confirm = false } = req.body;

    if (!confirm) {
      return res.status(400).json({ 
        error: 'Must confirm rollback with confirm: true' 
      });
    }

    if (!performedBy) {
      return res.status(400).json({ error: 'performedBy is required' });
    }

    // Find recent promotion audit logs (last 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentPromotions = await AuditLog.find({
      action: { $in: ['promote_year', 'promote_to_alumni'] },
      timestamp: { $gte: oneHourAgo }
    }).populate('targetUser');

    if (recentPromotions.length === 0) {
      return res.status(404).json({ 
        error: 'No recent promotions found to rollback' 
      });
    }

    const rolledBack = [];

    for (const log of recentPromotions) {
      if (!log.targetUser) continue;

      const student = await User.findById(log.targetUser);
      if (!student) continue;

      if (log.action === 'promote_to_alumni') {
        // Rollback alumni to Year 4
        student.isAlumni = false;
        student.alumniDate = null;
        student.yearOfStudy = 4;
        await student.save();

        rolledBack.push({
          _id: student._id,
          name: student.name,
          rollNo: student.rollNo,
          action: 'Alumni -> Year 4'
        });

      } else if (log.action === 'promote_year') {
        // Rollback year promotion
        if (student.yearOfStudy > 1) {
          const oldYear = student.yearOfStudy;
          student.yearOfStudy = oldYear - 1;
          await student.save();

          rolledBack.push({
            _id: student._id,
            name: student.name,
            rollNo: student.rollNo,
            action: `Year ${oldYear} -> Year ${oldYear - 1}`
          });
        }
      }
    }

    // Create audit log for rollback
    await AuditLog.create({
      user: performedBy,
      action: 'promotion_rollback',
      details: `Rolled back ${rolledBack.length} promotions`,
      timestamp: new Date()
    });

    res.json({
      message: `Rolled back ${rolledBack.length} promotions`,
      rolledBack
    });

  } catch (error) {
    console.error('Error in rollbackPromotion:', error);
    next(error);
  }
};

/**
 * Process automatic promotions for ended semesters
 * POST /api/admin/promote/auto/process
 * 
 * Automatically promotes all students in departments where semesters have ended
 */
exports.processAutoPromotions = async (req, res, next) => {
  try {
    const { performedBy } = req.body;

    if (!performedBy) {
      return res.status(400).json({ error: 'performedBy is required' });
    }

    console.log('🔄 Admin triggered automatic promotion process');

    const result = await processEndedSemesters(performedBy);

    res.json({
      message: 'Automatic promotion process completed',
      ...result
    });

  } catch (error) {
    console.error('Error in processAutoPromotions:', error);
    next(error);
  }
};

/**
 * Manually trigger promotion for specific department
 * POST /api/admin/promote/manual
 * 
 * Manually promote students in a specific department
 */
exports.manualTriggerPromotion = async (req, res, next) => {
  try {
    const { departmentId, performedBy } = req.body;

    if (!performedBy) {
      return res.status(400).json({ error: 'performedBy is required' });
    }

    console.log(`🔄 Admin triggered manual promotion for department: ${departmentId}`);

    const result = await manualPromotionTrigger(departmentId, performedBy);

    res.json({
      message: 'Manual promotion completed',
      promoted: result.promoted || [],
      madeAlumni: result.madeAlumni || [],
      detained: result.detained || [],
      errors: result.errors || []
    });

  } catch (error) {
    console.error('Error in manualTriggerPromotion:', error);
    next(error);
  }
};

/**
 * Get automatic promotion status for all departments/semesters
 * GET /api/admin/promote/auto/status
 */
exports.getAutoPromotionStatus = async (req, res, next) => {
  try {
    const Semester = require('../models/Semester');
    
    // Get all semesters and their promotion status
    const semesters = await Semester.find()
      .populate('department', 'name code')
      .sort({ endDate: -1 });

    const status = semesters.map(sem => ({
      _id: sem._id,
      name: sem.name,
      department: sem.department?.name,
      startDate: sem.startDate,
      endDate: sem.endDate,
      hasEnded: new Date() >= new Date(sem.endDate),
      promotionProcessed: sem.promotionProcessed,
      promotionProcessedAt: sem.promotionProcessedAt,
      promotionProcessedBy: sem.promotionProcessedBy
    }));

    res.json({
      status,
      summary: {
        total: status.length,
        processed: status.filter(s => s.promotionProcessed).length,
        pending: status.filter(s => s.hasEnded && !s.promotionProcessed).length
      }
    });

  } catch (error) {
    console.error('Error in getAutoPromotionStatus:', error);
    next(error);
  }
};

module.exports = exports;

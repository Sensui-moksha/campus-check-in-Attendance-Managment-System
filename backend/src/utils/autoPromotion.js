const User = require('../models/User');
const Semester = require('../models/Semester');
const AuditLog = require('../models/AuditLog');
const Section = require('../models/Section');

/**
 * Auto-Promotion Service
 * Handles automatic student promotion at the end of each semester
 * Runs via scheduled jobs or manual trigger
 */

/**
 * Check if semester has ended
 * @param {Object} semester - Semester document
 * @returns {boolean} true if semester end date has passed
 */
const isSemesterEnded = (semester) => {
  if (!semester || !semester.endDate) return false;
  return new Date() >= new Date(semester.endDate);
};

/**
 * Get the current/latest active semester
 * @param {String} departmentId - Optional department filter
 * @returns {Promise<Object>} Latest semester
 */
const getActiveSemester = async (departmentId = null) => {
  const query = {};
  if (departmentId) {
    query.department = departmentId;
  }
  
  const semester = await Semester.findOne(query)
    .sort({ endDate: -1 })
    .populate('department', 'name code');
  
  return semester;
};

/**
 * Get all semesters that have ended but haven't been processed for promotion
 * @returns {Promise<Array>} Array of ended semesters
 */
const getEndedUnprocessedSemesters = async () => {
  const now = new Date();
  const semesters = await Semester.find({
    endDate: { $lte: now },
    promotionProcessed: { $ne: true } // Not yet processed
  }).populate('department', 'name code');
  
  return semesters;
};

/**
 * Ensure section exists for a year, create if missing
 * @param {String} departmentId - Department ID
 * @param {Number} yearOfStudy - Target year
 * @param {String} sectionName - Section identifier (A, B, C, etc.)
 * @returns {Promise<Object>} Section document
 */
const ensureSectionExists = async (departmentId, yearOfStudy, sectionName) => {
  try {
    // Try to find existing section
    let section = await Section.findOne({
      department: departmentId,
      name: sectionName,
      yearOfStudy: yearOfStudy
    });

    if (section) {
      return section; // Already exists
    }

    // Section doesn't exist - create it
    console.log(`📌 Creating missing section: ${sectionName} for Year ${yearOfStudy}`);
    
    section = await Section.create({
      department: departmentId,
      name: sectionName,
      yearOfStudy: yearOfStudy,
      capacity: 60, // Default capacity
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log(`✅ Section ${sectionName} created for Year ${yearOfStudy}`);
    return section;

  } catch (error) {
    console.error(`Error ensuring section exists: ${error.message}`);
    throw error;
  }
};

/**
 * Promote all students in a department/semester
 * MAINTAINS SECTION ASSIGNMENTS - Creates missing sections if needed
 * @param {String} departmentId - Department ID
 * @param {String} semesterId - Semester ID
 * @param {String} performedBy - Admin/System user ID
 * @returns {Promise<Object>} Promotion results
 */
const promoteStudentsForSemester = async (departmentId, semesterId, performedBy = 'SYSTEM') => {
  try {
    // Find all non-detained, non-alumni students in this department
    // IMPORTANT: Process Year 4 FIRST to convert them to Alumni before promoting Year 3
    const query = {
      role: 'student',
      department: departmentId,
      isDetained: false,
      isAlumni: false
    };

    const students = await User.find(query)
      .populate('department', 'name code')
      .sort({ yearOfStudy: -1, rollNo: 1 }); // Sort descending by year (Year 4 first!)

    const results = {
      promoted: [],
      madeAlumni: [],
      detained: [],
      sectionsMigrated: [],
      sectionsCreated: [],
      errors: []
    };

    // Track sections created in this promotion
    const createdSections = new Map();

    // Process students starting from Year 4 (so they become Alumni first)
    for (const student of students) {
      try {
        const oldYear = student.yearOfStudy;
        const oldSection = student.section;
        const isLateralEntry = student.isLateralEntry || false;
        let newYear = oldYear;
        let sectionUpdated = false;

        if (oldYear === 4) {
          // 4th year becomes alumni FIRST (priority)
          student.isAlumni = true;
          student.alumniDate = new Date();
          await student.save();

          // Create audit log
          await AuditLog.create({
            user: performedBy,
            action: 'promote_to_alumni_auto',
            targetUser: student._id,
            details: `Auto-promoted ${student.rollNo} (${student.name}) from Year 4 Section ${oldSection} to Alumni at end of semester`,
            semester: semesterId,
            timestamp: new Date()
          });

          results.madeAlumni.push({
            _id: student._id,
            name: student.name,
            rollNo: student.rollNo,
            department: student.department?.name,
            oldYear: 4,
            oldSection: oldSection,
            newStatus: 'Alumni'
          });
        } else if (oldYear === 3 && isLateralEntry) {
          // Year 3 lateral entry students become alumni (3-year programme)
          student.isAlumni = true;
          student.alumniDate = new Date();
          await student.save();

          // Create audit log
          await AuditLog.create({
            user: performedBy,
            action: 'promote_to_alumni_auto',
            targetUser: student._id,
            details: `Auto-promoted ${student.rollNo} (${student.name}) [Lateral Entry] from Year 3 Section ${oldSection} to Alumni at end of semester`,
            semester: semesterId,
            timestamp: new Date()
          });

          results.madeAlumni.push({
            _id: student._id,
            name: student.name,
            rollNo: student.rollNo,
            department: student.department?.name,
            oldYear: 3,
            oldSection: oldSection,
            newStatus: 'Alumni (Lateral Entry)'
          });
        } else if (oldYear === 3) {
          // Year 3 promotes to Year 4 with SAME SECTION
          newYear = 4;
          student.yearOfStudy = newYear;
          
          // Ensure section exists in Year 4
          if (oldSection) {
            const sectionKey = `${newYear}-${oldSection}`;
            if (!createdSections.has(sectionKey)) {
              await ensureSectionExists(departmentId, newYear, oldSection);
              createdSections.set(sectionKey, true);
              results.sectionsCreated.push({
                name: oldSection,
                year: newYear
              });
            }
            sectionUpdated = true;
            results.sectionsMigrated.push({
              rollNo: student.rollNo,
              fromYear: 3,
              toYear: 4,
              section: oldSection
            });
          }

          await student.save();

          // Create audit log
          await AuditLog.create({
            user: performedBy,
            action: 'promote_year_auto',
            targetUser: student._id,
            details: `Auto-promoted ${student.rollNo} (${student.name}) from Year 3 Section ${oldSection} to Year 4 Section ${oldSection} at end of semester`,
            semester: semesterId,
            timestamp: new Date()
          });

          results.promoted.push({
            _id: student._id,
            name: student.name,
            rollNo: student.rollNo,
            department: student.department?.name,
            oldYear: 3,
            oldSection: oldSection,
            newYear: 4,
            newSection: oldSection
          });
        } else if (oldYear === 2) {
          // Year 2 promotes to Year 3 with SAME SECTION
          newYear = 3;
          student.yearOfStudy = newYear;
          
          // Ensure section exists in Year 3
          if (oldSection) {
            const sectionKey = `${newYear}-${oldSection}`;
            if (!createdSections.has(sectionKey)) {
              await ensureSectionExists(departmentId, newYear, oldSection);
              createdSections.set(sectionKey, true);
              results.sectionsCreated.push({
                name: oldSection,
                year: newYear
              });
            }
            sectionUpdated = true;
            results.sectionsMigrated.push({
              rollNo: student.rollNo,
              fromYear: 2,
              toYear: 3,
              section: oldSection
            });
          }

          await student.save();

          // Create audit log
          await AuditLog.create({
            user: performedBy,
            action: 'promote_year_auto',
            targetUser: student._id,
            details: `Auto-promoted ${student.rollNo} (${student.name}) from Year 2 Section ${oldSection} to Year 3 Section ${oldSection} at end of semester`,
            semester: semesterId,
            timestamp: new Date()
          });

          results.promoted.push({
            _id: student._id,
            name: student.name,
            rollNo: student.rollNo,
            department: student.department?.name,
            oldYear: 2,
            oldSection: oldSection,
            newYear: 3,
            newSection: oldSection
          });
        } else if (oldYear === 1) {
          // Year 1 promotes to Year 2 with SAME SECTION
          newYear = 2;
          student.yearOfStudy = newYear;
          
          // Ensure section exists in Year 2
          if (oldSection) {
            const sectionKey = `${newYear}-${oldSection}`;
            if (!createdSections.has(sectionKey)) {
              await ensureSectionExists(departmentId, newYear, oldSection);
              createdSections.set(sectionKey, true);
              results.sectionsCreated.push({
                name: oldSection,
                year: newYear
              });
            }
            sectionUpdated = true;
            results.sectionsMigrated.push({
              rollNo: student.rollNo,
              fromYear: 1,
              toYear: 2,
              section: oldSection
            });
          }

          await student.save();

          // Create audit log
          await AuditLog.create({
            user: performedBy,
            action: 'promote_year_auto',
            targetUser: student._id,
            details: `Auto-promoted ${student.rollNo} (${student.name}) from Year 1 Section ${oldSection} to Year 2 Section ${oldSection} at end of semester`,
            semester: semesterId,
            timestamp: new Date()
          });

          results.promoted.push({
            _id: student._id,
            name: student.name,
            rollNo: student.rollNo,
            department: student.department?.name,
            oldYear: 1,
            oldSection: oldSection,
            newYear: 2,
            newSection: oldSection
          });
        }
      } catch (err) {
        console.error(`Error promoting student ${student.rollNo}:`, err.message);
        results.errors.push({
          studentId: student._id,
          rollNo: student.rollNo,
          error: err.message
        });
      }
    }

    // Find detained students for reporting
    const detainedStudents = await User.find({
      role: 'student',
      department: departmentId,
      isDetained: true,
      isAlumni: false
    }).populate('department', 'name code');

    results.detained = detainedStudents.map(s => ({
      _id: s._id,
      name: s.name,
      rollNo: s.rollNo,
      department: s.department?.name,
      currentYear: s.yearOfStudy,
      currentSection: s.section,
      detainReason: s.detainReason,
      detainDate: s.detainDate
    }));

    return results;

  } catch (error) {
    console.error('Error in promoteStudentsForSemester:', error);
    throw error;
  }
};

/**
 * Process all ended semesters and promote students
 * Can be called manually or via scheduled job (cron)
 * @param {String} performedBy - Admin/System user ID
 * @returns {Promise<Object>} Processing results for all semesters
 */
const processEndedSemesters = async (performedBy = 'SYSTEM') => {
  try {
    console.log('🔄 Starting automatic promotion process...');
    
    const endedSemesters = await getEndedUnprocessedSemesters();
    
    if (endedSemesters.length === 0) {
      console.log('✅ No ended semesters to process');
      return {
        processed: 0,
        semesters: []
      };
    }

    const results = [];

    for (const semester of endedSemesters) {
      console.log(`📚 Processing semester: ${semester.name} (${semester.department?.name})`);
      
      try {
        const promotionResult = await promoteStudentsForSemester(
          semester.department._id,
          semester._id,
          performedBy
        );

        // Mark semester as processed
        semester.promotionProcessed = true;
        semester.promotionProcessedAt = new Date();
        await semester.save();

        results.push({
          semesterId: semester._id,
          semesterName: semester.name,
          department: semester.department?.name,
          ...promotionResult
        });

        console.log(`✅ Semester ${semester.name}: ${promotionResult.promoted.length} promoted, ${promotionResult.madeAlumni.length} alumni, ${promotionResult.detained.length} detained`);
      } catch (err) {
        console.error(`❌ Error processing semester ${semester.name}:`, err.message);
        results.push({
          semesterId: semester._id,
          semesterName: semester.name,
          department: semester.department?.name,
          error: err.message
        });
      }
    }

    console.log('✅ Auto-promotion process completed');
    return {
      processed: results.length,
      semesters: results
    };

  } catch (error) {
    console.error('Error in processEndedSemesters:', error);
    throw error;
  }
};

/**
 * Manual trigger for promotion
 * Called from API endpoint
 * @param {String} departmentId - Optional: specific department
 * @param {String} performedBy - Admin/System user ID
 * @returns {Promise<Object>} Promotion results
 */
const manualPromotionTrigger = async (departmentId = null, performedBy = 'ADMIN') => {
  try {
    if (departmentId) {
      // Promote single department
      const semester = await getActiveSemester(departmentId);
      if (!semester) {
        throw new Error('No active semester found for this department');
      }

      if (!isSemesterEnded(semester)) {
        throw new Error('Semester has not ended yet');
      }

      return await promoteStudentsForSemester(departmentId, semester._id, performedBy);
    } else {
      // Process all ended semesters
      return await processEndedSemesters(performedBy);
    }
  } catch (error) {
    console.error('Error in manualPromotionTrigger:', error);
    throw error;
  }
};

module.exports = {
  isSemesterEnded,
  getActiveSemester,
  getEndedUnprocessedSemesters,
  promoteStudentsForSemester,
  processEndedSemesters,
  manualPromotionTrigger,
  ensureSectionExists
};

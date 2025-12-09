const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const User = require('../models/User');
const Department = require('../models/Department');
const { writeAudit } = require('../utils/audit');
const bcrypt = require('bcrypt');

/**
 * Imports Controller
 * Handles bulk student imports via CSV
 */

/**
 * Bulk import students from CSV file
 * POST /api/imports/students
 * Body: { departmentId, batchYear, programme? }
 * File: multipart file (CSV)
 */
const bulkImportStudents = async (req, res, next) => {
  try {
    const { departmentId, batchYear, programme = 'B.Tech' } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Verify department exists
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    const filePath = req.file.path;
    const students = [];
    let parseError = null;

    // Parse CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', row => {
          // Basic validation
          if (row.name && (row.email || row.rollNo)) {
            students.push({
              ...row,
              departmentId,
              batchYear: parseInt(batchYear),
              programme,
            });
          }
        })
        .on('error', err => {
          parseError = err;
          reject(err);
        })
        .on('end', () => resolve());
    });

    if (parseError) {
      return res.status(400).json({ error: 'CSV parsing failed', details: parseError.message });
    }

    if (students.length === 0) {
      return res.status(400).json({ error: 'No valid student records found in CSV' });
    }

    // Process students
    const created = [];
    const errors = [];
    const tempPassword = 'TempPass@123';
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    for (const studentData of students) {
      try {
        // Check if student already exists
        const existing = await User.findOne({
          $or: [
            { email: studentData.email },
            { rollNo: studentData.rollNo },
          ],
        });

        if (existing) {
          errors.push({
            row: studentData,
            error: 'Student already exists',
          });
          continue;
        }

        // Determine batchYear: form value overrides CSV, accept common header variants, trim spaces
        const csvBatchYearRaw = studentData.batchYear || studentData.batchyear || studentData['batch year'] || studentData.batch_year;
        const parsedCsvBatchYear = csvBatchYearRaw ? parseInt(String(csvBatchYearRaw).trim(), 10) : null;
        let effectiveBatchYear = batchYear ? parseInt(batchYear, 10) : parsedCsvBatchYear;

        // If still missing, try deriving from yearOfStudy if provided
        if (!effectiveBatchYear && studentData.yearOfStudy) {
          const yos = parseInt(String(studentData.yearOfStudy).trim(), 10);
          if (!Number.isNaN(yos) && yos >= 1 && yos <= 4) {
            const currentYear = new Date().getFullYear();
            effectiveBatchYear = currentYear - yos + 1;
          }
        }

        if (!effectiveBatchYear) {
          errors.push({
            row: studentData,
            error: 'Batch year missing in both form and CSV (or could not be derived from yearOfStudy)',
          });
          continue;
        }

        // Determine year of study - use CSV year if provided, otherwise calculate from batch year
        let yearOfStudy;
        if (studentData.year || studentData.yearOfStudy) {
          yearOfStudy = parseInt(studentData.year || studentData.yearOfStudy);
        } else {
          const currentYear = new Date().getFullYear();
          yearOfStudy = currentYear - effectiveBatchYear;
        }

        if (yearOfStudy < 1 || yearOfStudy > 4) {
          errors.push({
            row: studentData,
            error: `Invalid yearOfStudy: ${yearOfStudy} (must be 1-4)`,
          });
          continue;
        }

        // Create student account
        const newStudent = await User.create({
          name: studentData.name,
          email: studentData.email || `student_${studentData.rollNo}@college.edu`,
          rollNo: studentData.rollNo,
          passwordHash: studentData.password ? await bcrypt.hash(studentData.password, 12) : hashedPassword,
          role: 'student',
          department: studentData.departmentId || departmentId,
          programme: studentData.programme || 'B.Tech',
          batchYear: effectiveBatchYear,
          yearOfStudy,
          semester: studentData.semester ? parseInt(studentData.semester) : (yearOfStudy * 2 - 1),
          semesterLabel: (() => {
            const sem = studentData.semester ? parseInt(studentData.semester) : (yearOfStudy * 2 - 1);
            const year = Math.ceil(sem / 2);
            const part = sem % 2 === 1 ? 1 : 2;
            return `${year}-${part}`;
          })(),
          section: studentData.section,
          academicStartDate: studentData.academicStartDate ? new Date(studentData.academicStartDate) : undefined,
          academicEndDate: studentData.academicStartDate ? (() => {
            const start = new Date(studentData.academicStartDate);
            start.setFullYear(start.getFullYear() + 4);
            return start;
          })() : undefined,
        });

        created.push({
          id: newStudent._id,
          name: newStudent.name,
          email: newStudent.email,
          rollNo: newStudent.rollNo,
          tempPassword,
        });
      } catch (err) {
        errors.push({
          row: studentData,
          error: err.message,
        });
      }
    }

    // Write audit log
    await writeAudit({
      actorId: req.user.id,
      action: 'BULK_IMPORT_STUDENTS',
      targetCollection: 'user',
      meta: {
        departmentId,
        batchYear,
        totalProcessed: students.length,
        createdCount: created.length,
        errorCount: errors.length,
        createdSample: created.slice(0, 5),
      },
    });

    res.json({
      success: true,
      summary: {
        total: students.length,
        created: created.length,
        failed: errors.length,
      },
      created: created.slice(0, 10), // Return first 10 with temp passwords
      errors: errors.slice(0, 10),
      message: `Successfully imported ${created.length} students. They must change password on first login.`,
    });

    // Clean up file
    fs.unlink(filePath, err => {
      if (err) console.error('Failed to delete temp file:', err);
    });
  } catch (error) {
    // Clean up file
    if (req.file) {
      fs.unlink(req.file.path, err => {
        if (err) console.error('Failed to delete temp file:', err);
      });
    }
    next(error);
  }
};

module.exports = {
  bulkImportStudents,
};

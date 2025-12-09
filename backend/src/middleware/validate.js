const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation middleware & schemas for the campus attendance system
 * Centralized input validation using express-validator
 */

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

/**
 * Validation schemas
 */
const schemas = {
  // Bulk import students CSV validation
  csvImportStudents: [
    body('departmentId')
      .trim()
      .notEmpty()
      .withMessage('Department ID is required')
      .isMongoId()
      .withMessage('Invalid department ID format'),
    body('batchYear')
      .optional()
      .isInt({ min: 2020, max: 2030 })
      .withMessage('Batch year must be between 2020 and 2030'),
    body('programme')
      .optional()
      .trim()
      .isIn(['B.Tech', 'M.Tech', 'B.Sc', 'M.Sc'])
      .withMessage('Invalid programme'),
  ],

  // Attendance bulk upsert validation
  attendanceBulkMark: [
    param('sessionId')
      .isMongoId()
      .withMessage('Invalid session ID'),
    body('records')
      .isArray({ min: 1 })
      .withMessage('Records must be a non-empty array'),
    body('records.*.studentId')
      .isMongoId()
      .withMessage('Invalid student ID'),
    body('records.*.status')
      .isIn(['present', 'absent', 'late', 'leave'])
      .withMessage('Invalid attendance status'),
  ],

  // Timetable import validation
  timetableImport: [
    body('courseCode')
      .trim()
      .notEmpty()
      .withMessage('Course code is required'),
    body('dayOfWeek')
      .isInt({ min: 0, max: 6 })
      .withMessage('Day of week must be 0-6'),
    body('startTime')
      .matches(/^\d{2}:\d{2}$/)
      .withMessage('Start time must be HH:MM format'),
    body('endTime')
      .matches(/^\d{2}:\d{2}$/)
      .withMessage('End time must be HH:MM format'),
    body('yearOfStudy')
      .isInt({ min: 1, max: 4 })
      .withMessage('Year of study must be 1-4'),
    body('semester')
      .isInt({ min: 1, max: 8 })
      .withMessage('Semester must be 1-8'),
    body('eligibleBatches')
      .isArray()
      .withMessage('Eligible batches must be an array'),
  ],

  // Export custom template validation
  exportCustom: [
    body('templateName')
      .trim()
      .notEmpty()
      .withMessage('Template name is required'),
    body('format')
      .isIn(['csv', 'xlsx', 'pdf'])
      .withMessage('Format must be csv, xlsx, or pdf'),
    body('filters')
      .optional()
      .isObject()
      .withMessage('Filters must be an object'),
  ],

  // Course analytics query validation
  courseAnalyticsQuery: [
    param('courseId')
      .isMongoId()
      .withMessage('Invalid course ID'),
    query('from')
      .optional()
      .isISO8601()
      .withMessage('Invalid from date'),
    query('to')
      .optional()
      .isISO8601()
      .withMessage('Invalid to date'),
    query('batchYear')
      .optional()
      .isInt({ min: 2020, max: 2030 })
      .withMessage('Invalid batch year'),
    query('yearOfStudy')
      .optional()
      .isInt({ min: 1, max: 4 })
      .withMessage('Invalid year of study'),
  ],

  // Attendance undo validation
  attendanceUndo: [
    param('sessionId')
      .isMongoId()
      .withMessage('Invalid session ID'),
  ],

  // Attendance single undo validation
  attendanceSingleUndo: [
    param('attendanceId')
      .isMongoId()
      .withMessage('Invalid attendance ID'),
  ],

  // Timetable generate sessions validation
  timetableGenerateSessions: [
    param('timetableId')
      .isMongoId()
      .withMessage('Invalid timetable ID'),
    query('from')
      .notEmpty()
      .isISO8601()
      .withMessage('From date is required and must be ISO8601'),
    query('to')
      .notEmpty()
      .isISO8601()
      .withMessage('To date is required and must be ISO8601'),
    query('batchYear')
      .optional()
      .isInt({ min: 2020, max: 2030 })
      .withMessage('Invalid batch year'),
  ],

  // Pagination queries
  paginationQuery: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('sort')
      .optional()
      .isIn(['asc', 'desc', 'createdAt', '-createdAt'])
      .withMessage('Invalid sort order'),
    query('search')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Search query must be 1-100 characters'),
  ],
};

module.exports = {
  handleValidationErrors,
  schemas,
};

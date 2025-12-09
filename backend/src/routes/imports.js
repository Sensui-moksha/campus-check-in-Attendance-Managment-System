const express = require('express');
const multer = require('multer');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { schemas, handleValidationErrors } = require('../middleware/validate');
const { bulkImportStudents } = require('../controllers/importsController');

// Configure multer
const upload = multer({ dest: 'uploads/' });

/**
 * POST /api/imports/students
 * Bulk import students via CSV
 * Auth: admin|principal|hod
 */
router.post(
  '/students',
  auth,
  authorize(['admin', 'principal', 'hod']),
  upload.single('file'),
  schemas.csvImportStudents,
  handleValidationErrors,
  bulkImportStudents
);

module.exports = router;

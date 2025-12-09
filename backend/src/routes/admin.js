const express = require('express');
const router = express.Router();
const bulkUploadController = require('../controllers/bulkUploadController');
const authenticate = require('../middleware/auth');
const multer = require('multer');

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

/**
 * Bulk Upload Routes
 * CSV template download and bulk user creation
 */

// Download CSV template for user bulk upload
router.get('/csv-templates/users/download', authenticate, bulkUploadController.downloadUserTemplate);

// Bulk upload users via CSV
router.post('/users/bulk-upload', authenticate, upload.single('file'), bulkUploadController.bulkUploadUsers);

module.exports = router;

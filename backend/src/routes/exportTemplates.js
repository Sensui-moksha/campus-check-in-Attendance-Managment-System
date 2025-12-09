const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { getTemplates, createTemplate, deleteTemplate, exportWithTemplate } = require('../controllers/exportTemplateController');

router.get('/', auth, authorize(['admin', 'principal', 'hod']), getTemplates);

/**
 * POST /api/admin/export-templates
 * Create a new export template
 * Auth: admin|principal|hod
 */
router.post('/', auth, authorize(['admin', 'principal', 'hod']), createTemplate);

/**
 * DELETE /api/admin/export-templates/:id
 * Delete an export template
 * Auth: admin|principal|hod
 */
router.delete('/:id', auth, authorize(['admin', 'principal', 'hod']), deleteTemplate);

/**
 * POST /api/exports/template/execute
 * Export using a saved template
 * Body: { templateId, format, courseId?, departmentId? }
 * Auth: admin|principal|hod
 */
router.post('/execute', auth, authorize(['admin', 'principal', 'hod']), exportWithTemplate);

module.exports = router;

const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const userController = require('../controllers/userController');
const attendanceController = require('../controllers/attendanceController');

const router = express.Router();

/**
 * POST /api/users/bulk-delete (must be before POST /api/users)
 * Bulk delete users (admin/principal only)
 */
router.post('/users/bulk-delete', auth, authorize(['admin', 'principal', 'hod']), userController.bulkDeleteUsers);

/**
 * POST /api/users
 * Create new user (admin/principal only)
 */
router.post('/users', auth, authorize(['admin', 'principal', 'hod']), (req, res, next) => {
  console.log('Create user request body:', JSON.stringify(req.body, null, 2));
  next();
}, userController.createUser);

/**
 * GET /api/users
 * List users by role (restricted: no students)
 */
router.get('/users', auth, authorize(['admin', 'principal', 'hod', 'teacher']), userController.listByRole);

/**
 * GET /api/students
 * List all students with optional filters
 */
router.get('/students', auth, userController.listStudents);

/**
 * GET /api/teachers
 * List all teachers with optional filters
 */
router.get('/teachers', auth, userController.listTeachers);

/**
 * GET /api/departments/:deptId/students
 * List students by department
 */
router.get('/departments/:deptId/students', auth, authorize(['hod', 'admin', 'principal']), userController.listStudentsByDept);

/**
 * GET /api/students/section
 * Get students by section and department
 * Query params: departmentId, sectionId, yearOfStudy, page, limit
 */
router.get('/students/section', auth, authorize(['teacher', 'hod', 'admin', 'principal']), userController.getStudentsBySection);

/**
 * GET /api/students/:studentId/attendance
 * Get subject-wise and monthly attendance for a student
 */
router.get('/students/:studentId/attendance', auth, authorize(['admin', 'principal', 'hod', 'teacher']), userController.getStudentAttendance);

/**
 * GET /api/students/:studentId
 * Get single student
 */
router.get('/students/:studentId', auth, authorize(['admin', 'principal', 'hod', 'teacher']), userController.getStudent);

/**
 * PUT /api/students/:studentId
 * Update student
 */
router.put('/students/:studentId', auth, authorize(['admin', 'principal', 'hod']), userController.updateStudent);

/**
 * DELETE /api/students/:studentId
 * Delete student (admin/principal only)
 */
router.delete('/students/:studentId', auth, authorize(['admin', 'principal', 'hod']), userController.deleteStudent);

/**
 * GET /api/users/:userId/attendance
 * Get monthly attendance calendar for a user
 * Query: month=YYYY-MM
 */
router.get('/users/:userId/attendance', auth, attendanceController.getMonthlyAttendance);

module.exports = router;

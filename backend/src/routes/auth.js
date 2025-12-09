const express = require('express');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/login
 * Login with email or rollNo + password
 * Sets secure cookie with session token
 */
router.post('/login', authController.login);

/**
 * POST /api/auth/logout
 * Logout and invalidate session
 */
router.post('/logout', auth, authController.logout);

/**
 * GET /api/auth/me
 * Get current user from session
 */
router.get('/me', auth, authController.getCurrentUser);

module.exports = router;

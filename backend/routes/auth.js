const express = require('express');
const rateLimit = require('express-rate-limit');
const { 
    register,
    login,
    getProfile,
    updateProfile,
    changePassword,
    verifyToken,
    refreshToken
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * Rate limiting for auth routes
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: {
        error: 'Too many authentication attempts, please try again later',
        success: false
    },
    standardHeaders: true,
    legacyHeaders: false
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 login attempts per windowMs
    message: {
        error: 'Too many login attempts, please try again later',
        success: false
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * ===================================
 * PUBLIC AUTHENTICATION ROUTES
 * ===================================
 */

/**
 * User registration
 * @route POST /api/auth/register
 * @access Public
 */
router.post('/register', authLimiter, register);

/**
 * User login
 * @route POST /api/auth/login
 * @access Public
 */
router.post('/login', loginLimiter, login);

/**
 * ===================================
 * PROTECTED AUTHENTICATION ROUTES
 * ===================================
 */

/**
 * Verify token validity
 * @route GET /api/auth/verify
 * @access Private
 */
router.get('/verify', authenticateToken, verifyToken);

/**
 * Refresh authentication token
 * @route POST /api/auth/refresh
 * @access Private
 */
router.post('/refresh', authenticateToken, refreshToken);

/**
 * Get current user profile
 * @route GET /api/auth/profile
 * @access Private
 */
router.get('/profile', authenticateToken, getProfile);

/**
 * Update user profile
 * @route PUT /api/auth/profile
 * @access Private
 */
router.put('/profile', authenticateToken, updateProfile);

/**
 * Change user password
 * @route POST /api/auth/change-password
 * @access Private
 */
router.post('/change-password', authenticateToken, changePassword);

/**
 * ===================================
 * LOGOUT ROUTE (CLIENT-SIDE)
 * ===================================
 * Note: Since we're using stateless JWT tokens, logout is handled
 * client-side by removing the token from storage. For added security,
 * you could implement a token blacklist using Redis.
 */e

module.exports = router;
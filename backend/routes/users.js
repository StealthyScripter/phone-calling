const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { 
    createUser,
    getUserById,
    getAllUsers,
    updateUser,
    deleteUser,
    getUserCallHistory,
    getUserCallStats,
    findUserByEmail,
    findUserByPhone
} = require('../controllers/userController');

const {
    getContactsByUserId,
    searchContacts
} = require('../controllers/contactController');

/**
 * ===================================
 * PUBLIC USER ROUTES (No auth required)
 * ===================================
 */

/**
 * Create user (public for initial setup)
 * This is kept public for backward compatibility and initial user creation
 * In production, you might want to protect this or use only the auth/register endpoint
 */
router.post('/', createUser);

/**
 * ===================================
 * PROTECTED USER ROUTES
 * ===================================
 */

/**
 * Get all users - ADMIN ONLY
 * Only admin users can see all users
 */
router.get('/', authenticateToken, authorizeRoles(['ADMIN', 'SUPER_ADMIN']), getAllUsers);

/**
 * Get user by ID - PROTECTED
 * Users can only access their own data, admins can access any user
 */
router.get('/:id', authenticateToken, getUserById);

/**
 * Update user - PROTECTED
 * Users can only update their own data, admins can update any user
 */
router.put('/:id', authenticateToken, updateUser);

/**
 * Delete user - ADMIN ONLY
 * Only admins can delete users
 */
router.delete('/:id', authenticateToken, authorizeRoles(['ADMIN', 'SUPER_ADMIN']), deleteUser);

/**
 * ===================================
 * USER SEARCH ROUTES - ADMIN ONLY
 * ===================================
 */
router.get('/search/email/:email', authenticateToken, authorizeRoles(['ADMIN', 'SUPER_ADMIN']), findUserByEmail);
router.get('/search/phone/:phone', authenticateToken, authorizeRoles(['ADMIN', 'SUPER_ADMIN']), findUserByPhone);

/**
 * ===================================
 * USER CALL HISTORY ROUTES - PROTECTED
 * ===================================
 */

/**
 * Get user call history - PROTECTED
 * Users can only access their own call history
 */
router.get('/:id/call-history', authenticateToken, getUserCallHistory);

/**
 * Get user call statistics - PROTECTED
 * Users can only access their own call stats
 */
router.get('/:id/call-stats', authenticateToken, getUserCallStats);

/**
 * ===================================
 * USER CONTACTS ROUTES - PROTECTED
 * ===================================
 */

/**
 * Get user contacts - PROTECTED
 * Users can only access their own contacts
 */
router.get('/:userId/contacts', authenticateToken, getContactsByUserId);

/**
 * Search user contacts - PROTECTED
 * Users can only search their own contacts
 */
router.get('/:userId/contacts/search', authenticateToken, searchContacts);

module.exports = router;

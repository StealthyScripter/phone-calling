const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { 
    createContact,
    getContactById,
    updateContact,
    deleteContact,
    toggleContactFavorite,
    getContactCallHistory,
    getContactCallStats
} = require('../controllers/contactController');

/**
 * ===================================
 * PROTECTED CONTACT ROUTES
 * All routes require authentication
 * ===================================
 */

/**
 * Contact management routes - PROTECTED
 * Users can only manage their own contacts
 */
router.post('/', authenticateToken, createContact);
router.get('/:id', authenticateToken, getContactById);
router.put('/:id', authenticateToken, updateContact);
router.delete('/:id', authenticateToken, deleteContact);

/**
 * Contact actions - PROTECTED
 * Users can only modify their own contacts
 */
router.post('/:id/toggle-favorite', authenticateToken, toggleContactFavorite);

/**
 * Contact call history routes - PROTECTED
 * Users can only access call history for their own contacts
 */
router.get('/:id/call-history', authenticateToken, getContactCallHistory);
router.get('/:id/call-stats', authenticateToken, getContactCallStats);

module.exports = router;

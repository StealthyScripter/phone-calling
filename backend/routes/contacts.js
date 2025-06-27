const express = require('express');
const router = express.Router();
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
 * Contact management routes
 */
router.post('/', createContact);
router.get('/:id', getContactById);
router.put('/:id', updateContact);
router.delete('/:id', deleteContact);

/**
 * Contact actions
 */
router.post('/:id/toggle-favorite', toggleContactFavorite);

/**
 * Contact call history routes
 */
router.get('/:id/call-history', getContactCallHistory);
router.get('/:id/call-stats', getContactCallStats);

module.exports = router;
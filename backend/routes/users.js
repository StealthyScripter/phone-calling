const express = require('express');
const router = express.Router();
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
    searchContacts,
    findContactByPhone
} = require('../controllers/contactController');

/**
 * User management routes
 */
router.post('/', createUser);
router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

/**
 * User search routes
 */
router.get('/search/email/:email', findUserByEmail);
router.get('/search/phone/:phone', findUserByPhone);

/**
 * User call history routes
 */
router.get('/:id/call-history', getUserCallHistory);
router.get('/:id/call-stats', getUserCallStats);

/**
 * User contacts routes (nested under users)
 */
router.get('/:userId/contacts', getContactsByUserId);
router.get('/:userId/contacts/search', searchContacts);
router.get('/:userId/contacts/phone/:phone', findContactByPhone);

module.exports = router;
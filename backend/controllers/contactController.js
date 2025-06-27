const Contact = require('../models/contact.model');
const User = require('../models/user.model');
const { logError } = require('../utils/logger');

/**
 * ===================================
 * CONTACT MANAGEMENT OPERATIONS
 * ===================================
 */

/**
 * Create a new contact
 * @route POST /api/contacts
 * @param {Object} req.body - Contact data
 * @returns {Object} Created contact data
 */
const createContact = async (req, res) => {
    try {
        const { user_id, name, phone, email, notes, is_favorite } = req.body;
        
        // Validation
        if (!user_id || !name || !phone) {
            return res.status(400).json({ 
                error: 'user_id, name, and phone are required',
                success: false 
            });
        }

        // Verify user exists
        const user = await User.findById(user_id);
        if (!user) {
            return res.status(404).json({ 
                error: 'User not found',
                success: false 
            });
        }

        // Check if contact with this phone already exists for this user
        const existingContact = await Contact.findByPhone(phone, user_id);
        if (existingContact) {
            return res.status(409).json({ 
                error: 'Contact with this phone number already exists',
                success: false 
            });
        }

        const contact = await Contact.create({
            user_id,
            name,
            phone,
            email,
            notes,
            is_favorite
        });

        res.status(201).json({
            success: true,
            contact: contact.toJSON(),
            message: 'Contact created successfully'
        });

    } catch (error) {
        logError('Contact creation', error, req.body);
        res.status(500).json({ 
            error: 'Failed to create contact',
            success: false,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get contact by ID
 * @route GET /api/contacts/:id
 * @param {string} req.params.id - Contact ID
 * @returns {Object} Contact data
 */
const getContactById = async (req, res) => {
    try {
        const { id } = req.params;
        const contact = await Contact.findById(parseInt(id));

        if (!contact) {
            return res.status(404).json({ 
                error: 'Contact not found',
                success: false 
            });
        }

        res.json({
            success: true,
            contact: contact.toJSON()
        });

    } catch (error) {
        logError('Get contact by ID', error, { id: req.params.id });
        res.status(500).json({ 
            error: 'Failed to fetch contact',
            success: false 
        });
    }
};

/**
 * Get contacts by user ID
 * @route GET /api/users/:userId/contacts
 * @param {string} req.params.userId - User ID
 * @param {Object} req.query - Query parameters
 * @returns {Object} List of contacts
 */
const getContactsByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        const { 
            limit = 100, 
            offset = 0, 
            search = null,
            favoritesOnly = false,
            orderBy = 'name ASC' 
        } = req.query;

        // Verify user exists
        const user = await User.findById(parseInt(userId));
        if (!user) {
            return res.status(404).json({ 
                error: 'User not found',
                success: false 
            });
        }

        const contacts = await Contact.findByUserId(parseInt(userId), {
            limit: parseInt(limit),
            offset: parseInt(offset),
            search,
            favoritesOnly: favoritesOnly === 'true',
            orderBy
        });

        res.json({
            success: true,
            contacts: contacts.map(contact => contact.toJSON()),
            count: contacts.length
        });

    } catch (error) {
        logError('Get contacts by user ID', error, { userId: req.params.userId, query: req.query });
        res.status(500).json({ 
            error: 'Failed to fetch contacts',
            success: false,
            contacts: []
        });
    }
};

/**
 * Update contact
 * @route PUT /api/contacts/:id
 * @param {string} req.params.id - Contact ID
 * @param {Object} req.body - Update data
 * @returns {Object} Updated contact data
 */
const updateContact = async (req, res) => {
    try {
        const { id } = req.params;
        const contact = await Contact.findById(parseInt(id));

        if (!contact) {
            return res.status(404).json({ 
                error: 'Contact not found',
                success: false 
            });
        }

        // Check phone uniqueness if updating phone
        if (req.body.phone && req.body.phone !== contact.phone) {
            const existingContact = await Contact.findByPhone(req.body.phone, contact.user_id);
            if (existingContact) {
                return res.status(409).json({ 
                    error: 'Another contact with this phone number already exists',
                    success: false 
                });
            }
        }

        const success = await contact.update(req.body);

        if (success) {
            res.json({
                success: true,
                contact: contact.toJSON(),
                message: 'Contact updated successfully'
            });
        } else {
            res.status(400).json({ 
                error: 'No valid fields provided for update',
                success: false 
            });
        }

    } catch (error) {
        logError('Update contact', error, { id: req.params.id, body: req.body });
        res.status(500).json({ 
            error: 'Failed to update contact',
            success: false 
        });
    }
};

/**
 * Delete contact
 * @route DELETE /api/contacts/:id
 * @param {string} req.params.id - Contact ID
 * @returns {Object} Deletion confirmation
 */
const deleteContact = async (req, res) => {
    try {
        const { id } = req.params;
        const contact = await Contact.findById(parseInt(id));

        if (!contact) {
            return res.status(404).json({ 
                error: 'Contact not found',
                success: false 
            });
        }

        const success = await contact.delete();

        if (success) {
            res.json({
                success: true,
                message: 'Contact deleted successfully'
            });
        } else {
            res.status(500).json({ 
                error: 'Failed to delete contact',
                success: false 
            });
        }

    } catch (error) {
        logError('Delete contact', error, { id: req.params.id });
        res.status(500).json({ 
            error: 'Failed to delete contact',
            success: false 
        });
    }
};

/**
 * Toggle contact favorite status
 * @route POST /api/contacts/:id/toggle-favorite
 * @param {string} req.params.id - Contact ID
 * @returns {Object} Updated contact data
 */
const toggleContactFavorite = async (req, res) => {
    try {
        const { id } = req.params;
        const contact = await Contact.findById(parseInt(id));

        if (!contact) {
            return res.status(404).json({ 
                error: 'Contact not found',
                success: false 
            });
        }

        const success = await contact.toggleFavorite();

        if (success) {
            res.json({
                success: true,
                contact: contact.toJSON(),
                message: `Contact ${contact.is_favorite ? 'added to' : 'removed from'} favorites`
            });
        } else {
            res.status(500).json({ 
                error: 'Failed to toggle favorite status',
                success: false 
            });
        }

    } catch (error) {
        logError('Toggle contact favorite', error, { id: req.params.id });
        res.status(500).json({ 
            error: 'Failed to toggle favorite status',
            success: false 
        });
    }
};

/**
 * ===================================
 * CONTACT SEARCH OPERATIONS
 * ===================================
 */

/**
 * Search contacts
 * @route GET /api/users/:userId/contacts/search
 * @param {string} req.params.userId - User ID
 * @param {Object} req.query - Search parameters
 * @returns {Object} Search results
 */
const searchContacts = async (req, res) => {
    try {
        const { userId } = req.params;
        const { 
            q: searchTerm, 
            limit = 50, 
            offset = 0 
        } = req.query;

        if (!searchTerm) {
            return res.status(400).json({ 
                error: 'Search term (q) is required',
                success: false 
            });
        }

        // Verify user exists
        const user = await User.findById(parseInt(userId));
        if (!user) {
            return res.status(404).json({ 
                error: 'User not found',
                success: false 
            });
        }

        const contacts = await Contact.search(searchTerm, parseInt(userId), {
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            contacts: contacts.map(contact => contact.toJSON()),
            searchTerm,
            count: contacts.length
        });

    } catch (error) {
        logError('Search contacts', error, { userId: req.params.userId, query: req.query });
        res.status(500).json({ 
            error: 'Failed to search contacts',
            success: false,
            contacts: []
        });
    }
};

/**
 * Find contact by phone number
 * @route GET /api/users/:userId/contacts/phone/:phone
 * @param {string} req.params.userId - User ID
 * @param {string} req.params.phone - Phone number
 * @returns {Object} Contact data
 */
const findContactByPhone = async (req, res) => {
    try {
        const { userId, phone } = req.params;

        // Verify user exists
        const user = await User.findById(parseInt(userId));
        if (!user) {
            return res.status(404).json({ 
                error: 'User not found',
                success: false 
            });
        }

        const contact = await Contact.findByPhone(phone, parseInt(userId));

        if (!contact) {
            return res.status(404).json({ 
                error: 'Contact not found',
                success: false 
            });
        }

        res.json({
            success: true,
            contact: contact.toJSON()
        });

    } catch (error) {
        logError('Find contact by phone', error, { userId: req.params.userId, phone: req.params.phone });
        res.status(500).json({ 
            error: 'Failed to find contact',
            success: false 
        });
    }
};

/**
 * ===================================
 * CONTACT CALL HISTORY OPERATIONS
 * ===================================
 */

/**
 * Get contact's call history
 * @route GET /api/contacts/:id/call-history
 * @param {string} req.params.id - Contact ID
 * @param {Object} req.query - Query parameters
 * @returns {Object} Call history data
 */
const getContactCallHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            limit = 50, 
            offset = 0, 
            orderBy = 'created_at DESC' 
        } = req.query;

        const contact = await Contact.findById(parseInt(id));
        if (!contact) {
            return res.status(404).json({ 
                error: 'Contact not found',
                success: false 
            });
        }

        const callHistory = await contact.getCallHistory({
            limit: parseInt(limit),
            offset: parseInt(offset),
            orderBy
        });

        res.json({
            success: true,
            callHistory,
            count: callHistory.length
        });

    } catch (error) {
        logError('Get contact call history', error, { id: req.params.id, query: req.query });
        res.status(500).json({ 
            error: 'Failed to fetch call history',
            success: false,
            callHistory: []
        });
    }
};

/**
 * Get contact's call statistics
 * @route GET /api/contacts/:id/call-stats
 * @param {string} req.params.id - Contact ID
 * @returns {Object} Call statistics
 */
const getContactCallStats = async (req, res) => {
    try {
        const { id } = req.params;

        const contact = await Contact.findById(parseInt(id));
        if (!contact) {
            return res.status(404).json({ 
                error: 'Contact not found',
                success: false 
            });
        }

        const stats = await contact.getCallStats();

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        logError('Get contact call stats', error, { id: req.params.id });
        res.status(500).json({ 
            error: 'Failed to fetch call statistics',
            success: false 
        });
    }
};

module.exports = {
    // Contact management
    createContact,
    getContactById,
    getContactsByUserId,
    updateContact,
    deleteContact,
    toggleContactFavorite,
    
    // Search
    searchContacts,
    findContactByPhone,
    
    // Call history
    getContactCallHistory,
    getContactCallStats
};
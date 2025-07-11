const { PrismaClient } = require('@prisma/client');
const { logError, logger } = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * ===================================
 * AUTHENTICATED CONTACT OPERATIONS
 * ===================================
 */

/**
 * Create a new contact (AUTHENTICATED)
 * @route POST /api/contacts
 * @access Private (requires JWT token)
 */
const createContact = async (req, res) => {
    try {
        const { name, phone, email, notes, is_favorite } = req.body;
        const user_id = req.user.id; // Get from authenticated token
        
        // Validation
        if (!name || !phone) {
            return res.status(400).json({ 
                error: 'Name and phone are required',
                success: false 
            });
        }

        // Check if contact with this phone already exists for this user
        const existingContact = await prisma.contact.findFirst({
            where: {
                phone,
                userId: String(user_id)
            }
        });
        
        if (existingContact) {
            return res.status(409).json({ 
                error: 'Contact with this phone number already exists',
                success: false 
            });
        }

        const contact = await prisma.contact.create({
            data: {
                userId: String(user_id),
                name,
                phone,
                email,
                notes,
                isFavorite: Boolean(is_favorite)
            }
        });

        logger.info('👥 Contact created', { 
            contactId: contact.id, 
            userId: user_id, 
            name, 
            phone 
        });

        res.status(201).json({
            success: true,
            contact: {
                id: contact.id,
                user_id: contact.userId,
                name: contact.name,
                phone: contact.phone,
                email: contact.email,
                notes: contact.notes,
                is_favorite: contact.isFavorite,
                created_at: contact.createdAt,
                updated_at: contact.updatedAt,
                formatted_phone: formatPhoneNumber(contact.phone)
            },
            message: 'Contact created successfully'
        });

    } catch (error) {
        logError('Contact creation', error, { user_id: req.user.id, body: req.body });
        res.status(500).json({ 
            error: 'Failed to create contact',
            success: false,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get contact by ID (AUTHENTICATED)
 * @route GET /api/contacts/:id
 * @access Private (requires JWT token)
 */
const getContactById = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;
        
        const contact = await prisma.contact.findFirst({
            where: { 
                id: String(id),
                userId: String(user_id) // Ensure user owns this contact
            }
        });

        if (!contact) {
            return res.status(404).json({ 
                error: 'Contact not found',
                success: false 
            });
        }

        res.json({
            success: true,
            contact: {
                id: contact.id,
                user_id: contact.userId,
                name: contact.name,
                phone: contact.phone,
                email: contact.email,
                notes: contact.notes,
                is_favorite: contact.isFavorite,
                created_at: contact.createdAt,
                updated_at: contact.updatedAt,
                formatted_phone: formatPhoneNumber(contact.phone)
            }
        });

    } catch (error) {
        logError('Get contact by ID', error, { id: req.params.id, user_id: req.user.id });
        res.status(500).json({ 
            error: 'Failed to fetch contact',
            success: false 
        });
    }
};

/**
 * Get contacts by user ID (AUTHENTICATED)
 * @route GET /api/users/:userId/contacts
 * @access Private (requires JWT token)
 */
const getContactsByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        const authenticated_user_id = req.user.id;
        
        // Users can only access their own contacts
        if (String(userId) !== String(authenticated_user_id)) {
            return res.status(403).json({
                error: 'You can only access your own contacts',
                success: false
            });
        }

        const { 
            limit = 100, 
            offset = 0, 
            search = null,
            favoritesOnly = false,
            orderBy = 'name' 
        } = req.query;

        const where = { userId: String(authenticated_user_id) };

        if (favoritesOnly === 'true') {
            where.isFavorite = true;
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } },
                { email: { contains: search, mode: 'insensitive' } }
            ];
        }

        const contacts = await prisma.contact.findMany({
            where,
            take: parseInt(limit),
            skip: parseInt(offset),
            orderBy: { [orderBy]: 'asc' }
        });

        const formattedContacts = contacts.map(contact => ({
            id: contact.id,
            user_id: contact.userId,
            name: contact.name,
            phone: contact.phone,
            email: contact.email,
            notes: contact.notes,
            is_favorite: contact.isFavorite,
            created_at: contact.createdAt,
            updated_at: contact.updatedAt,
            formatted_phone: formatPhoneNumber(contact.phone)
        }));

        res.json({
            success: true,
            contacts: formattedContacts,
            count: formattedContacts.length
        });

    } catch (error) {
        logError('Get contacts by user ID', error, { userId: req.params.userId, user_id: req.user.id });
        res.status(500).json({ 
            error: 'Failed to fetch contacts',
            success: false,
            contacts: []
        });
    }
};

/**
 * Update contact (AUTHENTICATED)
 * @route PUT /api/contacts/:id
 * @access Private (requires JWT token)
 */
const updateContact = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;
        
        // Check if contact exists and belongs to user
        const existingContact = await prisma.contact.findFirst({
            where: { 
                id: String(id),
                userId: String(user_id)
            }
        });

        if (!existingContact) {
            return res.status(404).json({ 
                error: 'Contact not found',
                success: false 
            });
        }

        // Check phone uniqueness if updating phone
        if (req.body.phone && req.body.phone !== existingContact.phone) {
            const phoneExists = await prisma.contact.findFirst({
                where: {
                    phone: req.body.phone,
                    userId: String(user_id),
                    id: { not: String(id) }
                }
            });
            
            if (phoneExists) {
                return res.status(409).json({ 
                    error: 'Another contact with this phone number already exists',
                    success: false 
                });
            }
        }

        const allowedFields = ['name', 'phone', 'email', 'notes', 'isFavorite'];
        const updateData = {};

        Object.keys(req.body).forEach(key => {
            if (allowedFields.includes(key)) {
                updateData[key] = req.body[key];
            }
            // Handle legacy field mapping
            if (key === 'is_favorite') {
                updateData.isFavorite = Boolean(req.body[key]);
            }
        });

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ 
                error: 'No valid fields provided for update',
                success: false 
            });
        }

        const contact = await prisma.contact.update({
            where: { id: String(id) },
            data: updateData
        });

        logger.info('👥 Contact updated', { contactId: id, user_id, updates: updateData });

        res.json({
            success: true,
            contact: {
                id: contact.id,
                user_id: contact.userId,
                name: contact.name,
                phone: contact.phone,
                email: contact.email,
                notes: contact.notes,
                is_favorite: contact.isFavorite,
                created_at: contact.createdAt,
                updated_at: contact.updatedAt,
                formatted_phone: formatPhoneNumber(contact.phone)
            },
            message: 'Contact updated successfully'
        });

    } catch (error) {
        logError('Update contact', error, { id: req.params.id, user_id: req.user.id });
        res.status(500).json({ 
            error: 'Failed to update contact',
            success: false 
        });
    }
};

/**
 * Delete contact (AUTHENTICATED)
 * @route DELETE /api/contacts/:id
 * @access Private (requires JWT token)
 */
const deleteContact = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;
        
        // Check if contact exists and belongs to user
        const contact = await prisma.contact.findFirst({
            where: { 
                id: String(id),
                userId: String(user_id)
            }
        });

        if (!contact) {
            return res.status(404).json({ 
                error: 'Contact not found',
                success: false 
            });
        }

        await prisma.contact.delete({
            where: { id: String(id) }
        });

        logger.info('👥 Contact deleted', { contactId: id, user_id });

        res.json({
            success: true,
            message: 'Contact deleted successfully'
        });

    } catch (error) {
        logError('Delete contact', error, { id: req.params.id, user_id: req.user.id });
        res.status(500).json({ 
            error: 'Failed to delete contact',
            success: false 
        });
    }
};

/**
 * Toggle contact favorite status (AUTHENTICATED)
 * @route POST /api/contacts/:id/toggle-favorite
 * @access Private (requires JWT token)
 */
const toggleContactFavorite = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;
        
        // Check if contact exists and belongs to user
        const contact = await prisma.contact.findFirst({
            where: { 
                id: String(id),
                userId: String(user_id)
            }
        });

        if (!contact) {
            return res.status(404).json({ 
                error: 'Contact not found',
                success: false 
            });
        }

        const updatedContact = await prisma.contact.update({
            where: { id: String(id) },
            data: { isFavorite: !contact.isFavorite }
        });

        logger.info('👥 Contact favorite toggled', { 
            contactId: id, 
            user_id,
            is_favorite: updatedContact.isFavorite 
        });

        res.json({
            success: true,
            contact: {
                id: updatedContact.id,
                user_id: updatedContact.userId,
                name: updatedContact.name,
                phone: updatedContact.phone,
                email: updatedContact.email,
                notes: updatedContact.notes,
                is_favorite: updatedContact.isFavorite,
                created_at: updatedContact.createdAt,
                updated_at: updatedContact.updatedAt,
                formatted_phone: formatPhoneNumber(updatedContact.phone)
            },
            message: `Contact ${updatedContact.isFavorite ? 'added to' : 'removed from'} favorites`
        });

    } catch (error) {
        logError('Toggle contact favorite', error, { id: req.params.id, user_id: req.user.id });
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
 * Search contacts (AUTHENTICATED)
 * @route GET /api/users/:userId/contacts/search
 * @access Private (requires JWT token)
 */
const searchContacts = async (req, res) => {
    try {
        const { userId } = req.params;
        const authenticated_user_id = req.user.id;
        
        // Users can only search their own contacts
        if (String(userId) !== String(authenticated_user_id)) {
            return res.status(403).json({
                error: 'You can only search your own contacts',
                success: false
            });
        }

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

        const contacts = await prisma.contact.findMany({
            where: {
                userId: String(authenticated_user_id),
                OR: [
                    { name: { contains: searchTerm, mode: 'insensitive' } },
                    { phone: { contains: searchTerm } },
                    { email: { contains: searchTerm, mode: 'insensitive' } }
                ]
            },
            take: parseInt(limit),
            skip: parseInt(offset),
            orderBy: { name: 'asc' }
        });

        const formattedContacts = contacts.map(contact => ({
            id: contact.id,
            user_id: contact.userId,
            name: contact.name,
            phone: contact.phone,
            email: contact.email,
            notes: contact.notes,
            is_favorite: contact.isFavorite,
            created_at: contact.createdAt,
            updated_at: contact.updatedAt,
            formatted_phone: formatPhoneNumber(contact.phone)
        }));

        res.json({
            success: true,
            contacts: formattedContacts,
            searchTerm,
            count: formattedContacts.length
        });

    } catch (error) {
        logError('Search contacts', error, { userId: req.params.userId, user_id: req.user.id });
        res.status(500).json({ 
            error: 'Failed to search contacts',
            success: false,
            contacts: []
        });
    }
};

/**
 * ===================================
 * CONTACT CALL HISTORY OPERATIONS
 * ===================================
 */

/**
 * Get contact's call history (AUTHENTICATED)
 * @route GET /api/contacts/:id/call-history
 * @access Private (requires JWT token)
 */
const getContactCallHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;
        
        // Check if contact exists and belongs to user
        const contact = await prisma.contact.findFirst({
            where: { 
                id: String(id),
                userId: String(user_id)
            }
        });

        if (!contact) {
            return res.status(404).json({ 
                error: 'Contact not found',
                success: false 
            });
        }

        const { 
            limit = 50, 
            offset = 0, 
            orderBy = 'createdAt' 
        } = req.query;

        const calls = await prisma.call.findMany({
            where: { 
                contactId: String(id),
                userId: String(user_id) // Ensure calls belong to authenticated user
            },
            take: parseInt(limit),
            skip: parseInt(offset),
            orderBy: { [orderBy]: 'desc' }
        });

        // Transform to match legacy format
        const callHistory = calls.map(call => ({
            id: call.id,
            call_sid: call.callSid,
            direction: call.direction,
            phone_number: call.phoneNumber,
            status: call.status,
            duration: call.duration,
            started_at: call.startedAt,
            ended_at: call.endedAt,
            created_at: call.createdAt
        }));

        res.json({
            success: true,
            callHistory,
            count: callHistory.length
        });

    } catch (error) {
        logError('Get contact call history', error, { id: req.params.id, user_id: req.user.id });
        res.status(500).json({ 
            error: 'Failed to fetch call history',
            success: false,
            callHistory: []
        });
    }
};

/**
 * Get contact's call statistics (AUTHENTICATED)
 * @route GET /api/contacts/:id/call-stats
 * @access Private (requires JWT token)
 */
const getContactCallStats = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;
        
        // Check if contact exists and belongs to user
        const contact = await prisma.contact.findFirst({
            where: { 
                id: String(id),
                userId: String(user_id)
            }
        });

        if (!contact) {
            return res.status(404).json({ 
                error: 'Contact not found',
                success: false 
            });
        }

        const [totalCalls, inboundCalls, outboundCalls, durationSum, lastCall] = await Promise.all([
            prisma.call.count({ 
                where: { 
                    contactId: String(id),
                    userId: String(user_id)
                } 
            }),
            prisma.call.count({ 
                where: { 
                    contactId: String(id),
                    userId: String(user_id),
                    direction: 'inbound' 
                } 
            }),
            prisma.call.count({ 
                where: { 
                    contactId: String(id),
                    userId: String(user_id),
                    direction: 'outbound' 
                } 
            }),
            prisma.call.aggregate({
                where: { 
                    contactId: String(id),
                    userId: String(user_id)
                },
                _sum: { duration: true }
            }),
            prisma.call.findFirst({
                where: { 
                    contactId: String(id),
                    userId: String(user_id)
                },
                orderBy: { createdAt: 'desc' },
                select: { createdAt: true }
            })
        ]);

        const totalDuration = durationSum._sum.duration || 0;

        res.json({
            success: true,
            stats: {
                totalCalls,
                inboundCalls,
                outboundCalls,
                totalDuration,
                averageDuration: totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0,
                lastCallDate: lastCall ? lastCall.createdAt : null
            }
        });

    } catch (error) {
        logError('Get contact call stats', error, { id: req.params.id, user_id: req.user.id });
        res.status(500).json({ 
            error: 'Failed to fetch call statistics',
            success: false 
        });
    }
};

/**
 * ===================================
 * HELPER FUNCTIONS
 * ===================================
 */

/**
 * Format phone number for display
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone number
 */
function formatPhoneNumber(phone) {
    if (!phone) return '';
    
    // Basic US phone number formatting
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length === 11 && digits[0] === '1') {
        return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    
    return phone;
}

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
    
    // Call history
    getContactCallHistory,
    getContactCallStats
};

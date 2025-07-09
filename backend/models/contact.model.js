const { PrismaClient } = require('@prisma/client');
const { logger, logError } = require('../utils/logger');

const prisma = new PrismaClient();

class Contact {
    constructor(data = {}) {
        this.id = data.id;
        this.user_id = data.userId || data.user_id;
        this.name = data.name;
        this.phone = data.phone;
        this.email = data.email;
        this.notes = data.notes;
        this.is_favorite = Boolean(data.isFavorite ?? data.is_favorite);
        this.created_at = data.createdAt || data.created_at;
        this.updated_at = data.updatedAt || data.updated_at;
    }

    /**
     * Create a new contact
     * @param {Object} contactData - Contact data
     * @returns {Promise<Contact>} Created contact instance
     */
    static async create(contactData) {
        try {
            const { user_id, name, phone, email, notes, is_favorite = false } = contactData;
            
            if (!user_id || !name || !phone) {
                throw new Error('user_id, name, and phone are required');
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
            
            return new Contact(contact);
        } catch (error) {
            logError('Creating contact', error, contactData);
            throw error;
        }
    }

    /**
     * Find contact by ID
     * @param {string} id - Contact ID
     * @returns {Promise<Contact|null>} Contact instance or null
     */
    static async findById(id) {
        try {
            const contact = await prisma.contact.findUnique({
                where: { id: String(id) }
            });
            return contact ? new Contact(contact) : null;
        } catch (error) {
            logError('Finding contact by ID', error, { id });
            return null;
        }
    }

    /**
     * Find contact by phone number and user
     * @param {string} phone - Phone number
     * @param {string} userId - User ID
     * @returns {Promise<Contact|null>} Contact instance or null
     */
    static async findByPhone(phone, userId) {
        try {
            const contact = await prisma.contact.findFirst({
                where: { 
                    phone,
                    userId: String(userId)
                }
            });
            return contact ? new Contact(contact) : null;
        } catch (error) {
            logError('Finding contact by phone', error, { phone, userId });
            return null;
        }
    }

    /**
     * Find contacts by user ID
     * @param {string} userId - User ID
     * @param {Object} options - Query options
     * @returns {Promise<Array<Contact>>} Array of contact instances
     */
    static async findByUserId(userId, options = {}) {
        try {
            const { 
                limit = 100, 
                offset = 0, 
                search = null,
                favoritesOnly = false,
                orderBy = 'name ASC' 
            } = options;

            const where = { userId: String(userId) };

            if (favoritesOnly) {
                where.isFavorite = true;
            }

            if (search) {
                where.OR = [
                    { name: { contains: search, mode: 'insensitive' } },
                    { phone: { contains: search } },
                    { email: { contains: search, mode: 'insensitive' } }
                ];
            }

            // Parse orderBy (e.g., "name ASC" -> { name: 'asc' })
            const [field, direction = 'asc'] = orderBy.toLowerCase().split(' ');
            const orderByClause = { [field]: direction };

            const contacts = await prisma.contact.findMany({
                where,
                take: limit,
                skip: offset,
                orderBy: orderByClause
            });

            return contacts.map(contact => new Contact(contact));
        } catch (error) {
            logError('Finding contacts by user ID', error, { userId, options });
            return [];
        }
    }

    /**
     * Search contacts by name or phone
     * @param {string} searchTerm - Search term
     * @param {string} userId - User ID
     * @param {Object} options - Query options
     * @returns {Promise<Array<Contact>>} Array of matching contacts
     */
    static async search(searchTerm, userId, options = {}) {
        try {
            const { limit = 50, offset = 0 } = options;
            
            const where = {
                userId: String(userId),
                OR: [
                    { name: { contains: searchTerm, mode: 'insensitive' } },
                    { phone: { contains: searchTerm } },
                    { email: { contains: searchTerm, mode: 'insensitive' } }
                ]
            };

            const contacts = await prisma.contact.findMany({
                where,
                take: limit,
                skip: offset,
                orderBy: [
                    { name: 'asc' }
                ]
            });
            
            return contacts.map(contact => new Contact(contact));
        } catch (error) {
            logError('Searching contacts', error, { searchTerm, userId, options });
            return [];
        }
    }

    /**
     * Update contact data
     * @param {Object} updates - Fields to update
     * @returns {Promise<boolean>} Success status
     */
    async update(updates) {
        try {
            const allowedFields = ['name', 'phone', 'email', 'notes', 'isFavorite'];
            const updateData = {};

            Object.keys(updates).forEach(key => {
                if (allowedFields.includes(key)) {
                    updateData[key] = updates[key];
                }
                // Handle legacy field mappings
                if (key === 'is_favorite') {
                    updateData.isFavorite = Boolean(updates[key]);
                }
            });

            if (Object.keys(updateData).length === 0) {
                return false;
            }

            const contact = await prisma.contact.update({
                where: { id: this.id },
                data: updateData
            });

            // Update instance properties
            Object.assign(this, new Contact(contact));

            logger.info('👥 Contact updated', { contactId: this.id, updates: updateData });
            return true;
        } catch (error) {
            logError('Updating contact', error, { contactId: this.id, updates });
            return false;
        }
    }

    /**
     * Delete contact
     * @returns {Promise<boolean>} Success status
     */
    async delete() {
        try {
            await prisma.contact.delete({
                where: { id: this.id }
            });
            logger.info('👥 Contact deleted', { contactId: this.id });
            return true;
        } catch (error) {
            logError('Deleting contact', error, { contactId: this.id });
            return false;
        }
    }

    /**
     * Toggle favorite status
     * @returns {Promise<boolean>} Success status
     */
    async toggleFavorite() {
        try {
            const contact = await prisma.contact.update({
                where: { id: this.id },
                data: { isFavorite: !this.is_favorite }
            });
            
            this.is_favorite = contact.isFavorite;
            
            logger.info('👥 Contact favorite toggled', { 
                contactId: this.id, 
                is_favorite: this.is_favorite 
            });
            
            return true;
        } catch (error) {
            logError('Toggling contact favorite', error, { contactId: this.id });
            return false;
        }
    }

    /**
     * Get call history with this contact
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Array of call history records
     */
    async getCallHistory(options = {}) {
        try {
            const { limit = 50, offset = 0, orderBy = 'createdAt DESC' } = options;
            
            // Parse orderBy
            const [field, direction = 'desc'] = orderBy.toLowerCase().replace('created_at', 'createdat').split(' ');
            const orderByClause = { [field]: direction };

            const calls = await prisma.call.findMany({
                where: { contactId: this.id },
                take: limit,
                skip: offset,
                orderBy: orderByClause
            });

            // Transform to match legacy format
            return calls.map(call => ({
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
        } catch (error) {
            logError('Getting contact call history', error, { contactId: this.id, options });
            return [];
        }
    }

    /**
     * Get call statistics with this contact
     * @returns {Promise<Object>} Call statistics
     */
    async getCallStats() {
        try {
            const [totalCalls, inboundCalls, outboundCalls, durationSum, lastCall] = await Promise.all([
                prisma.call.count({ where: { contactId: this.id } }),
                prisma.call.count({ where: { contactId: this.id, direction: 'inbound' } }),
                prisma.call.count({ where: { contactId: this.id, direction: 'outbound' } }),
                prisma.call.aggregate({
                    where: { contactId: this.id },
                    _sum: { duration: true }
                }),
                prisma.call.findFirst({
                    where: { contactId: this.id },
                    orderBy: { createdAt: 'desc' },
                    select: { createdAt: true }
                })
            ]);

            const totalDuration = durationSum._sum.duration || 0;

            return {
                totalCalls,
                inboundCalls,
                outboundCalls,
                totalDuration,
                averageDuration: totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0,
                lastCallDate: lastCall ? lastCall.createdAt : null
            };
        } catch (error) {
            logError('Getting contact call stats', error, { contactId: this.id });
            return {
                totalCalls: 0,
                inboundCalls: 0,
                outboundCalls: 0,
                totalDuration: 0,
                averageDuration: 0,
                lastCallDate: null
            };
        }
    }

    /**
     * Format phone number for display
     * @returns {string} Formatted phone number
     */
    getFormattedPhone() {
        if (!this.phone) return '';
        
        // Basic US phone number formatting
        const digits = this.phone.replace(/\D/g, '');
        if (digits.length === 10) {
            return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
        } else if (digits.length === 11 && digits[0] === '1') {
            return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
        }
        
        return this.phone;
    }

    /**
     * Convert contact instance to JSON
     * @returns {Object} Contact data as plain object
     */
    toJSON() {
        return {
            id: this.id,
            user_id: this.user_id,
            name: this.name,
            phone: this.phone,
            email: this.email,
            notes: this.notes,
            is_favorite: this.is_favorite,
            created_at: this.created_at,
            updated_at: this.updated_at,
            formatted_phone: this.getFormattedPhone()
        };
    }
}

module.exports = Contact;

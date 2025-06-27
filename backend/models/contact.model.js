const database = require('../utils/database');
const { logger, logError } = require('../utils/logger');

class Contact {
    constructor(data = {}) {
        this.id = data.id;
        this.user_id = data.user_id;
        this.name = data.name;
        this.phone = data.phone;
        this.email = data.email;
        this.notes = data.notes;
        this.is_favorite = Boolean(data.is_favorite);
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
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

            const result = await database.run(
                `INSERT INTO contacts (user_id, name, phone, email, notes, is_favorite, updated_at) 
                 VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                [user_id, name, phone, email, notes, is_favorite ? 1 : 0]
            );

            const contact = await Contact.findById(result.lastID);
            logger.info('👥 Contact created', { 
                contactId: result.lastID, 
                userId: user_id, 
                name, 
                phone 
            });
            
            return contact;
        } catch (error) {
            logError('Creating contact', error, contactData);
            throw error;
        }
    }

    /**
     * Find contact by ID
     * @param {number} id - Contact ID
     * @returns {Promise<Contact|null>} Contact instance or null
     */
    static async findById(id) {
        try {
            const row = await database.get('SELECT * FROM contacts WHERE id = ?', [id]);
            return row ? new Contact(row) : null;
        } catch (error) {
            logError('Finding contact by ID', error, { id });
            return null;
        }
    }

    /**
     * Find contact by phone number and user
     * @param {string} phone - Phone number
     * @param {number} userId - User ID
     * @returns {Promise<Contact|null>} Contact instance or null
     */
    static async findByPhone(phone, userId) {
        try {
            const row = await database.get(
                'SELECT * FROM contacts WHERE phone = ? AND user_id = ?', 
                [phone, userId]
            );
            return row ? new Contact(row) : null;
        } catch (error) {
            logError('Finding contact by phone', error, { phone, userId });
            return null;
        }
    }

    /**
     * Find contacts by user ID
     * @param {number} userId - User ID
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

            let query = 'SELECT * FROM contacts WHERE user_id = ?';
            const params = [userId];

            if (favoritesOnly) {
                query += ' AND is_favorite = 1';
            }

            if (search) {
                query += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)';
                const searchTerm = `%${search}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }

            query += ` ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
            params.push(limit, offset);

            const rows = await database.all(query, params);
            return rows.map(row => new Contact(row));
        } catch (error) {
            logError('Finding contacts by user ID', error, { userId, options });
            return [];
        }
    }

    /**
     * Search contacts by name or phone
     * @param {string} searchTerm - Search term
     * @param {number} userId - User ID
     * @param {Object} options - Query options
     * @returns {Promise<Array<Contact>>} Array of matching contacts
     */
    static async search(searchTerm, userId, options = {}) {
        try {
            const { limit = 50, offset = 0 } = options;
            
            const query = `
                SELECT * FROM contacts 
                WHERE user_id = ? AND (
                    name LIKE ? OR 
                    phone LIKE ? OR 
                    email LIKE ?
                )
                ORDER BY 
                    CASE 
                        WHEN name LIKE ? THEN 1 
                        WHEN phone LIKE ? THEN 2 
                        ELSE 3 
                    END,
                    name ASC
                LIMIT ? OFFSET ?
            `;
            
            const searchPattern = `%${searchTerm}%`;
            const exactPattern = `${searchTerm}%`;
            
            const rows = await database.all(query, [
                userId,
                searchPattern, searchPattern, searchPattern,
                exactPattern, exactPattern,
                limit, offset
            ]);
            
            return rows.map(row => new Contact(row));
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
            const allowedFields = ['name', 'phone', 'email', 'notes', 'is_favorite'];
            const updateFields = [];
            const values = [];

            Object.keys(updates).forEach(key => {
                if (allowedFields.includes(key)) {
                    updateFields.push(`${key} = ?`);
                    const value = key === 'is_favorite' 
                        ? (updates[key] ? 1 : 0) 
                        : updates[key];
                    values.push(value);
                }
            });

            if (updateFields.length === 0) {
                return false;
            }

            updateFields.push('updated_at = CURRENT_TIMESTAMP');
            values.push(this.id);

            await database.run(
                `UPDATE contacts SET ${updateFields.join(', ')} WHERE id = ?`,
                values
            );

            // Update instance properties
            Object.keys(updates).forEach(key => {
                if (allowedFields.includes(key)) {
                    this[key] = key === 'is_favorite' ? Boolean(updates[key]) : updates[key];
                }
            });

            logger.info('👥 Contact updated', { contactId: this.id, updates });
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
            await database.run('DELETE FROM contacts WHERE id = ?', [this.id]);
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
            const newFavoriteStatus = !this.is_favorite;
            const success = await this.update({ is_favorite: newFavoriteStatus });
            
            if (success) {
                logger.info('👥 Contact favorite toggled', { 
                    contactId: this.id, 
                    is_favorite: newFavoriteStatus 
                });
            }
            
            return success;
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
            const { limit = 50, offset = 0, orderBy = 'created_at DESC' } = options;
            
            const query = `
                SELECT * FROM call_history 
                WHERE contact_id = ? 
                ORDER BY ${orderBy} 
                LIMIT ? OFFSET ?
            `;
            
            const rows = await database.all(query, [this.id, limit, offset]);
            return rows;
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
            const [totalCalls, inboundCalls, outboundCalls, totalDuration, lastCall] = await Promise.all([
                database.get('SELECT COUNT(*) as count FROM call_history WHERE contact_id = ?', [this.id]),
                database.get('SELECT COUNT(*) as count FROM call_history WHERE contact_id = ? AND direction = "inbound"', [this.id]),
                database.get('SELECT COUNT(*) as count FROM call_history WHERE contact_id = ? AND direction = "outbound"', [this.id]),
                database.get('SELECT SUM(duration) as total FROM call_history WHERE contact_id = ?', [this.id]),
                database.get('SELECT created_at FROM call_history WHERE contact_id = ? ORDER BY created_at DESC LIMIT 1', [this.id])
            ]);

            return {
                totalCalls: totalCalls.count,
                inboundCalls: inboundCalls.count,
                outboundCalls: outboundCalls.count,
                totalDuration: totalDuration.total || 0,
                averageDuration: totalCalls.count > 0 ? Math.round((totalDuration.total || 0) / totalCalls.count) : 0,
                lastCallDate: lastCall ? lastCall.created_at : null
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
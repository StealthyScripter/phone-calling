const database = require('../utils/database');
const { logger, logError } = require('../utils/logger');

class User {
    constructor(data = {}) {
        this.id = data.id;
        this.name = data.name;
        this.email = data.email;
        this.phone = data.phone;
        this.avatar_url = data.avatar_url;
        this.preferences = typeof data.preferences === 'string' 
            ? JSON.parse(data.preferences) 
            : data.preferences || {};
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    /**
     * Create a new user
     * @param {Object} userData - User data
     * @returns {Promise<User>} Created user instance
     */
    static async create(userData) {
        try {
            const { name, email, phone, avatar_url, preferences = {} } = userData;
            
            const result = await database.run(
                `INSERT INTO users (name, email, phone, avatar_url, preferences, updated_at) 
                 VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                [name, email, phone, avatar_url, JSON.stringify(preferences)]
            );

            const user = await User.findById(result.lastID);
            logger.info('👤 User created', { userId: result.lastID, name, email });
            
            return user;
        } catch (error) {
            logError('Creating user', error, userData);
            throw error;
        }
    }

    /**
     * Find user by ID
     * @param {number} id - User ID
     * @returns {Promise<User|null>} User instance or null
     */
    static async findById(id) {
        try {
            const row = await database.get('SELECT * FROM users WHERE id = ?', [id]);
            return row ? new User(row) : null;
        } catch (error) {
            logError('Finding user by ID', error, { id });
            return null;
        }
    }

    /**
     * Find user by email
     * @param {string} email - User email
     * @returns {Promise<User|null>} User instance or null
     */
    static async findByEmail(email) {
        try {
            const row = await database.get('SELECT * FROM users WHERE email = ?', [email]);
            return row ? new User(row) : null;
        } catch (error) {
            logError('Finding user by email', error, { email });
            return null;
        }
    }

    /**
     * Find user by phone number
     * @param {string} phone - User phone number
     * @returns {Promise<User|null>} User instance or null
     */
    static async findByPhone(phone) {
        try {
            const row = await database.get('SELECT * FROM users WHERE phone = ?', [phone]);
            return row ? new User(row) : null;
        } catch (error) {
            logError('Finding user by phone', error, { phone });
            return null;
        }
    }

    /**
     * Get all users
     * @param {Object} options - Query options
     * @returns {Promise<Array<User>>} Array of user instances
     */
    static async findAll(options = {}) {
        try {
            const { limit = 100, offset = 0, orderBy = 'created_at DESC' } = options;
            
            const rows = await database.all(
                `SELECT * FROM users ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
                [limit, offset]
            );
            
            return rows.map(row => new User(row));
        } catch (error) {
            logError('Finding all users', error, options);
            return [];
        }
    }

    /**
     * Update user data
     * @param {Object} updates - Fields to update
     * @returns {Promise<boolean>} Success status
     */
    async update(updates) {
        try {
            const allowedFields = ['name', 'email', 'phone', 'avatar_url', 'preferences'];
            const updateFields = [];
            const values = [];

            Object.keys(updates).forEach(key => {
                if (allowedFields.includes(key)) {
                    updateFields.push(`${key} = ?`);
                    const value = key === 'preferences' 
                        ? JSON.stringify(updates[key]) 
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
                `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
                values
            );

            // Update instance properties
            Object.keys(updates).forEach(key => {
                if (allowedFields.includes(key)) {
                    this[key] = updates[key];
                }
            });

            logger.info('👤 User updated', { userId: this.id, updates });
            return true;
        } catch (error) {
            logError('Updating user', error, { userId: this.id, updates });
            return false;
        }
    }

    /**
     * Delete user (soft delete by updating record)
     * @returns {Promise<boolean>} Success status
     */
    async delete() {
        try {
            await database.run('DELETE FROM users WHERE id = ?', [this.id]);
            logger.info('👤 User deleted', { userId: this.id });
            return true;
        } catch (error) {
            logError('Deleting user', error, { userId: this.id });
            return false;
        }
    }

    /**
     * Add call to user's call history
     * @param {Object} callData - Call data
     * @returns {Promise<number|null>} Call history ID or null
     */
    async addCallHistory(callData) {
        try {
            const {
                call_sid,
                direction,
                phone_number,
                status,
                duration = 0,
                started_at,
                ended_at,
                contact_id = null
            } = callData;

            const result = await database.run(
                `INSERT INTO call_history 
                 (user_id, contact_id, call_sid, direction, phone_number, status, duration, started_at, ended_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [this.id, contact_id, call_sid, direction, phone_number, status, duration, started_at, ended_at]
            );

            logger.info('📞 Call history added', { 
                userId: this.id, 
                callHistoryId: result.lastID, 
                call_sid,
                direction 
            });
            
            return result.lastID;
        } catch (error) {
            logError('Adding call history', error, { userId: this.id, callData });
            return null;
        }
    }

    /**
     * Update call history record
     * @param {string} call_sid - Twilio call SID
     * @param {Object} updates - Fields to update
     * @returns {Promise<boolean>} Success status
     */
    async updateCallHistory(call_sid, updates) {
        try {
            const allowedFields = ['status', 'duration', 'ended_at'];
            const updateFields = [];
            const values = [];

            Object.keys(updates).forEach(key => {
                if (allowedFields.includes(key)) {
                    updateFields.push(`${key} = ?`);
                    values.push(updates[key]);
                }
            });

            if (updateFields.length === 0) {
                return false;
            }

            values.push(call_sid, this.id);

            const result = await database.run(
                `UPDATE call_history SET ${updateFields.join(', ')} 
                 WHERE call_sid = ? AND user_id = ?`,
                values
            );

            if (result.changes > 0) {
                logger.info('📞 Call history updated', { userId: this.id, call_sid, updates });
                return true;
            }
            
            return false;
        } catch (error) {
            logError('Updating call history', error, { userId: this.id, call_sid, updates });
            return false;
        }
    }

    /**
     * Get user's call history
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Array of call history records
     */
    async getCallHistory(options = {}) {
        try {
            const { 
                limit = 50, 
                offset = 0, 
                direction = null,
                orderBy = 'created_at DESC' 
            } = options;

            let query = `
                SELECT ch.*, c.name as contact_name 
                FROM call_history ch
                LEFT JOIN contacts c ON ch.contact_id = c.id
                WHERE ch.user_id = ?
            `;
            const params = [this.id];

            if (direction) {
                query += ' AND ch.direction = ?';
                params.push(direction);
            }

            query += ` ORDER BY ch.${orderBy} LIMIT ? OFFSET ?`;
            params.push(limit, offset);

            const rows = await database.all(query, params);
            return rows;
        } catch (error) {
            logError('Getting call history', error, { userId: this.id, options });
            return [];
        }
    }

    /**
     * Get call statistics for user
     * @param {Object} options - Date range options
     * @returns {Promise<Object>} Call statistics
     */
    async getCallStats(options = {}) {
        try {
            const { 
                startDate = null, 
                endDate = null 
            } = options;

            let whereClause = 'WHERE user_id = ?';
            const params = [this.id];

            if (startDate) {
                whereClause += ' AND created_at >= ?';
                params.push(startDate);
            }

            if (endDate) {
                whereClause += ' AND created_at <= ?';
                params.push(endDate);
            }

            const [totalCalls, inboundCalls, outboundCalls, totalDuration] = await Promise.all([
                database.get(`SELECT COUNT(*) as count FROM call_history ${whereClause}`, params),
                database.get(`SELECT COUNT(*) as count FROM call_history ${whereClause} AND direction = 'inbound'`, params),
                database.get(`SELECT COUNT(*) as count FROM call_history ${whereClause} AND direction = 'outbound'`, params),
                database.get(`SELECT SUM(duration) as total FROM call_history ${whereClause}`, params)
            ]);

            return {
                totalCalls: totalCalls.count,
                inboundCalls: inboundCalls.count,
                outboundCalls: outboundCalls.count,
                totalDuration: totalDuration.total || 0,
                averageDuration: totalCalls.count > 0 ? Math.round((totalDuration.total || 0) / totalCalls.count) : 0
            };
        } catch (error) {
            logError('Getting call stats', error, { userId: this.id, options });
            return {
                totalCalls: 0,
                inboundCalls: 0,
                outboundCalls: 0,
                totalDuration: 0,
                averageDuration: 0
            };
        }
    }

    /**
     * Convert user instance to JSON
     * @returns {Object} User data as plain object
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            phone: this.phone,
            avatar_url: this.avatar_url,
            preferences: this.preferences,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }
}

module.exports = User;
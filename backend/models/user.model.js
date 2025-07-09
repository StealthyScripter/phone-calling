const { PrismaClient } = require('@prisma/client');
const { logger, logError } = require('../utils/logger');

const prisma = new PrismaClient();

class User {
    constructor(data = {}) {
        this.id = data.id;
        this.name = data.name;
        this.email = data.email;
        this.phone = data.phoneNumber || data.phone;
        this.avatar_url = data.avatarUrl || data.avatar_url;
        this.preferences = typeof data.preferences === 'string' 
            ? JSON.parse(data.preferences) 
            : data.preferences || {};
        this.created_at = data.createdAt || data.created_at;
        this.updated_at = data.updatedAt || data.updated_at;
        
        // Auth fields
        this.username = data.username;
        this.firstName = data.firstName;
        this.lastName = data.lastName;
        this.phoneNumber = data.phoneNumber;
        this.role = data.role;
        this.isActive = data.isActive;
        this.lastLogin = data.lastLogin;
    }

    /**
     * Create a new user
     * @param {Object} userData - User data
     * @returns {Promise<User>} Created user instance
     */
    static async create(userData) {
        try {
            const { name, email, phone, avatar_url, preferences = {}, username, firstName, lastName, phoneNumber } = userData;
            
            const user = await prisma.user.create({
                data: {
                    name,
                    email,
                    phoneNumber: phoneNumber || phone,
                    avatarUrl: avatar_url,
                    preferences,
                    username,
                    firstName,
                    lastName
                }
            });

            logger.info('👤 User created', { userId: user.id, name, email });
            
            return new User(user);
        } catch (error) {
            logError('Creating user', error, userData);
            throw error;
        }
    }

    /**
     * Find user by ID
     * @param {string} id - User ID
     * @returns {Promise<User|null>} User instance or null
     */
    static async findById(id) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: String(id) }
            });
            return user ? new User(user) : null;
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
            const user = await prisma.user.findUnique({
                where: { email }
            });
            return user ? new User(user) : null;
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
            const user = await prisma.user.findFirst({
                where: { phoneNumber: phone }
            });
            return user ? new User(user) : null;
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
            const { limit = 100, offset = 0, orderBy = 'createdAt' } = options;
            
            const users = await prisma.user.findMany({
                take: limit,
                skip: offset,
                orderBy: { [orderBy.replace(' DESC', '').replace(' ASC', '')]: orderBy.includes('DESC') ? 'desc' : 'asc' }
            });
            
            return users.map(user => new User(user));
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
            const allowedFields = ['name', 'email', 'phoneNumber', 'avatarUrl', 'preferences', 'firstName', 'lastName'];
            const updateData = {};

            Object.keys(updates).forEach(key => {
                if (allowedFields.includes(key)) {
                    updateData[key] = updates[key];
                }
                // Handle legacy field mappings
                if (key === 'phone') updateData.phoneNumber = updates[key];
                if (key === 'avatar_url') updateData.avatarUrl = updates[key];
            });

            if (Object.keys(updateData).length === 0) {
                return false;
            }

            const user = await prisma.user.update({
                where: { id: this.id },
                data: updateData
            });

            // Update instance properties
            Object.assign(this, new User(user));

            logger.info('👤 User updated', { userId: this.id, updates: updateData });
            return true;
        } catch (error) {
            logError('Updating user', error, { userId: this.id, updates });
            return false;
        }
    }

    /**
     * Delete user
     * @returns {Promise<boolean>} Success status
     */
    async delete() {
        try {
            await prisma.user.delete({
                where: { id: this.id }
            });
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
     * @returns {Promise<string|null>} Call ID or null
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

            const call = await prisma.call.create({
                data: {
                    callSid: call_sid,
                    userId: this.id,
                    contactId: contact_id,
                    direction,
                    phoneNumber: phone_number,
                    status,
                    duration,
                    startedAt: started_at ? new Date(started_at) : null,
                    endedAt: ended_at ? new Date(ended_at) : null
                }
            });

            logger.info('📞 Call history added', { 
                userId: this.id, 
                callId: call.id, 
                call_sid,
                direction 
            });
            
            return call.id;
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
            const allowedFields = ['status', 'duration', 'endedAt'];
            const updateData = {};

            Object.keys(updates).forEach(key => {
                if (allowedFields.includes(key)) {
                    updateData[key] = updates[key];
                }
                // Handle legacy field mappings
                if (key === 'ended_at') updateData.endedAt = new Date(updates[key]);
            });

            if (Object.keys(updateData).length === 0) {
                return false;
            }

            const result = await prisma.call.updateMany({
                where: { 
                    callSid: call_sid,
                    userId: this.id
                },
                data: updateData
            });

            if (result.count > 0) {
                logger.info('📞 Call history updated', { userId: this.id, call_sid, updates: updateData });
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
                orderBy = 'createdAt' 
            } = options;

            const where = { userId: this.id };
            if (direction) {
                where.direction = direction;
            }

            const calls = await prisma.call.findMany({
                where,
                include: {
                    contact: {
                        select: {
                            name: true
                        }
                    }
                },
                take: limit,
                skip: offset,
                orderBy: { [orderBy.replace(' DESC', '').replace(' ASC', '')]: orderBy.includes('DESC') ? 'desc' : 'asc' }
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
                created_at: call.createdAt,
                contact_name: call.contact?.name || null
            }));
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
            const { startDate = null, endDate = null } = options;

            const where = { userId: this.id };
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate) where.createdAt.gte = new Date(startDate);
                if (endDate) where.createdAt.lte = new Date(endDate);
            }

            const [totalCalls, inboundCalls, outboundCalls, durationSum] = await Promise.all([
                prisma.call.count({ where }),
                prisma.call.count({ where: { ...where, direction: 'inbound' } }),
                prisma.call.count({ where: { ...where, direction: 'outbound' } }),
                prisma.call.aggregate({
                    where,
                    _sum: { duration: true }
                })
            ]);

            const totalDuration = durationSum._sum.duration || 0;

            return {
                totalCalls,
                inboundCalls,
                outboundCalls,
                totalDuration,
                averageDuration: totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0
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
            updated_at: this.updated_at,
            username: this.username,
            firstName: this.firstName,
            lastName: this.lastName,
            phoneNumber: this.phoneNumber,
            role: this.role,
            isActive: this.isActive,
            lastLogin: this.lastLogin
        };
    }
}

module.exports = User;
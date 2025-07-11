const { PrismaClient } = require('@prisma/client');
const { logError, logger } = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * ===================================
 * USER MANAGEMENT OPERATIONS
 * Now using Prisma instead of legacy model
 * ===================================
 */

/**
 * Create a new user
 * @route POST /api/users
 * @param {Object} req.body - User data
 * @returns {Object} Created user data
 */
const createUser = async (req, res) => {
    try {
        const { name, email, phone, avatar_url, preferences, username, firstName, lastName, phoneNumber } = req.body;
        
        // Validation
        if (!name) {
            return res.status(400).json({ 
                error: 'Name is required',
                success: false 
            });
        }

        // Check if email already exists
        if (email) {
            const existingUser = await prisma.user.findUnique({
                where: { email }
            });
            if (existingUser) {
                return res.status(409).json({ 
                    error: 'User with this email already exists',
                    success: false 
                });
            }
        }

        const user = await prisma.user.create({
            data: {
                name,
                email,
                phoneNumber: phoneNumber || phone,
                avatarUrl: avatar_url,
                preferences: preferences || {},
                username,
                firstName,
                lastName
            },
            select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                avatarUrl: true,
                preferences: true,
                username: true,
                firstName: true,
                lastName: true,
                role: true,
                createdAt: true,
                updatedAt: true
            }
        });

        logger.info('👤 User created', { userId: user.id, name, email });

        res.status(201).json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phoneNumber,
                avatar_url: user.avatarUrl,
                preferences: user.preferences,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                created_at: user.createdAt,
                updated_at: user.updatedAt
            },
            message: 'User created successfully'
        });

    } catch (error) {
        logError('User creation', error, req.body);
        res.status(500).json({ 
            error: 'Failed to create user',
            success: false,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get user by ID
 * @route GET /api/users/:id
 * @param {string} req.params.id - User ID
 * @returns {Object} User data
 */
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const authenticated_user_id = req.user.id;
        
        // Users can only access their own data (unless admin)
        if (String(id) !== String(authenticated_user_id) && req.user.role !== 'ADMIN') {
            return res.status(403).json({
                error: 'You can only access your own profile',
                success: false
            });
        }
        
        const user = await prisma.user.findUnique({
            where: { id: String(id) },
            select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                avatarUrl: true,
                preferences: true,
                username: true,
                firstName: true,
                lastName: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: { calls: true, contacts: true }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ 
                error: 'User not found',
                success: false 
            });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phoneNumber,
                avatar_url: user.avatarUrl,
                preferences: user.preferences,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                created_at: user.createdAt,
                updated_at: user.updatedAt,
                call_count: user._count.calls,
                contact_count: user._count.contacts
            }
        });

    } catch (error) {
        logError('Get user by ID', error, { id: req.params.id });
        res.status(500).json({ 
            error: 'Failed to fetch user',
            success: false 
        });
    }
};

/**
 * Get all users (ADMIN only)
 * @route GET /api/users
 * @param {Object} req.query - Query parameters
 * @returns {Object} List of users
 */
const getAllUsers = async (req, res) => {
    try {
        const { 
            limit = 100, 
            offset = 0, 
            orderBy = 'createdAt' 
        } = req.query;

        const users = await prisma.user.findMany({
            take: parseInt(limit),
            skip: parseInt(offset),
            orderBy: { [orderBy]: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                username: true,
                role: true,
                createdAt: true,
                _count: {
                    select: { calls: true, contacts: true }
                }
            }
        });

        const formattedUsers = users.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phoneNumber,
            username: user.username,
            role: user.role,
            created_at: user.createdAt,
            call_count: user._count.calls,
            contact_count: user._count.contacts
        }));

        res.json({
            success: true,
            users: formattedUsers,
            count: formattedUsers.length
        });

    } catch (error) {
        logError('Get all users', error, req.query);
        res.status(500).json({ 
            error: 'Failed to fetch users',
            success: false,
            users: []
        });
    }
};

/**
 * Update user
 * @route PUT /api/users/:id
 * @param {string} req.params.id - User ID
 * @param {Object} req.body - Update data
 * @returns {Object} Updated user data
 */
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const authenticated_user_id = req.user.id;
        
        // Users can only update their own data (unless admin)
        if (String(id) !== String(authenticated_user_id) && req.user.role !== 'ADMIN') {
            return res.status(403).json({
                error: 'You can only update your own profile',
                success: false
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: String(id) }
        });

        if (!user) {
            return res.status(404).json({ 
                error: 'User not found',
                success: false 
            });
        }

        // Check email uniqueness if updating email
        if (req.body.email && req.body.email !== user.email) {
            const existingUser = await prisma.user.findUnique({
                where: { email: req.body.email }
            });
            if (existingUser) {
                return res.status(409).json({ 
                    error: 'Email already in use by another user',
                    success: false 
                });
            }
        }

        const allowedFields = ['name', 'email', 'phoneNumber', 'avatarUrl', 'preferences', 'firstName', 'lastName'];
        const updateData = {};

        Object.keys(req.body).forEach(key => {
            if (allowedFields.includes(key)) {
                updateData[key] = req.body[key];
            }
            // Handle legacy field mappings
            if (key === 'phone') updateData.phoneNumber = req.body[key];
            if (key === 'avatar_url') updateData.avatarUrl = req.body[key];
        });

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ 
                error: 'No valid fields provided for update',
                success: false 
            });
        }

        const updatedUser = await prisma.user.update({
            where: { id: String(id) },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                avatarUrl: true,
                preferences: true,
                username: true,
                firstName: true,
                lastName: true,
                role: true,
                updatedAt: true
            }
        });

        logger.info('👤 User updated', { userId: id, updates: updateData });

        res.json({
            success: true,
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phoneNumber,
                avatar_url: updatedUser.avatarUrl,
                preferences: updatedUser.preferences,
                username: updatedUser.username,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                role: updatedUser.role,
                updated_at: updatedUser.updatedAt
            },
            message: 'User updated successfully'
        });

    } catch (error) {
        logError('Update user', error, { id: req.params.id, body: req.body });
        res.status(500).json({ 
            error: 'Failed to update user',
            success: false 
        });
    }
};

/**
 * Delete user (ADMIN only)
 * @route DELETE /api/users/:id
 * @param {string} req.params.id - User ID
 * @returns {Object} Deletion confirmation
 */
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        const user = await prisma.user.findUnique({
            where: { id: String(id) }
        });

        if (!user) {
            return res.status(404).json({ 
                error: 'User not found',
                success: false 
            });
        }

        await prisma.user.delete({
            where: { id: String(id) }
        });

        logger.info('👤 User deleted', { userId: id });

        res.json({
            success: true,
            message: 'User deleted successfully'
        });

    } catch (error) {
        logError('Delete user', error, { id: req.params.id });
        res.status(500).json({ 
            error: 'Failed to delete user',
            success: false 
        });
    }
};

/**
 * ===================================
 * USER CALL HISTORY OPERATIONS
 * ===================================
 */

/**
 * Get user's call history
 * @route GET /api/users/:id/call-history
 * @param {string} req.params.id - User ID
 * @param {Object} req.query - Query parameters
 * @returns {Object} Call history data
 */
const getUserCallHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const authenticated_user_id = req.user.id;
        
        // Users can only access their own call history
        if (String(id) !== String(authenticated_user_id)) {
            return res.status(403).json({
                error: 'You can only access your own call history',
                success: false
            });
        }

        const { 
            limit = 50, 
            offset = 0, 
            direction = null,
            orderBy = 'createdAt' 
        } = req.query;

        const user = await prisma.user.findUnique({
            where: { id: String(id) }
        });
        
        if (!user) {
            return res.status(404).json({ 
                error: 'User not found',
                success: false 
            });
        }

        const where = { userId: String(id) };
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
            created_at: call.createdAt,
            contact_name: call.contact?.name || null
        }));

        res.json({
            success: true,
            callHistory,
            count: callHistory.length
        });

    } catch (error) {
        logError('Get user call history', error, { id: req.params.id, query: req.query });
        res.status(500).json({ 
            error: 'Failed to fetch call history',
            success: false,
            callHistory: []
        });
    }
};

/**
 * Get user's call statistics
 * @route GET /api/users/:id/call-stats
 * @param {string} req.params.id - User ID
 * @param {Object} req.query - Date range parameters
 * @returns {Object} Call statistics
 */
const getUserCallStats = async (req, res) => {
    try {
        const { id } = req.params;
        const authenticated_user_id = req.user.id;
        
        // Users can only access their own call stats
        if (String(id) !== String(authenticated_user_id)) {
            return res.status(403).json({
                error: 'You can only access your own call statistics',
                success: false
            });
        }

        const { startDate, endDate } = req.query;

        const user = await prisma.user.findUnique({
            where: { id: String(id) }
        });
        
        if (!user) {
            return res.status(404).json({ 
                error: 'User not found',
                success: false 
            });
        }

        const where = { userId: String(id) };
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

        const stats = {
            totalCalls,
            inboundCalls,
            outboundCalls,
            totalDuration,
            averageDuration: totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0
        };

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        logError('Get user call stats', error, { id: req.params.id, query: req.query });
        res.status(500).json({ 
            error: 'Failed to fetch call statistics',
            success: false 
        });
    }
};

/**
 * ===================================
 * USER SEARCH OPERATIONS (ADMIN only)
 * ===================================
 */

/**
 * Find user by email
 * @route GET /api/users/search/email/:email
 * @param {string} req.params.email - User email
 * @returns {Object} User data
 */
const findUserByEmail = async (req, res) => {
    try {
        const { email } = req.params;
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                username: true,
                role: true,
                createdAt: true
            }
        });

        if (!user) {
            return res.status(404).json({ 
                error: 'User not found',
                success: false 
            });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phoneNumber,
                username: user.username,
                role: user.role,
                created_at: user.createdAt
            }
        });

    } catch (error) {
        logError('Find user by email', error, { email: req.params.email });
        res.status(500).json({ 
            error: 'Failed to search user',
            success: false 
        });
    }
};

/**
 * Find user by phone
 * @route GET /api/users/search/phone/:phone
 * @param {string} req.params.phone - User phone
 * @returns {Object} User data
 */
const findUserByPhone = async (req, res) => {
    try {
        const { phone } = req.params;
        const user = await prisma.user.findFirst({
            where: { phoneNumber: phone },
            select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                username: true,
                role: true,
                createdAt: true
            }
        });

        if (!user) {
            return res.status(404).json({ 
                error: 'User not found',
                success: false 
            });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phoneNumber,
                username: user.username,
                role: user.role,
                created_at: user.createdAt
            }
        });

    } catch (error) {
        logError('Find user by phone', error, { phone: req.params.phone });
        res.status(500).json({ 
            error: 'Failed to search user',
            success: false 
        });
    }
};

module.exports = {
    // User management
    createUser,
    getUserById,
    getAllUsers,
    updateUser,
    deleteUser,
    
    // Call history
    getUserCallHistory,
    getUserCallStats,
    
    // Search
    findUserByEmail,
    findUserByPhone
};
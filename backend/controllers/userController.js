const User = require('../models/user.model');
const { logError } = require('../utils/logger');

/**
 * ===================================
 * USER MANAGEMENT OPERATIONS
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
        const { name, email, phone, avatar_url, preferences } = req.body;
        
        // Validation
        if (!name) {
            return res.status(400).json({ 
                error: 'Name is required',
                success: false 
            });
        }

        // Check if email already exists
        if (email) {
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                return res.status(409).json({ 
                    error: 'User with this email already exists',
                    success: false 
                });
            }
        }

        const user = await User.create({
            name,
            email,
            phone,
            avatar_url,
            preferences
        });

        res.status(201).json({
            success: true,
            user: user.toJSON(),
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
        const user = await User.findById(parseInt(id));

        if (!user) {
            return res.status(404).json({ 
                error: 'User not found',
                success: false 
            });
        }

        res.json({
            success: true,
            user: user.toJSON()
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
 * Get all users
 * @route GET /api/users
 * @param {Object} req.query - Query parameters
 * @returns {Object} List of users
 */
const getAllUsers = async (req, res) => {
    try {
        const { 
            limit = 100, 
            offset = 0, 
            orderBy = 'created_at DESC' 
        } = req.query;

        const users = await User.findAll({
            limit: parseInt(limit),
            offset: parseInt(offset),
            orderBy
        });

        res.json({
            success: true,
            users: users.map(user => user.toJSON()),
            count: users.length
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
        const user = await User.findById(parseInt(id));

        if (!user) {
            return res.status(404).json({ 
                error: 'User not found',
                success: false 
            });
        }

        // Check email uniqueness if updating email
        if (req.body.email && req.body.email !== user.email) {
            const existingUser = await User.findByEmail(req.body.email);
            if (existingUser) {
                return res.status(409).json({ 
                    error: 'Email already in use by another user',
                    success: false 
                });
            }
        }

        const success = await user.update(req.body);

        if (success) {
            res.json({
                success: true,
                user: user.toJSON(),
                message: 'User updated successfully'
            });
        } else {
            res.status(400).json({ 
                error: 'No valid fields provided for update',
                success: false 
            });
        }

    } catch (error) {
        logError('Update user', error, { id: req.params.id, body: req.body });
        res.status(500).json({ 
            error: 'Failed to update user',
            success: false 
        });
    }
};

/**
 * Delete user
 * @route DELETE /api/users/:id
 * @param {string} req.params.id - User ID
 * @returns {Object} Deletion confirmation
 */
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(parseInt(id));

        if (!user) {
            return res.status(404).json({ 
                error: 'User not found',
                success: false 
            });
        }

        const success = await user.delete();

        if (success) {
            res.json({
                success: true,
                message: 'User deleted successfully'
            });
        } else {
            res.status(500).json({ 
                error: 'Failed to delete user',
                success: false 
            });
        }

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
        const { 
            limit = 50, 
            offset = 0, 
            direction = null,
            orderBy = 'created_at DESC' 
        } = req.query;

        const user = await User.findById(parseInt(id));
        if (!user) {
            return res.status(404).json({ 
                error: 'User not found',
                success: false 
            });
        }

        const callHistory = await user.getCallHistory({
            limit: parseInt(limit),
            offset: parseInt(offset),
            direction,
            orderBy
        });

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
        const { startDate, endDate } = req.query;

        const user = await User.findById(parseInt(id));
        if (!user) {
            return res.status(404).json({ 
                error: 'User not found',
                success: false 
            });
        }

        const stats = await user.getCallStats({
            startDate,
            endDate
        });

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
 * USER SEARCH OPERATIONS
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
        const user = await User.findByEmail(email);

        if (!user) {
            return res.status(404).json({ 
                error: 'User not found',
                success: false 
            });
        }

        res.json({
            success: true,
            user: user.toJSON()
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
        const user = await User.findByPhone(phone);

        if (!user) {
            return res.status(404).json({ 
                error: 'User not found',
                success: false 
            });
        }

        res.json({
            success: true,
            user: user.toJSON()
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
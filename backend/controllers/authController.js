const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { logError, logger } = require('../utils/logger');
const { USER_ROLES } = require('../utils/constants');

const prisma = new PrismaClient();

/**
 * Generate JWT token
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
const generateToken = (user) => {
    return jwt.sign(
        { 
            userId: user.id,
            email: user.email,
            role: user.role 
        },
        process.env.JWT_SECRET,
        { 
            expiresIn: process.env.JWT_EXPIRES_IN || '7d',
            issuer: 'phone-calling-app'
        }
    );
};

/**
 * ===================================
 * USER REGISTRATION
 * ===================================
 */

/**
 * Register a new user
 * @route POST /api/auth/register
 */
const register = async (req, res) => {
    try {
        const { email, username, password, firstName, lastName, phoneNumber } = req.body;

        // Input validation
        if (!email || !username || !password) {
            return res.status(400).json({
                error: 'Email, username, and password are required',
                success: false
            });
        }

        // Password strength validation
        if (password.length < 6) {
            return res.status(400).json({
                error: 'Password must be at least 6 characters long',
                success: false
            });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: email.toLowerCase() },
                    { username: username.toLowerCase() }
                ]
            }
        });

        if (existingUser) {
            return res.status(409).json({
                error: 'User with this email or username already exists',
                success: false
            });
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create user
        const user = await prisma.user.create({
            data: {
                email: email.toLowerCase(),
                username: username.toLowerCase(),
                password: hashedPassword,
                firstName,
                lastName,
                phoneNumber
            },
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                phoneNumber: true,
                role: true,
                createdAt: true
            }
        });

        // Generate token
        const token = generateToken(user);

        logger.info('🎉 New user registered', { 
            userId: user.id, 
            email: user.email,
            username: user.username 
        });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user,
            token
        });

    } catch (error) {
        logError('User registration', error);
        res.status(500).json({
            error: 'Registration failed',
            success: false
        });
    }
};

/**
 * ===================================
 * USER LOGIN
 * ===================================
 */

/**
 * User login
 * @route POST /api/auth/login
 */
const login = async (req, res) => {
    try {
        const { emailOrUsername, password } = req.body;

        if (!emailOrUsername || !password) {
            return res.status(400).json({
                error: 'Email/username and password are required',
                success: false
            });
        }

        // Find user by email or username
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: emailOrUsername.toLowerCase() },
                    { username: emailOrUsername.toLowerCase() }
                ]
            }
        });

        if (!user) {
            return res.status(401).json({
                error: 'Invalid credentials',
                success: false
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({
                error: 'Account is deactivated',
                success: false
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                error: 'Invalid credentials',
                success: false
            });
        }

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        });

        // Generate token
        const token = generateToken(user);

        logger.info('🔑 User logged in', { 
            userId: user.id, 
            email: user.email 
        });

        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                phoneNumber: user.phoneNumber,
                role: user.role
            },
            token
        });

    } catch (error) {
        logError('User login', error);
        res.status(500).json({
            error: 'Login failed',
            success: false
        });
    }
};

/**
 * ===================================
 * USER PROFILE MANAGEMENT
 * ===================================
 */

/**
 * Get current user profile
 * @route GET /api/auth/profile
 */
const getProfile = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                phoneNumber: true,
                role: true,
                createdAt: true,
                lastLogin: true,
                _count: {
                    select: { calls: true }
                }
            }
        });

        res.json({
            success: true,
            user
        });

    } catch (error) {
        logError('Get user profile', error);
        res.status(500).json({
            error: 'Failed to fetch profile',
            success: false
        });
    }
};

/**
 * Update user profile
 * @route PUT /api/auth/profile
 */
const updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, phoneNumber } = req.body;

        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                firstName,
                lastName,
                phoneNumber
            },
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                phoneNumber: true,
                role: true
            }
        });

        logger.info('📝 User profile updated', { userId: req.user.id });

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: updatedUser
        });

    } catch (error) {
        logError('Update user profile', error);
        res.status(500).json({
            error: 'Failed to update profile',
            success: false
        });
    }
};

/**
 * Change password
 * @route POST /api/auth/change-password
 */
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                error: 'Current password and new password are required',
                success: false
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                error: 'New password must be at least 6 characters long',
                success: false
            });
        }

        // Get current user with password
        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(401).json({
                error: 'Current password is incorrect',
                success: false
            });
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 12);

        // Update password
        await prisma.user.update({
            where: { id: req.user.id },
            data: { password: hashedNewPassword }
        });

        logger.info('🔒 Password changed', { userId: req.user.id });

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        logError('Change password', error);
        res.status(500).json({
            error: 'Failed to change password',
            success: false
        });
    }
};

/**
 * ===================================
 * TOKEN OPERATIONS
 * ===================================
 */

/**
 * Verify token validity
 * @route GET /api/auth/verify
 */
const verifyToken = (req, res) => {
    // If middleware passed, token is valid
    res.json({
        success: true,
        valid: true,
        user: req.user
    });
};

/**
 * Refresh token
 * @route POST /api/auth/refresh
 */
const refreshToken = async (req, res) => {
    try {
        // Generate new token with current user data
        const token = generateToken(req.user);

        res.json({
            success: true,
            token,
            user: req.user
        });

    } catch (error) {
        logError('Token refresh', error);
        res.status(500).json({
            error: 'Failed to refresh token',
            success: false
        });
    }
};

module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword,
    verifyToken,
    refreshToken
};
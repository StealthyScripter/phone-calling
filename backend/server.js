require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = [
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN', 
    'TWILIO_PHONE_NUMBER',
    'JWT_SECRET',
    'DATABASE_URL'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingEnvVars.forEach(envVar => console.error(`   - ${envVar}`));
    console.error('\nPlease add these to your .env file');
    process.exit(1);
}

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const { createServer } = require('http');
const { Server } = require('socket.io');

const { PrismaClient } = require('@prisma/client');
const callManager = require('./utils/callManager');
const { logger } = require('./utils/logger');

// Debug environment variables loading
console.log('🔍 Debug: Environment variables loaded');
console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? 'LOADED' : 'MISSING');
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? 'LOADED' : 'MISSING');
console.log('TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER ? 'LOADED' : 'MISSING');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'LOADED' : 'MISSING');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'LOADED' : 'MISSING');
console.log('');

// Initialize Prisma client
const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
});

// Ensure logs directory exists
if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs');
}

// Debug route imports
console.log('🔍 Debug: Checking route imports...');

let authRoutes, callRoutes, userRoutes, contactRoutes, webhookRoutes;

try {
    authRoutes = require('./routes/auth');
    console.log('✅ Auth routes loaded');
} catch (error) {
    console.error('❌ Auth routes failed:', error.message);
    process.exit(1);
}

try {
    callRoutes = require('./routes/calls'); 
    console.log('✅ Call routes loaded');
} catch (error) {
    console.error('❌ Call routes failed:', error.message);
    process.exit(1);
}

try {
    userRoutes = require('./routes/users');
    console.log('✅ User routes loaded');
} catch (error) {
    console.error('❌ User routes failed:', error.message);
    process.exit(1);
}

try {
    contactRoutes = require('./routes/contacts');
    console.log('✅ Contact routes loaded');
} catch (error) {
    console.error('❌ Contact routes failed:', error.message);
    process.exit(1);
}

try {
    webhookRoutes = require('./routes/webhooks');
    console.log('✅ Webhook routes loaded');
} catch (error) {
    console.error('❌ Webhook routes failed:', error.message);
    process.exit(1);
}

// Initialize database and application
const initializeApp = async () => {
    try {
        // Test database connection
        await prisma.$connect();
        logger.info('✅ PostgreSQL database connected successfully');

        // Initialize Redis connection
        await callManager.initialize();
        logger.info('✅ Call manager initialized successfully');
        
        // Set up cleanup interval for fallback storage
        setInterval(() => {
            callManager.cleanup();
        }, 30 * 60 * 1000); // Every 30 minutes
        
    } catch (error) {
        logger.error('❌ Application initialization failed', error);
        process.exit(1);
    }
};

// ✅ CREATE EXPRESS APP HERE
const app = express();
const PORT = process.env.PORT || 3000;

/**
 * ===================================
 * SECURITY MIDDLEWARE
 * ===================================
 */

// Basic security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false // Allow Twilio webhooks
}));

// CORS configuration - UPDATED FOR BETTER DEVELOPMENT SUPPORT
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // In development, allow common development ports
        if (process.env.NODE_ENV === 'development') {
            const allowedOrigins = [
                'http://localhost:3000',
                'http://localhost:3001', 
                'http://localhost:8080',
                'http://localhost:8081',
                'http://127.0.0.1:3000',
                'http://127.0.0.1:3001',
                'http://127.0.0.1:8080',
                'http://127.0.0.1:8081'
            ];
            
            // Add FRONTEND_URL if specified
            if (process.env.FRONTEND_URL) {
                allowedOrigins.push(process.env.FRONTEND_URL);
            }
            
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
        }
        
        // In production, only allow specified origins
        const allowedOrigins = process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [];
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        
        // For development, be more permissive
        if (process.env.NODE_ENV === 'development') {
            return callback(null, true);
        }
        
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true, // Allow cookies and authentication headers
    optionsSuccessStatus: 200, // For legacy browser support
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With', 
        'Content-Type',
        'Accept',
        'Authorization',
        'Cache-Control',
        'X-HTTP-Method-Override'
    ]
};

app.use(cors(corsOptions));

// Handle preflight requests for all routes
app.options('*', cors(corsOptions));

/**
 * ===================================
 * BODY PARSING MIDDLEWARE
 * ===================================
 */

// Parse JSON bodies (with size limit)
app.use(bodyParser.json({ limit: '10mb' }));

// Parse URL-encoded bodies (for Twilio webhooks)
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

/**
 * ===================================
 * REQUEST LOGGING (NOW AFTER APP CREATION)
 * ===================================
 */

// Log all requests in development
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`📝 ${req.method} ${req.path}`, {
            ip: req.ip,
            userAgent: req.get('User-Agent')?.substring(0, 50),
            body: req.method === 'POST' ? Object.keys(req.body || {}) : undefined
        });
        next();
    });
}

/**
 * ===================================
 * API ROUTES
 * ===================================
 */

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        // Check database connection
        await prisma.$queryRaw`SELECT 1`;
        
        // Get database statistics
        const [userCount, contactCount, callCount] = await Promise.all([
            prisma.user.count(),
            prisma.contact.count(),
            prisma.call.count()
        ]);
        
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: {
                connected: true,
                stats: {
                    users: userCount,
                    contacts: contactCount,
                    callHistory: callCount
                }
            },
            callManager: {
                connected: callManager.redisClient ? true : false,
                activeCalls: (await callManager.getAllCalls()).length
            },
            version: '1.0.0'
        });
    } catch (error) {
        logger.error('Health check failed', error);
        res.status(503).json({
            status: 'unhealthy',
            error: 'Service unavailable'
        });
    }
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
    res.json({
        title: 'Phone Calling MVP API',
        version: '1.0.0',
        description: 'API for managing users, contacts, and phone calls with Twilio integration',
        database: 'PostgreSQL with Prisma ORM',
        endpoints: {
            auth: {
                'POST /api/auth/register': 'Register new user',
                'POST /api/auth/login': 'User login',
                'GET /api/auth/profile': 'Get user profile',
                'PUT /api/auth/profile': 'Update user profile',
                'POST /api/auth/change-password': 'Change password',
                'GET /api/auth/verify': 'Verify token',
                'POST /api/auth/refresh': 'Refresh token'
            },
            users: {
                'POST /api/users': 'Create user',
                'GET /api/users': 'Get all users',
                'GET /api/users/:id': 'Get user by ID',
                'PUT /api/users/:id': 'Update user',
                'DELETE /api/users/:id': 'Delete user',
                'GET /api/users/:id/call-history': 'Get user call history',
                'GET /api/users/:id/call-stats': 'Get user call statistics',
                'GET /api/users/:userId/contacts': 'Get user contacts',
                'GET /api/users/:userId/contacts/search': 'Search user contacts'
            },
            contacts: {
                'POST /api/contacts': 'Create contact',
                'GET /api/contacts/:id': 'Get contact by ID',
                'PUT /api/contacts/:id': 'Update contact',
                'DELETE /api/contacts/:id': 'Delete contact',
                'POST /api/contacts/:id/toggle-favorite': 'Toggle favorite status',
                'GET /api/contacts/:id/call-history': 'Get contact call history',
                'GET /api/contacts/:id/call-stats': 'Get contact call statistics'
            },
            calls: {
                'POST /api/calls/make': 'Make an outbound call',
                'POST /api/calls/hangup/:callSid': 'End a call',
                'POST /api/calls/accept/:callSid': 'Accept incoming call',
                'POST /api/calls/reject/:callSid': 'Reject incoming call',
                'GET /api/calls/active': 'Get active calls',
                'GET /api/calls/pending': 'Get pending incoming calls',
                'GET /api/calls/:callSid': 'Get call details'
            },
            webhooks: {
                'POST /webhooks/incoming': 'Handle incoming call webhook',
                'POST /webhooks/answer': 'Handle outbound call answer',
                'POST /webhooks/status': 'Handle call status updates',
                'GET /webhooks/health': 'Webhook health check'
            }
        }
    });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// User management routes
app.use('/api/users', userRoutes);

// Contact management routes
app.use('/api/contacts', contactRoutes);

// Call management routes
app.use('/api/calls', callRoutes);

// Twilio webhook routes (public)
app.use('/webhooks', webhookRoutes);

/**
 * ===================================
 * STATIC FILE SERVING
 * ===================================
 */

// Serve static files
app.use(express.static('public'));

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/**
 * ===================================
 * ERROR HANDLING
 * ===================================
 */

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        success: false,
        path: req.originalUrl
    });
});

// Global error handler
app.use((error, req, res, next) => {
    logger.error('Unhandled error', error, {
        path: req.path,
        method: req.method,
        ip: req.ip
    });

    // Don't expose error details in production
    const errorResponse = {
        error: 'Internal server error',
        success: false
    };

    if (process.env.NODE_ENV === 'development') {
        errorResponse.details = error.message;
        errorResponse.stack = error.stack;
    }

    res.status(500).json(errorResponse);
});

/**
 * ===================================
 * SERVER STARTUP
 * ===================================
 */

const startServer = async () => {
    await initializeApp();
    
    const server = createServer(app);
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    // WebSocket connection handling
    io.on('connection', (socket) => {
        logger.info('📡 WebSocket client connected', { socketId: socket.id });
        
        socket.on('disconnect', () => {
            logger.info('📡 WebSocket client disconnected', { socketId: socket.id });
        });
    });

    // Make io accessible globally
    global.io = io;

    server.listen(PORT, () => {
        console.log('');
        console.log('🚀 Server Information:');
        console.log(`   📱 Web interface: http://localhost:${PORT}`);
        console.log(`   🔗 API base URL: http://localhost:${PORT}/api`);
        console.log(`   📖 API docs: http://localhost:${PORT}/api/docs`);
        console.log(`   ❤️  Health check: http://localhost:${PORT}/api/health`);
        console.log(`   🔗 Webhook base URL: ${process.env.WEBHOOK_BASE_URL || 'Not configured'}`);
        console.log(`   💾 Database: PostgreSQL with Prisma ORM`);
        console.log(`   📡 WebSocket enabled: Yes`);
        console.log('');
        
        if (process.env.NODE_ENV === 'development') {
            console.log('💡 Development mode tips:');
            console.log('   - Run `npm run db:push` to sync database schema');
            console.log('   - Run `npm run db:studio` to open Prisma Studio');
            console.log('   - Check the API documentation at /api/docs');
            console.log('   - Monitor logs in the logs/ directory');
            console.log('');
        }
        
        logger.info(`🚀 Server running on port ${PORT}`, {
            port: PORT,
            environment: process.env.NODE_ENV || 'development',
            webhookUrl: process.env.WEBHOOK_BASE_URL,
            database: 'PostgreSQL'
        });
    });

    /**
     * ===================================
     * GRACEFUL SHUTDOWN
     * ===================================
     */

    const gracefulShutdown = async (signal) => {
        logger.info(`📴 Received ${signal}, shutting down gracefully`);
        console.log(`\n📴 Received ${signal}, shutting down gracefully...`);
        
        server.close(async () => {
            try {
                console.log('🔄 Closing connections...');
                
                // Close database connections
                await prisma.$disconnect();
                logger.info('✅ Database disconnected');

                // Close Redis connection
                await callManager.close();
                logger.info('✅ Redis disconnected');

                console.log('✅ All connections closed');
                logger.info('✅ Server closed gracefully');
                process.exit(0);
            } catch (error) {
                logger.error('❌ Error during graceful shutdown', error);
                console.error('❌ Error during shutdown:', error.message);
                process.exit(1);
            }
        });

        // Force close after 30 seconds
        setTimeout(() => {
            logger.error('⏰ Forcing server shutdown after timeout');
            console.error('⏰ Forcing server shutdown after timeout');
            process.exit(1);
        }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
        logger.error('❌ Uncaught Exception', error);
        console.error('❌ Uncaught Exception:', error);
        gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
        logger.error('❌ Unhandled Rejection', { reason, promise });
        console.error('❌ Unhandled Rejection:', reason);
        gracefulShutdown('UNHANDLED_REJECTION');
    });
};

// Start the server
startServer().catch(error => {
    logger.error('❌ Failed to start server', error);
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
});

// require('dotenv').config();

// // Validate required environment variables
// const requiredEnvVars = [
//     'TWILIO_ACCOUNT_SID',
//     'TWILIO_AUTH_TOKEN', 
//     'TWILIO_PHONE_NUMBER',
//     'JWT_SECRET'
// ];

// const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
// if (missingEnvVars.length > 0) {
//     console.error('❌ Missing required environment variables:');
//     missingEnvVars.forEach(envVar => console.error(`   - ${envVar}`));
//     console.error('\nPlease add these to your .env file');
//     process.exit(1);
// }

// const express = require('express');
// const cors = require('cors');
// const bodyParser = require('body-parser');
// const helmet = require('helmet');
// const path = require('path');
// const fs = require('fs');
// const { createServer } = require('http');
// const { Server } = require('socket.io');

// const { PrismaClient } = require('@prisma/client');
// const callManager = require('./utils/callManager');
// const { logger } = require('./utils/logger');

// // Debug environment variables loading
// console.log('🔍 Debug: Environment variables loaded');
// console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? 'LOADED' : 'MISSING');
// console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? 'LOADED' : 'MISSING');
// console.log('TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER ? 'LOADED' : 'MISSING');
// console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'LOADED' : 'MISSING');
// console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'LOADED' : 'USING SQLITE');
// console.log('');

// // Initialize Prisma client
// const prisma = new PrismaClient({
//     log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
// });

// // Ensure logs directory exists
// if (!fs.existsSync('logs')) {
//     fs.mkdirSync('logs');
// }

// // Initialize database and application
// const initializeApp = async () => {
//     try {
//         // Test database connection
//         await prisma.$connect();
//         logger.info('✅ Database connected successfully');

//         // Initialize Redis connection
//         await callManager.initialize();
//         logger.info('✅ Call manager initialized successfully');
        
//         // Set up cleanup interval for fallback storage
//         setInterval(() => {
//             callManager.cleanup();
//         }, 30 * 60 * 1000); // Every 30 minutes
        
//     } catch (error) {
//         logger.error('❌ Application initialization failed', error);
//         process.exit(1);
//     }
// };

// // Import routes
// const authRoutes = require('./routes/auth');
// const callRoutes = require('./routes/calls');
// const webhookRoutes = require('./routes/webhooks');

// const app = express();
// const PORT = process.env.PORT || 3000;

// /**
//  * ===================================
//  * SECURITY MIDDLEWARE
//  * ===================================
//  */

// // Basic security headers
// app.use(helmet({
//     contentSecurityPolicy: {
//         directives: {
//             defaultSrc: ["'self'"],
//             styleSrc: ["'self'", "'unsafe-inline'"],
//             scriptSrc: ["'self'"],
//             imgSrc: ["'self'", "data:", "https:"],
//         },
//     },
//     crossOriginEmbedderPolicy: false // Allow Twilio webhooks
// }));

// // CORS configuration
// const corsOptions = {
//     origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : true,
//     credentials: true,
//     optionsSuccessStatus: 200
// };
// app.use(cors(corsOptions));

// /**
//  * ===================================
//  * BODY PARSING MIDDLEWARE
//  * ===================================
//  */

// // Parse JSON bodies (with size limit)
// app.use(bodyParser.json({ limit: '10mb' }));

// // Parse URL-encoded bodies (for Twilio webhooks)
// app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// /**
//  * ===================================
//  * REQUEST LOGGING
//  * ===================================
//  */

// // Log all requests in development
// if (process.env.NODE_ENV === 'development') {
//     app.use((req, res, next) => {
//         logger.info(`${req.method} ${req.path}`, {
//             ip: req.ip,
//             userAgent: req.get('User-Agent'),
//             body: req.method === 'POST' ? req.body : undefined
//         });
//         next();
//     });
// }

// /**
//  * ===================================
//  * API ROUTES
//  * ===================================
//  */

// // Health check endpoint
// app.get('/health', async (req, res) => {
//     try {
//         // Check database connection
//         await prisma.$queryRaw`SELECT 1`;
        
//         res.json({
//             status: 'healthy',
//             timestamp: new Date().toISOString(),
//             services: {
//                 database: 'connected',
//                 redis: callManager.redisClient ? 'connected' : 'fallback_mode',
//                 twilio: 'configured'
//             },
//             version: '1.0.0'
//         });
//     } catch (error) {
//         logger.error('Health check failed', error);
//         res.status(503).json({
//             status: 'unhealthy',
//             error: 'Service unavailable'
//         });
//     }
// });

// // Authentication routes
// app.use('/api/auth', authRoutes);

// // Call management routes (protected)
// app.use('/api/calls', callRoutes);

// // Twilio webhook routes (public)
// app.use('/webhooks', webhookRoutes);

// /**
//  * ===================================
//  * STATIC FILE SERVING
//  * ===================================
//  */

// // Serve static files
// app.use(express.static('public'));

// // Serve frontend
// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

// /**
//  * ===================================
//  * ERROR HANDLING
//  * ===================================
//  */

// // 404 handler
// app.use('*', (req, res) => {
//     res.status(404).json({
//         error: 'Endpoint not found',
//         success: false,
//         path: req.originalUrl
//     });
// });

// // Global error handler
// app.use((error, req, res, next) => {
//     logger.error('Unhandled error', error, {
//         path: req.path,
//         method: req.method,
//         ip: req.ip
//     });

//     // Don't expose error details in production
//     const errorResponse = {
//         error: 'Internal server error',
//         success: false
//     };

//     if (process.env.NODE_ENV === 'development') {
//         errorResponse.details = error.message;
//         errorResponse.stack = error.stack;
//     }

//     res.status(500).json(errorResponse);
// });

// /**
//  * ===================================
//  * SERVER STARTUP
//  * ===================================
//  */

// const startServer = async () => {
//     await initializeApp();
    
//     // const server = app.listen(PORT, () => {
//     //     logger.info(`🚀 Server running on port ${PORT}`);
//     //     logger.info(`📱 Web interface: http://localhost:${PORT}`);
//     //     logger.info(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
//     //     logger.info(`📞 Call endpoints: http://localhost:${PORT}/api/calls`);
//     //     logger.info(`🔗 Webhook base URL: ${process.env.WEBHOOK_BASE_URL || 'Not configured'}`);
//     //     logger.info(`💾 Database: ${process.env.DATABASE_URL ? 'Custom' : 'SQLite (./prisma/dev.db)'}`);
//     // });

//     const server = createServer(app);
//     const io = new Server(server, {
//         cors: {
//             origin: "*",
//             methods: ["GET", "POST"]
//         }
//     });

//     // WebSocket connection handling
//     io.on('connection', (socket) => {
//         logger.info('📡 WebSocket client connected', { socketId: socket.id });
        
//         socket.on('disconnect', () => {
//             logger.info('📡 WebSocket client disconnected', { socketId: socket.id });
//         });
//     });

//     // Make io accessible globally
//     global.io = io;



//     /**
//      * ===================================
//      * GRACEFUL SHUTDOWN
//      * ===================================
//      */

//     const gracefulShutdown = async (signal) => {
//         logger.info(`📴 Received ${signal}, shutting down gracefully`);
        
//         server.close(async () => {
//             try {
//                 // Close database connections
//                 await prisma.$disconnect();
//                 logger.info('✅ Database disconnected');

//                 // Close Redis connection
//                 await callManager.close();
//                 logger.info('✅ Redis disconnected');

//                 logger.info('✅ Server closed gracefully');
//                 process.exit(0);
//             } catch (error) {
//                 logger.error('❌ Error during graceful shutdown', error);
//                 process.exit(1);
//             }
//         });

//         // Force close after 30 seconds
//         setTimeout(() => {
//             logger.error('⏰ Forcing server shutdown after timeout');
//             process.exit(1);
//         }, 30000);
//     };

//     process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
//     process.on('SIGINT', () => gracefulShutdown('SIGINT'));

//     // Handle uncaught exceptions
//     process.on('uncaughtException', (error) => {
//         logger.error('❌ Uncaught Exception', error);
//         gracefulShutdown('UNCAUGHT_EXCEPTION');
//     });

//     process.on('unhandledRejection', (reason, promise) => {
//         logger.error('❌ Unhandled Rejection', { reason, promise });
//         gracefulShutdown('UNHANDLED_REJECTION');
//     });
// };

// // Start the server
// startServer().catch(error => {
//     logger.error('❌ Failed to start server', error);
//     process.exit(1);
// });


require('dotenv').config();
const callManager = require('./utils/callManager');
const { logger } = require('./utils/logger');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Debug environment variables loading
console.log('🔍 Debug: Environment variables loaded');
console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? 'LOADED' : 'MISSING');
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? 'LOADED' : 'MISSING');
console.log('TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER ? 'LOADED' : 'MISSING');
console.log('');

// Ensure directories exist
if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs');
}

if (!fs.existsSync('data')) {
    fs.mkdirSync('data');
}

// Initialize application components
const initializeApp = async () => {
    try {
        console.log('🚀 Initializing application components...');
        
        // Initialize database first (only if database.js exists)
        try {
            const database = require('./utils/database');
            await database.initialize();
            console.log('✅ Database initialized');
            
            // Get database statistics
            const stats = await database.getStats();
            console.log('📊 Database stats:', stats);
        } catch (error) {
            console.log('⚠️  Database initialization skipped:', error.message);
        }
        
        // Initialize Redis connection
        await callManager.initialize();
        console.log('✅ Call manager initialized');
        
        logger.info('🚀 Application initialized successfully');
        
        // Set up cleanup intervals
        setInterval(() => {
            callManager.cleanup();
        }, 30 * 60 * 1000); // Every 30 minutes
        
        return true;
    } catch (error) {
        logger.error('❌ Application initialization failed', error);
        console.error('❌ Initialization failed:', error.message);
        
        // In development, continue without database for basic functionality
        if (process.env.NODE_ENV === 'development') {
            console.log('⚠️  Continuing in development mode with limited functionality');
            try {
                await callManager.initialize();
                return true;
            } catch (callManagerError) {
                console.error('❌ Even call manager failed:', callManagerError.message);
                return false;
            }
        }
        
        return false;
    }
};

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const PORT = process.env.PORT || 3000;

// WebSocket connection handling
io.on('connection', (socket) => {
    logger.info('📡 WebSocket client connected', { socketId: socket.id });
    
    socket.on('disconnect', () => {
        logger.info('📡 WebSocket client disconnected', { socketId: socket.id });
    });
});

// Make io accessible globally
global.io = io;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Import and register routes one by one to debug
try {
    console.log('📝 Loading routes...');
    
    // Load basic routes first
    const callRoutes = require('./routes/calls');
    const webhookRoutes = require('./routes/webhooks');
    
    app.use('/api/calls', callRoutes);
    app.use('/webhooks', webhookRoutes);
    console.log('✅ Basic routes loaded (calls, webhooks)');
    
    // Try to load database routes if they exist
    try {
        const userRoutes = require('./routes/users');
        const contactRoutes = require('./routes/contacts');
        
        app.use('/api/users', userRoutes);
        app.use('/api/contacts', contactRoutes);
        console.log('✅ Database routes loaded (users, contacts)');
    } catch (error) {
        console.log('⚠️  Database routes skipped:', error.message);
    }
    
} catch (error) {
    console.error('❌ Error loading routes:', error);
    process.exit(1);
}

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        const activeCalls = await callManager.getAllCalls();
        
        let dbStats = null;
        try {
            const database = require('./utils/database');
            dbStats = await database.getStats();
        } catch (error) {
            // Database not available
        }
        
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: dbStats ? {
                connected: true,
                stats: dbStats
            } : {
                connected: false,
                message: 'Database not available'
            },
            callManager: {
                connected: callManager.redisClient ? true : false,
                activeCalls: activeCalls.length
            },
            version: '1.0.0'
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
    res.json({
        title: 'Phone Calling MVP API',
        version: '1.0.0',
        description: 'API for managing users, contacts, and phone calls with Twilio integration',
        endpoints: {
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

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Unhandled error', err);
    res.status(500).json({
        error: 'Internal server error',
        success: false,
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        success: false,
        path: req.originalUrl
    });
});

const startServer = async () => {
    const initialized = await initializeApp();
    
    if (!initialized && process.env.NODE_ENV === 'production') {
        console.error('❌ Failed to initialize application in production mode');
        process.exit(1);
    }
    
    server.listen(PORT, () => {
        console.log('');
        console.log('🚀 Server Information:');
        console.log(`   📱 Web interface: http://localhost:${PORT}`);
        console.log(`   🔗 API base URL: http://localhost:${PORT}/api`);
        console.log(`   📖 API docs: http://localhost:${PORT}/api/docs`);
        console.log(`   ❤️  Health check: http://localhost:${PORT}/api/health`);
        console.log(`   🔗 Webhook base URL: ${process.env.WEBHOOK_BASE_URL || 'Not configured'}`);
        console.log(`   📡 WebSocket enabled: Yes`);
        console.log('');
        
        if (process.env.NODE_ENV === 'development') {
            console.log('💡 Development mode tips:');
            console.log('   - Run `npm run db:setup` to initialize the database with sample data');
            console.log('   - Check the API documentation at /api/docs');
            console.log('   - Monitor logs in the logs/ directory');
            console.log('');
        }
        
        logger.info(`🚀 Server running on port ${PORT}`, {
            port: PORT,
            environment: process.env.NODE_ENV || 'development',
            webhookUrl: process.env.WEBHOOK_BASE_URL
        });
    });

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal) => {
        logger.info(`📴 Received ${signal}, shutting down gracefully`);
        console.log(`\n📴 Received ${signal}, shutting down gracefully...`);
        
        server.close(async () => {
            try {
                console.log('🔄 Closing connections...');
                await callManager.close();
                
                // Close database if available
                try {
                    const database = require('./utils/database');
                    await database.close();
                } catch (error) {
                    // Database not available
                }
                
                console.log('✅ All connections closed');
                logger.info('✅ Server closed gracefully');
                process.exit(0);
            } catch (error) {
                logger.error('❌ Error during graceful shutdown', error);
                console.error('❌ Error during shutdown:', error.message);
                process.exit(1);
            }
        });
        
        // Force exit if graceful shutdown takes too long
        setTimeout(() => {
            logger.error('❌ Forced shutdown due to timeout');
            console.error('❌ Forced shutdown due to timeout');
            process.exit(1);
        }, 10000); // 10 second timeout
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
        logger.error('❌ Uncaught Exception', error);
        console.error('❌ Uncaught Exception:', error);
        process.exit(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
        logger.error('❌ Unhandled Rejection', { reason, promise });
        console.error('❌ Unhandled Rejection:', reason);
        process.exit(1);
    });
};

// Start the server
startServer().catch(error => {
    logger.error('❌ Failed to start server', error);
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
});
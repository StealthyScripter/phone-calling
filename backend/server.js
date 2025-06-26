require('dotenv').config();
const callManager = require('./utils/callManager');
const { logger } = require('./utils/logger');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Debug environment variables loading
console.log('🔍 Debug: Environment variables loaded');
console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? 'LOADED' : 'MISSING');
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? 'LOADED' : 'MISSING');
console.log('TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER ? 'LOADED' : 'MISSING');
console.log('');

// Ensure logs directory exists
if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs');
}

// Initialize Redis connection
const initializeApp = async () => {
    try {
        await callManager.initialize();
        logger.info('🚀 Application initialized successfully');
        
        // Set up cleanup interval for fallback storage
        setInterval(() => {
            callManager.cleanup();
        }, 30 * 60 * 1000); // Every 30 minutes
        
    } catch (error) {
        logger.error('❌ Application initialization failed', error);
        process.exit(1);
    }
};

const callRoutes = require('./routes/calls');
const webhookRoutes = require('./routes/webhooks');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Routes
app.use('/api/calls', callRoutes);
app.use('/webhooks', webhookRoutes);

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const startServer = async () => {
    await initializeApp();
    
    const server = app.listen(PORT, () => {
        logger.info(`🚀 Server running on port ${PORT}`);
        logger.info(`📱 Web interface: http://localhost:${PORT}`);
        logger.info(`🔗 Webhook base URL: ${process.env.WEBHOOK_BASE_URL || 'Not configured'}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
        logger.info('📴 Received SIGTERM, shutting down gracefully');
        server.close(async () => {
            await callManager.close();
            logger.info('✅ Server closed');
            process.exit(0);
        });
    });

    process.on('SIGINT', async () => {
        logger.info('📴 Received SIGINT, shutting down gracefully');
        server.close(async () => {
            await callManager.close();
            logger.info('✅ Server closed');
            process.exit(0);
        });
    });
};

// Start the server
startServer().catch(error => {
    logger.error('❌ Failed to start server', error);
    process.exit(1);
});
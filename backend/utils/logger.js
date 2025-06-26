const winston = require('winston');

// Create logger instance with different levels and formats
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'phone-calling-app' },
    transports: [
        // Write errors to error.log
        new winston.transports.File({ 
            filename: 'logs/error.log', 
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // Write all logs to combined.log
        new winston.transports.File({ 
            filename: 'logs/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
            winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
                return `${timestamp} [${service}] ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
            })
        )
    }));
}

// Utility methods for common logging patterns
const logCall = (action, callSid, details = {}) => {
    logger.info(`📞 Call ${action}`, {
        action,
        callSid,
        ...details
    });
};

const logError = (operation, error, context = {}) => {
    logger.error(`❌ ${operation} failed`, {
        error: error.message,
        stack: error.stack,
        ...context
    });
};

const logWebhook = (webhookType, data) => {
    logger.info(`🔗 Webhook received: ${webhookType}`, {
        webhookType,
        callSid: data.CallSid,
        from: data.From,
        to: data.To,
        status: data.CallStatus
    });
};

module.exports = {
    logger,
    logCall,
    logError,
    logWebhook
};
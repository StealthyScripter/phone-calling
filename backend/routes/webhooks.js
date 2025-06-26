const express = require('express');
const router = express.Router();
const { 
    handleIncomingCall,
    checkCallStatus,
    handleOutboundAnswer,
    handleStatusUpdate,
    handleCallRejection,
    webhookHealthCheck,
    // Legacy aliases
    handleAnswer,
    handleStatus,
    rejectCall
} = require('../controllers/webhookController');

/**
 * Incoming call webhooks
 */
router.post('/incoming', handleIncomingCall);
router.post('/check-status/:callSid', checkCallStatus);

/**
 * Outbound call webhooks
 */
router.post('/answer', handleOutboundAnswer);

/**
 * Status and utility webhooks
 */
router.post('/status', handleStatusUpdate);
router.post('/reject', handleCallRejection);

/**
 * Health check
 */
router.get('/health', webhookHealthCheck);

/**
 * Legacy compatibility routes
 */
router.post('/legacy/answer', handleAnswer);
router.post('/legacy/status', handleStatus);
router.post('/legacy/reject', rejectCall);

module.exports = router;
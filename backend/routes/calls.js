const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { 
    makeCall, 
    hangupCall, 
    getActiveCalls,
    acceptIncomingCall,
    rejectIncomingCall,
    getPendingCalls,
    getCallDetails
} = require('../controllers/callController');

/**
 * ===================================
 * CALL ROUTES
 * All routes require authentication
 * ===================================
 */

/**
 * Outbound call routes - PROTECTED
 */
router.post('/make', authenticateToken, makeCall);
router.post('/hangup/:callSid', authenticateToken, hangupCall);

/**
 * Incoming call routes - PROTECTED
 */
router.post('/accept/:callSid', authenticateToken, acceptIncomingCall);
router.post('/reject/:callSid', authenticateToken, rejectIncomingCall);
router.get('/pending', authenticateToken, getPendingCalls);

/**
 * Call monitoring routes - PROTECTED
 */
router.get('/active', authenticateToken, getActiveCalls);
router.get('/:callSid', authenticateToken, getCallDetails);

module.exports = router;
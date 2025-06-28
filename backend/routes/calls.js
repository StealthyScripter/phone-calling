const express = require('express');
const router = express.Router();
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
 * Outbound call routes
 */
router.post('/make', makeCall);
router.post('/hangup/:callSid', hangupCall);

/**
 * Incoming call routes
 */
router.post('/accept/:callSid', acceptIncomingCall);
router.post('/reject/:callSid', rejectIncomingCall);
router.get('/pending', getPendingCalls);

/**
 * Call monitoring routes
 */
router.get('/active', getActiveCalls);
router.get('/:callSid', getCallDetails);

module.exports = router;
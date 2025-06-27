// const express = require('express');
// const router = express.Router();
// const { 
//     makeCall, 
//     hangupCall, 
//     getActiveCalls,
//     acceptIncomingCall,
//     rejectIncomingCall,
//     getPendingCalls,
//     getCallDetails
// } = require('../controllers/callController');

// /**
//  * Outbound call routes
//  */
// router.post('/make', makeCall);
// router.post('/hangup/:callSid', hangupCall);

// /**
//  * Incoming call routes
//  */
// router.post('/accept/:callSid', acceptIncomingCall);
// router.post('/reject/:callSid', rejectIncomingCall);
// router.get('/pending', getPendingCalls);

// /**
//  * Call monitoring routes
//  */
// router.get('/active', getActiveCalls);
// router.get('/:callSid', getCallDetails);

// module.exports = router;

const express = require('express');
const rateLimit = require('express-rate-limit');
const { 
    makeCall, 
    hangupCall, 
    getActiveCalls,
    acceptIncomingCall,
    rejectIncomingCall,
    getPendingCalls,
    getCallDetails,
    getCallHistory
} = require('../controllers/callController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { USER_ROLES } = require('../utils/constants');

const router = express.Router();

/**
 * Rate limiting for call operations
 */
const callLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20, // limit each user to 20 call operations per 5 minutes
    message: {
        error: 'Too many call operations, please try again later',
        success: false
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.id || req.ip // Rate limit by user ID if authenticated
});

const makeCallLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5, // limit to 5 outbound calls per minute per user
    message: {
        error: 'Too many outbound calls, please wait before making another call',
        success: false
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.id || req.ip
});

/**
 * Apply authentication to all call routes
 */
router.use(authenticateToken);

/**
 * ===================================
 * OUTBOUND CALL ROUTES
 * ===================================
 */

/**
 * Make an outbound call
 * @route POST /api/calls/make
 * @access Private
 */
router.post('/make', makeCallLimiter, makeCall);

/**
 * Hang up an active call
 * @route POST /api/calls/hangup/:callSid
 * @access Private
 */
router.post('/hangup/:callSid', callLimiter, hangupCall);

/**
 * ===================================
 * INCOMING CALL ROUTES
 * ===================================
 */

/**
 * Accept an incoming call
 * @route POST /api/calls/accept/:callSid
 * @access Private
 */
router.post('/accept/:callSid', callLimiter, acceptIncomingCall);

/**
 * Reject an incoming call
 * @route POST /api/calls/reject/:callSid
 * @access Private
 */
router.post('/reject/:callSid', callLimiter, rejectIncomingCall);

/**
 * Get pending incoming calls
 * @route GET /api/calls/pending
 * @access Private
 */
router.get('/pending', getPendingCalls);

/**
 * ===================================
 * CALL MONITORING ROUTES
 * ===================================
 */

/**
 * Get active calls for current user
 * @route GET /api/calls/active
 * @access Private
 */
router.get('/active', getActiveCalls);

/**
 * Get call history for current user
 * @route GET /api/calls/history
 * @access Private
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 20, max: 100)
 */
router.get('/history', getCallHistory);

/**
 * Get specific call details
 * @route GET /api/calls/:callSid
 * @access Private
 */
router.get('/:callSid', getCallDetails);

/**
 * ===================================
 * ADMIN ROUTES (Future Extension)
 * ===================================
 */

/**
 * Get all calls (admin only)
 * @route GET /api/calls/admin/all
 * @access Private (Admin only)
 */
router.get('/admin/all', authorizeRoles([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]), async (req, res) => {
    // Implementation for admin to view all calls
    res.status(501).json({
        error: 'Admin functionality not implemented yet',
        success: false
    });
});

/**
 * Get user statistics (admin only)
 * @route GET /api/calls/admin/stats
 * @access Private (Admin only)
 */
router.get('/admin/stats', authorizeRoles([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]), async (req, res) => {
    // Implementation for call statistics
    res.status(501).json({
        error: 'Statistics functionality not implemented yet',
        success: false
    });
});

module.exports = router;
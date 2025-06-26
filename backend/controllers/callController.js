const twilioClient = require('../utils/twilioClient');
const callManager = require('../utils/callManager');
const { logCall, logError } = require('../utils/logger');

/**
 * ===================================
 * OUTBOUND CALL OPERATIONS
 * ===================================
 */

/**
 * Initiate an outbound call
 * @route POST /api/calls/make
 * @param {Object} req.body - Request body containing phone number
 * @param {string} req.body.to - Destination phone number
 * @returns {Object} Call initiation response with SID and status
 */
const makeCall = async (req, res) => {
    try {
        const { to } = req.body;
        
        // Input validation
        if (!to) {
            logCall('validation_failed', null, { reason: 'Missing phone number' });
            return res.status(400).json({ 
                error: 'Phone number is required',
                success: false 
            });
        }

        // Initiate call via Twilio
        const call = await twilioClient.calls.create({
            url: `${process.env.WEBHOOK_BASE_URL}/webhooks/answer`,
            to: to,
            from: process.env.TWILIO_PHONE_NUMBER,
            statusCallback: `${process.env.WEBHOOK_BASE_URL}/webhooks/status`,
            statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed', 'failed']
        });

        // Store call info in Redis
        await callManager.addCall(call.sid, {
            to: to,
            from: process.env.TWILIO_PHONE_NUMBER,
            sid: call.sid,
            direction: 'outbound'
        });

        logCall('initiated', call.sid, { to, from: process.env.TWILIO_PHONE_NUMBER });

        res.json({
            success: true,
            callSid: call.sid,
            status: 'calling',
            to: to,
            message: 'Call initiated successfully'
        });

    } catch (error) {
        logError('Call initiation', error, { to: req.body.to });
        res.status(500).json({ 
            error: 'Failed to make call',
            success: false,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Terminate an active call
 * @route POST /api/calls/hangup/:callSid
 * @param {string} req.params.callSid - Twilio call SID to terminate
 * @returns {Object} Call termination confirmation
 */
const hangupCall = async (req, res) => {
    try {
        const { callSid } = req.params;

        // Validate call exists
        const callInfo = await callManager.getCall(callSid);
        if (!callInfo) {
            return res.status(404).json({ 
                error: 'Call not found',
                success: false 
            });
        }

        // Terminate call via Twilio
        await twilioClient.calls(callSid).update({
            status: 'completed'
        });

        // Update call status and remove from active calls
        await callManager.updateCall(callSid, { 
            status: 'completed',
            endTime: new Date().toISOString()
        });
        
        // Remove from active storage after brief delay for webhook processing
        setTimeout(() => callManager.removeCall(callSid), 2000);

        logCall('terminated', callSid, { reason: 'user_initiated' });

        res.json({
            success: true,
            message: 'Call ended successfully',
            callSid: callSid
        });

    } catch (error) {
        logError('Call termination', error, { callSid: req.params.callSid });
        res.status(500).json({ 
            error: 'Failed to end call',
            success: false 
        });
    }
};

/**
 * ===================================
 * INCOMING CALL OPERATIONS  
 * ===================================
 */

/**
 * Accept an incoming call
 * @route POST /api/calls/accept/:callSid
 * @param {string} req.params.callSid - Twilio call SID to accept
 * @returns {Object} Call acceptance confirmation
 */
const acceptIncomingCall = async (req, res) => {
    try {
        const { callSid } = req.params;
        
        const callInfo = await callManager.getCall(callSid);
        if (!callInfo) {
            return res.status(404).json({ 
                error: 'Incoming call not found',
                success: false 
            });
        }

        // Update call status to accepted
        await callManager.updateCall(callSid, { 
            status: 'accepted',
            acceptedAt: new Date().toISOString()
        });

        // Remove from pending calls
        await callManager.removePendingCall(callSid);

        logCall('accepted', callSid, { from: callInfo.from });

        res.json({ 
            success: true, 
            message: 'Incoming call accepted',
            callSid 
        });

    } catch (error) {
        logError('Call acceptance', error, { callSid: req.params.callSid });
        res.status(500).json({ 
            error: 'Failed to accept call',
            success: false 
        });
    }
};

/**
 * Reject an incoming call
 * @route POST /api/calls/reject/:callSid
 * @param {string} req.params.callSid - Twilio call SID to reject
 * @returns {Object} Call rejection confirmation
 */
const rejectIncomingCall = async (req, res) => {
    try {
        const { callSid } = req.params;
        
        const callInfo = await callManager.getCall(callSid);
        if (!callInfo) {
            return res.status(404).json({ 
                error: 'Incoming call not found',
                success: false 
            });
        }

        // Update call status to rejected
        await callManager.updateCall(callSid, { 
            status: 'rejected',
            rejectedAt: new Date().toISOString()
        });

        // Remove from pending calls
        await callManager.removePendingCall(callSid);

        logCall('rejected', callSid, { from: callInfo.from });

        res.json({ 
            success: true, 
            message: 'Incoming call rejected',
            callSid 
        });

    } catch (error) {
        logError('Call rejection', error, { callSid: req.params.callSid });
        res.status(500).json({ 
            error: 'Failed to reject call',
            success: false 
        });
    }
};

/**
 * ===================================
 * CALL STATUS & MONITORING
 * ===================================
 */

/**
 * Get all active calls
 * @route GET /api/calls/active  
 * @returns {Object} List of currently active calls
 */
const getActiveCalls = async (req, res) => {
    try {
        const calls = await callManager.getAllCalls();
        
        // Filter only active calls (not completed/failed)
        const activeCalls = calls.filter(call => 
            call.status && !['completed', 'failed', 'rejected'].includes(call.status)
        );

        res.json({ 
            success: true,
            calls: activeCalls,
            count: activeCalls.length
        });

    } catch (error) {
        logError('Fetching active calls', error);
        res.status(500).json({ 
            error: 'Failed to fetch active calls',
            success: false,
            calls: []
        });
    }
};

/**
 * Get pending incoming calls
 * @route GET /api/calls/pending
 * @returns {Object} List of incoming calls awaiting response
 */
const getPendingCalls = async (req, res) => {
    try {
        const pendingCalls = await callManager.getPendingCalls();

        res.json({ 
            success: true,
            pendingCalls,
            count: pendingCalls.length
        });

    } catch (error) {
        logError('Fetching pending calls', error);
        res.status(500).json({ 
            error: 'Failed to fetch pending calls',
            success: false,
            pendingCalls: []
        });
    }
};

/**
 * Get call details by SID
 * @route GET /api/calls/:callSid
 * @param {string} req.params.callSid - Twilio call SID
 * @returns {Object} Detailed call information
 */
const getCallDetails = async (req, res) => {
    try {
        const { callSid } = req.params;
        const callInfo = await callManager.getCall(callSid);

        if (!callInfo) {
            return res.status(404).json({ 
                error: 'Call not found',
                success: false 
            });
        }

        res.json({ 
            success: true,
            call: callInfo
        });

    } catch (error) {
        logError('Fetching call details', error, { callSid: req.params.callSid });
        res.status(500).json({ 
            error: 'Failed to fetch call details',
            success: false 
        });
    }
};

module.exports = {
    // Outbound operations
    makeCall,
    hangupCall,
    
    // Incoming operations
    acceptIncomingCall,
    rejectIncomingCall,
    
    // Status & monitoring
    getActiveCalls,
    getPendingCalls,
    getCallDetails
};
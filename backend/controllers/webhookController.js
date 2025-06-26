const twilio = require('twilio');
const callManager = require('../utils/callManager');
const { logWebhook, logCall, logError } = require('../utils/logger');

/**
 * ===================================
 * INCOMING CALL WEBHOOK HANDLERS
 * ===================================
 */

/**
 * Handle incoming call webhook from Twilio
 * @route POST /webhooks/incoming
 * @param {Object} req.body - Twilio webhook payload
 * @param {string} req.body.CallSid - Unique call identifier
 * @param {string} req.body.From - Caller's phone number
 * @param {string} req.body.To - Called phone number
 * @returns {string} TwiML response for call handling
 */
const handleIncomingCall = async (req, res) => {
    try {
        const { CallSid, From, To } = req.body;
        
        logWebhook('incoming_call', req.body);

        // Store pending incoming call
        await callManager.addPendingCall(CallSid, {
            from: From,
            to: To,
            direction: 'inbound'
        });

        // Generate TwiML to pause and check for user response
        const twiml = new twilio.twiml.VoiceResponse();
        twiml.say('Please hold while we connect you.');
        twiml.pause({ length: 2 });
        twiml.redirect(`/webhooks/check-status/${CallSid}`);
        
        res.type('text/xml');
        res.send(twiml.toString());

    } catch (error) {
        logError('Incoming call handling', error, req.body);
        
        // Send rejection TwiML on error
        const twiml = new twilio.twiml.VoiceResponse();
        twiml.say('Sorry, we cannot take your call right now.');
        twiml.hangup();
        
        res.type('text/xml');
        res.send(twiml.toString());
    }
};

/**
 * Check call acceptance status and respond accordingly
 * @route POST /webhooks/check-status/:callSid
 * @param {string} req.params.callSid - Call SID to check
 * @returns {string} TwiML response based on call status
 */
const checkCallStatus = async (req, res) => {
    try {
        const { callSid } = req.params;
        const callInfo = await callManager.getCall(callSid);
        
        if (!callInfo) {
            logCall('status_check_failed', callSid, { reason: 'Call not found' });
            
            const twiml = new twilio.twiml.VoiceResponse();
            twiml.say('This call is no longer available.');
            twiml.hangup();
            
            res.type('text/xml');
            return res.send(twiml.toString());
        }

        const twiml = new twilio.twiml.VoiceResponse();

        switch (callInfo.status) {
            case 'accepted':
                logCall('connecting', callSid);
                twiml.say('Your call has been accepted. Connecting now.');
                // Here you would typically dial to the user's device
                twiml.dial({ timeout: 30 }, process.env.USER_PHONE_NUMBER || '+1234567890');
                await callManager.removePendingCall(callSid);
                break;

            case 'rejected':
                logCall('call_rejected', callSid);
                twiml.say('Your call has been declined. Thank you for calling.');
                twiml.hangup();
                await callManager.removePendingCall(callSid);
                break;

            default:
                // Still waiting for response, check again
                twiml.pause({ length: 2 });
                twiml.redirect(`/webhooks/check-status/${callSid}`);
                break;
        }

        res.type('text/xml');
        res.send(twiml.toString());

    } catch (error) {
        logError('Call status check', error, { callSid: req.params.callSid });
        
        const twiml = new twilio.twiml.VoiceResponse();
        twiml.say('An error occurred. Please try again later.');
        twiml.hangup();
        
        res.type('text/xml');
        res.send(twiml.toString());
    }
};

/**
 * ===================================
 * OUTBOUND CALL WEBHOOK HANDLERS
 * ===================================
 */

/**
 * Handle outbound call answer webhook
 * @route POST /webhooks/answer
 * @param {Object} req.body - Twilio webhook payload for answered call
 * @returns {string} TwiML response for outbound call
 */
const handleOutboundAnswer = (req, res) => {
    try {
        const { CallSid, From, To } = req.body;
        
        logWebhook('outbound_answer', req.body);
        
        // Simple greeting for outbound calls
        const twiml = new twilio.twiml.VoiceResponse();
        twiml.say('Hello! You are connected through our calling application.');
        
        // Keep the call alive - in production, you might connect to user's device
        twiml.pause({ length: 1 });
        twiml.say('This call is now active. You can speak normally.');
        
        res.type('text/xml');
        res.send(twiml.toString());

    } catch (error) {
        logError('Outbound call answer', error, req.body);
        
        const twiml = new twilio.twiml.VoiceResponse();
        twiml.say('Connection error occurred.');
        twiml.hangup();
        
        res.type('text/xml');
        res.send(twiml.toString());
    }
};

/**
 * ===================================
 * CALL STATUS WEBHOOK HANDLERS
 * ===================================
 */

/**
 * Handle call status updates from Twilio
 * @route POST /webhooks/status
 * @param {Object} req.body - Twilio status webhook payload
 * @param {string} req.body.CallSid - Call identifier
 * @param {string} req.body.CallStatus - Current call status
 * @param {string} req.body.From - Caller number
 * @param {string} req.body.To - Called number
 */
const handleStatusUpdate = async (req, res) => {
    try {
        const { CallSid, CallStatus, From, To, CallDuration } = req.body;
        
        logWebhook('status_update', req.body);

        // Update call status in storage
        const updateData = { 
            status: CallStatus,
            lastStatusUpdate: new Date().toISOString()
        };

        // Add duration for completed calls
        if (CallStatus === 'completed' && CallDuration) {
            updateData.duration = parseInt(CallDuration);
            updateData.endTime = new Date().toISOString();
        }

        await callManager.updateCall(CallSid, updateData);

        // Log significant status changes
        if (['answered', 'completed', 'failed', 'busy', 'no-answer'].includes(CallStatus)) {
            logCall('status_changed', CallSid, { 
                status: CallStatus, 
                from: From, 
                to: To,
                duration: CallDuration 
            });
        }

        // Clean up completed/failed calls after a delay
        if (['completed', 'failed', 'canceled'].includes(CallStatus)) {
            setTimeout(async () => {
                await callManager.removeCall(CallSid);
                await callManager.removePendingCall(CallSid);
            }, 5000); // 5 second delay for any final processing
        }

        res.sendStatus(200);

    } catch (error) {
        logError('Status update processing', error, req.body);
        res.sendStatus(500);
    }
};

/**
 * ===================================
 * UTILITY WEBHOOK HANDLERS
 * ===================================
 */

/**
 * Handle call rejection (used for immediate rejections)
 * @route POST /webhooks/reject
 * @returns {string} TwiML rejection response
 */
const handleCallRejection = (req, res) => {
    try {
        const { CallSid } = req.body;
        
        logWebhook('call_rejection', req.body);
        logCall('immediately_rejected', CallSid);
        
        const twiml = new twilio.twiml.VoiceResponse();
        twiml.say('This call cannot be completed at this time.');
        twiml.reject();
        
        res.type('text/xml');
        res.send(twiml.toString());

    } catch (error) {
        logError('Call rejection handling', error, req.body);
        
        const twiml = new twilio.twiml.VoiceResponse();
        twiml.hangup();
        
        res.type('text/xml');
        res.send(twiml.toString());
    }
};

/**
 * Webhook health check endpoint
 * @route GET /webhooks/health
 * @returns {Object} Health status of webhook endpoints
 */
const webhookHealthCheck = (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        endpoints: {
            incoming: '/webhooks/incoming',
            answer: '/webhooks/answer', 
            status: '/webhooks/status',
            reject: '/webhooks/reject'
        }
    });
};

module.exports = {
    // Incoming call handlers
    handleIncomingCall,
    checkCallStatus,
    
    // Outbound call handlers  
    handleOutboundAnswer,
    
    // Status handlers
    handleStatusUpdate,
    
    // Utility handlers
    handleCallRejection,
    webhookHealthCheck,
    
    // Legacy aliases for backward compatibility
    handleAnswer: handleOutboundAnswer,
    handleStatus: handleStatusUpdate,
    rejectCall: handleCallRejection
};
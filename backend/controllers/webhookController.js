const twilio = require('twilio');
const callManager = require('../utils/callManager');
const { logWebhook, logCall, logError } = require('../utils/logger');
const { updateCallHistoryFromWebhook } = require('./callController');
const User = require('../models/user.model');
const Contact = require('../models/contact.model');

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

        // Try to find if this is from a known contact/user
        let associatedUser = null;
        let associatedContact = null;

        // Look for contacts with this phone number
        // In a real app, you might have logic to determine which user should receive the call
        try {
            // For demo purposes, we'll look for any contact with this phone number
            // and use the first user we find. In production, you'd have better routing logic.
            const contacts = await Contact.search(From, null, { limit: 1 });
            if (contacts.length > 0) {
                associatedContact = contacts[0];
                associatedUser = await User.findById(associatedContact.user_id);
            }
        } catch (error) {
            logError('Finding associated contact for incoming call', error, { From });
        }

        // Store pending incoming call with enhanced info
        await callManager.addPendingCall(CallSid, {
            from: From,
            to: To,
            direction: 'inbound',
            user_id: associatedUser ? associatedUser.id : null,
            contact_id: associatedContact ? associatedContact.id : null,
            contact_name: associatedContact ? associatedContact.name : null
        });

        // Generate TwiML to pause and check for user response
        const twiml = new twilio.twiml.VoiceResponse();
        
        if (associatedContact) {
            twiml.say(`Incoming call from ${associatedContact.name}. Please hold while we connect you.`);
        } else {
            twiml.say('Please hold while we connect you.');
        }
        
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
                if (callInfo.contact_name) {
                    twiml.say(`Your call has been accepted. Connecting to ${callInfo.contact_name} now.`);
                } else {
                    twiml.say('Your call has been accepted. Connecting now.');
                }
                // Here you would typically dial to the user's device
                twiml.dial({ timeout: 30 }, process.env.USER_PHONE_NUMBER || '+1234567890');
                await callManager.removePendingCall(callSid);
                break;

            case 'rejected':
                logCall('call_rejected', callSid);
                twiml.say('Your call has been declined. Thank you for calling.');
                twiml.hangup();
                await callManager.removePendingCall(callSid);
                
                // Update call history if associated with a user
                if (callInfo.user_id) {
                    await updateCallHistoryFromWebhook(callSid, {
                        CallStatus: 'rejected',
                        CallDuration: 0
                    });
                }
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
const handleOutboundAnswer = async (req, res) => {
    try {
        const { CallSid, From, To } = req.body;
        
        logWebhook('outbound_answer', req.body);
        
        // Get call info to check for contact details
        const callInfo = await callManager.getCall(CallSid);
        let contactName = null;
        
        if (callInfo && callInfo.contact_id) {
            const contact = await Contact.findById(callInfo.contact_id);
            contactName = contact ? contact.name : null;
        }
        
        // Generate personalized greeting
        const twiml = new twilio.twiml.VoiceResponse();
        
        if (contactName) {
            twiml.say(`Hello! You are now connected to ${contactName} through our calling application.`);
        } else {
            twiml.say('Hello! You are connected through our calling application.');
        }
        
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

        // Update call history in database
        await updateCallHistoryFromWebhook(CallSid, req.body);

        // Log significant status changes
        if (['answered', 'completed', 'failed', 'busy', 'no-answer'].includes(CallStatus)) {
            logCall('status_changed', CallSid, { 
                status: CallStatus, 
                from: From, 
                to: To,
                duration: CallDuration 
            });
        }

        // Auto-create contact for unknown incoming callers if call was answered
        if (CallStatus === 'answered') {
            await autoCreateContactIfNeeded(CallSid, From, To);
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
        },
        database: 'connected' // Could add actual database health check here
    });
};

/**
 * ===================================
 * HELPER FUNCTIONS
 * ===================================
 */

/**
 * Auto-create contact for unknown incoming callers
 * @param {string} callSid - Call SID
 * @param {string} fromNumber - Caller phone number
 * @param {string} toNumber - Called number
 */
const autoCreateContactIfNeeded = async (callSid, fromNumber, toNumber) => {
    try {
        const callInfo = await callManager.getCall(callSid);
        
        // Only auto-create for incoming calls with an associated user
        if (!callInfo || callInfo.direction !== 'inbound' || !callInfo.user_id) {
            return;
        }

        // Check if contact already exists
        const existingContact = await Contact.findByPhone(fromNumber, callInfo.user_id);
        if (existingContact) {
            return; // Contact already exists
        }

        // Create contact with basic info
        const contact = await Contact.create({
            user_id: callInfo.user_id,
            name: `Unknown Caller (${fromNumber})`,
            phone: fromNumber,
            notes: `Auto-created from incoming call on ${new Date().toLocaleDateString()}`
        });

        // Update call info with the new contact
        await callManager.updateCall(callSid, {
            contact_id: contact.id
        });

        logCall('contact_auto_created', callSid, {
            contact_id: contact.id,
            phone: fromNumber,
            user_id: callInfo.user_id
        });

    } catch (error) {
        logError('Auto-creating contact', error, { callSid, fromNumber });
        // Don't throw - this is not critical for call handling
    }
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
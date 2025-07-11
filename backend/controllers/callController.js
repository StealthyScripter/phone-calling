const twilioClient = require('../utils/twilioClient');
const callManager = require('../utils/callManager');
const { logCall, logError } = require('../utils/logger');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * ===================================
 * AUTHENTICATED CALL OPERATIONS
 * All operations require valid JWT token
 * ===================================
 */

/**
 * Initiate an outbound call (AUTHENTICATED)
 * @route POST /api/calls/make
 * @access Private (requires JWT token)
 * @param {Object} req.body - Request body containing phone number
 * @param {string} req.body.to - Destination phone number
 * @param {Object} req.user - Authenticated user from JWT token
 * @returns {Object} Call initiation response with SID and status
 */
const makeCall = async (req, res) => {
    try {
        const { to } = req.body;
        const user_id = req.user.id; // Get user ID from authenticated token
        
        // Input validation
        if (!to) {
            logCall('validation_failed', null, { reason: 'Missing phone number', user_id });
            return res.status(400).json({ 
                error: 'Phone number is required',
                success: false 
            });
        }

        // Validate user exists in database
        const user = await prisma.user.findUnique({
            where: { id: String(user_id) }
        });
        
        if (!user) {
            return res.status(404).json({ 
                error: 'User not found',
                success: false 
            });
        }
        
        // Try to find existing contact for this phone number
        const contact = await prisma.contact.findFirst({
            where: { 
                phone: to,
                userId: String(user_id)
            }
        });

        // Initiate call via Twilio
        const call = await twilioClient.calls.create({
            url: `${process.env.WEBHOOK_BASE_URL}/webhooks/answer`,
            to: to,
            from: process.env.TWILIO_PHONE_NUMBER,
            statusCallback: `${process.env.WEBHOOK_BASE_URL}/webhooks/status`,
            statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed', 'failed']
        });

        // Store call info in Redis with authenticated user
        await callManager.addCall(call.sid, {
            to: to,
            from: process.env.TWILIO_PHONE_NUMBER,
            sid: call.sid,
            direction: 'outbound',
            user_id: user_id,
            contact_id: contact ? contact.id : null
        });

        // Add call to database with authenticated user
        await prisma.call.create({
            data: {
                callSid: call.sid,
                userId: String(user_id),
                contactId: contact ? contact.id : null,
                direction: 'outbound',
                phoneNumber: to,
                fromNumber: process.env.TWILIO_PHONE_NUMBER,
                toNumber: to,
                status: 'initiated',
                startedAt: new Date()
            }
        });

        logCall('initiated', call.sid, { 
            to, 
            from: process.env.TWILIO_PHONE_NUMBER,
            user_id,
            user_name: user.name,
            contact_name: contact ? contact.name : null
        });

        // Emit real-time event
        if (global.io) {
            global.io.emit('callInitiated', {
                callSid: call.sid,
                to: to,
                from: process.env.TWILIO_PHONE_NUMBER,
                contact: contact ? {
                    id: contact.id,
                    name: contact.name
                } : null,
                user_id: user_id,
                user_name: user.name,
                status: 'initiated'
            });
        }

        res.json({
            success: true,
            callSid: call.sid,
            status: 'initiated',
            to: to,
            contact: contact ? {
                id: contact.id,
                name: contact.name
            } : null,
            user: {
                id: user.id,
                name: user.name
            },
            message: 'Call initiated successfully'
        });

    } catch (error) {
        logError('Call initiation', error, { to: req.body.to, user_id: req.user.id });
        res.status(500).json({ 
            error: 'Failed to make call',
            success: false,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Terminate an active call (AUTHENTICATED)
 * @route POST /api/calls/hangup/:callSid
 * @access Private (requires JWT token)
 */
const hangupCall = async (req, res) => {
    try {
        const { callSid } = req.params;
        const user_id = req.user.id;

        // Validate call exists and belongs to user
        const callInfo = await callManager.getCall(callSid);
        if (!callInfo) {
            return res.status(404).json({ 
                error: 'Call not found',
                success: false 
            });
        }

        // Check if user owns this call
        if (callInfo.user_id !== user_id) {
            return res.status(403).json({
                error: 'You can only hangup your own calls',
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

        // Update call history in database
        await prisma.call.updateMany({
            where: { 
                callSid: callSid,
                userId: String(user_id)
            },
            data: {
                status: 'completed',
                endedAt: new Date()
            }
        });
        
        // Remove from active storage after brief delay for webhook processing
        setTimeout(() => callManager.removeCall(callSid), 2000);

        logCall('terminated', callSid, { reason: 'user_initiated', user_id });

        // Emit real-time event
        if (global.io) {
            global.io.emit('callEnded', {
                callSid: callSid,
                reason: 'user_initiated',
                user_id: user_id
            });
        }

        res.json({
            success: true,
            message: 'Call ended successfully',
            callSid: callSid
        });

    } catch (error) {
        logError('Call termination', error, { callSid: req.params.callSid, user_id: req.user.id });
        res.status(500).json({ 
            error: 'Failed to end call',
            success: false 
        });
    }
};

/**
 * Accept an incoming call (AUTHENTICATED)
 * @route POST /api/calls/accept/:callSid
 * @access Private (requires JWT token)
 */
const acceptIncomingCall = async (req, res) => {
    try {
        const { callSid } = req.params;
        const user_id = req.user.id;
        
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
            acceptedAt: new Date().toISOString(),
            user_id: user_id
        });

        // Remove from pending calls
        await callManager.removePendingCall(callSid);

        // Add to database with authenticated user
        const user = await prisma.user.findUnique({
            where: { id: String(user_id) }
        });
        
        if (user) {
            // Try to find existing contact for this phone number
            const contact = await prisma.contact.findFirst({
                where: {
                    phone: callInfo.from,
                    userId: String(user_id)
                }
            });
            
            await prisma.call.create({
                data: {
                    callSid: callSid,
                    userId: String(user_id),
                    contactId: contact ? contact.id : null,
                    direction: 'inbound',
                    phoneNumber: callInfo.from,
                    fromNumber: callInfo.from,
                    toNumber: callInfo.to,
                    status: 'accepted',
                    startedAt: new Date()
                }
            });
        }

        logCall('accepted', callSid, { from: callInfo.from, user_id });

        // Emit real-time event
        if (global.io) {
            global.io.emit('callAccepted', {
                callSid: callSid,
                user_id: user_id,
                user_name: user.name
            });
        }

        res.json({ 
            success: true, 
            message: 'Incoming call accepted',
            callSid 
        });

    } catch (error) {
        logError('Call acceptance', error, { callSid: req.params.callSid, user_id: req.user.id });
        res.status(500).json({ 
            error: 'Failed to accept call',
            success: false 
        });
    }
};

/**
 * Reject an incoming call (AUTHENTICATED)
 * @route POST /api/calls/reject/:callSid
 * @access Private (requires JWT token)
 */
const rejectIncomingCall = async (req, res) => {
    try {
        const { callSid } = req.params;
        const user_id = req.user.id;
        
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

        // Add to database with authenticated user
        const user = await prisma.user.findUnique({
            where: { id: String(user_id) }
        });
        
        if (user) {
            // Try to find existing contact for this phone number
            const contact = await prisma.contact.findFirst({
                where: {
                    phone: callInfo.from,
                    userId: String(user_id)
                }
            });
            
            await prisma.call.create({
                data: {
                    callSid: callSid,
                    userId: String(user_id),
                    contactId: contact ? contact.id : null,
                    direction: 'inbound',
                    phoneNumber: callInfo.from,
                    fromNumber: callInfo.from,
                    toNumber: callInfo.to,
                    status: 'rejected',
                    startedAt: new Date(),
                    endedAt: new Date()
                }
            });
        }

        logCall('rejected', callSid, { from: callInfo.from, user_id });

        // Emit real-time event
        if (global.io) {
            global.io.emit('callRejected', {
                callSid: callSid,
                user_id: user_id,
                user_name: user.name
            });
        }

        res.json({ 
            success: true, 
            message: 'Incoming call rejected',
            callSid 
        });

    } catch (error) {
        logError('Call rejection', error, { callSid: req.params.callSid, user_id: req.user.id });
        res.status(500).json({ 
            error: 'Failed to reject call',
            success: false 
        });
    }
};

/**
 * Get all active calls for authenticated user
 * @route GET /api/calls/active  
 * @access Private (requires JWT token)
 */
const getActiveCalls = async (req, res) => {
    try {
        const user_id = req.user.id;
        const calls = await callManager.getAllCalls();
        
        // Filter calls for authenticated user only
        const userCalls = calls.filter(call => 
            call.user_id === user_id && 
            call.status && 
            !['completed', 'failed', 'rejected'].includes(call.status)
        );

        // Enrich calls with contact information
        const enrichedCalls = await Promise.all(
            userCalls.map(async (call) => {
                if (call.contact_id) {
                    const contact = await prisma.contact.findUnique({
                        where: { id: call.contact_id }
                    });
                    return {
                        ...call,
                        contact: contact ? {
                            id: contact.id,
                            name: contact.name
                        } : null
                    };
                }
                return call;
            })
        );

        res.json({ 
            success: true,
            calls: enrichedCalls,
            count: enrichedCalls.length
        });

    } catch (error) {
        logError('Fetching active calls', error, { user_id: req.user.id });
        res.status(500).json({ 
            error: 'Failed to fetch active calls',
            success: false,
            calls: []
        });
    }
};

/**
 * Get pending incoming calls for authenticated user
 * @route GET /api/calls/pending
 * @access Private (requires JWT token)
 */
const getPendingCalls = async (req, res) => {
    try {
        const user_id = req.user.id;
        const pendingCalls = await callManager.getPendingCalls();

        // Filter pending calls that might be relevant to this user
        // In practice, you might want to implement better routing logic
        const enrichedCalls = await Promise.all(
            pendingCalls.map(async (call) => {
                // Try to find contact by phone number for this user
                const contact = await prisma.contact.findFirst({
                    where: { 
                        phone: call.from,
                        userId: String(user_id)
                    }
                });
                
                return {
                    ...call,
                    contact: contact ? {
                        id: contact.id,
                        name: contact.name
                    } : null
                };
            })
        );

        res.json({ 
            success: true,
            pendingCalls: enrichedCalls,
            count: enrichedCalls.length
        });

    } catch (error) {
        logError('Fetching pending calls', error, { user_id: req.user.id });
        res.status(500).json({ 
            error: 'Failed to fetch pending calls',
            success: false,
            pendingCalls: []
        });
    }
};

/**
 * Get call details by SID (AUTHENTICATED)
 * @route GET /api/calls/:callSid
 * @access Private (requires JWT token)
 */
const getCallDetails = async (req, res) => {
    try {
        const { callSid } = req.params;
        const user_id = req.user.id;
        const callInfo = await callManager.getCall(callSid);

        if (!callInfo) {
            return res.status(404).json({ 
                error: 'Call not found',
                success: false 
            });
        }

        // Check if user owns this call
        if (callInfo.user_id !== user_id) {
            return res.status(403).json({
                error: 'You can only view your own calls',
                success: false
            });
        }

        // Enrich with contact information
        let enrichedCall = { ...callInfo };

        if (callInfo.contact_id) {
            const contact = await prisma.contact.findUnique({
                where: { id: callInfo.contact_id }
            });
            enrichedCall.contact = contact ? {
                id: contact.id,
                name: contact.name
            } : null;
        }

        if (callInfo.user_id) {
            const user = await prisma.user.findUnique({
                where: { id: String(callInfo.user_id) },
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            });
            enrichedCall.user = user;
        }

        res.json({ 
            success: true,
            call: enrichedCall
        });

    } catch (error) {
        logError('Fetching call details', error, { callSid: req.params.callSid, user_id: req.user.id });
        res.status(500).json({ 
            error: 'Failed to fetch call details',
            success: false 
        });
    }
};

/**
 * ===================================
 * HELPER FUNCTIONS
 * ===================================
 */

/**
 * Update call history in database when call status changes
 * @param {string} callSid - Twilio call SID
 * @param {Object} statusData - Status update data from webhook
 */
const updateCallHistoryFromWebhook = async (callSid, statusData) => {
    try {
        const callInfo = await callManager.getCall(callSid);
        if (!callInfo || !callInfo.user_id) {
            return; // No user associated with this call
        }

        const updates = {
            status: statusData.CallStatus
        };

        // Add duration and end time for completed calls
        if (statusData.CallStatus === 'completed' && statusData.CallDuration) {
            updates.duration = parseInt(statusData.CallDuration);
            updates.endedAt = new Date();
        }

        await prisma.call.updateMany({
            where: { 
                callSid: callSid,
                userId: String(callInfo.user_id)
            },
            data: updates
        });
        
        logCall('history_updated', callSid, { 
            user_id: callInfo.user_id, 
            status: statusData.CallStatus 
        });

    } catch (error) {
        logError('Updating call history from webhook', error, { callSid, statusData });
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
    getCallDetails,
    
    // Helper functions
    updateCallHistoryFromWebhook
};

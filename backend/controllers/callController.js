// const twilioClient = require('../utils/twilioClient');
// const callManager = require('../utils/callManager');
// const { logCall, logError } = require('../utils/logger');
// const User = require('../models/user.model');
// const Contact = require('../models/contact.model');

// /**
//  * ===================================
//  * OUTBOUND CALL OPERATIONS
//  * ===================================
//  */

// /**
//  * Initiate an outbound call
//  * @route POST /api/calls/make
//  * @param {Object} req.body - Request body containing phone number and optional user_id
//  * @param {string} req.body.to - Destination phone number
//  * @param {number} req.body.user_id - Optional user ID for call history
//  * @returns {Object} Call initiation response with SID and status
//  */
// const makeCall = async (req, res) => {
//     try {
//         const { to, user_id } = req.body;
        
//         // Input validation
//         if (!to) {
//             logCall('validation_failed', null, { reason: 'Missing phone number' });
//             return res.status(400).json({ 
//                 error: 'Phone number is required',
//                 success: false 
//             });
//         }

//         // Validate user if provided
//         let user = null;
//         let contact = null;
//         if (user_id) {
//             user = await User.findById(user_id);
//             if (!user) {
//                 return res.status(404).json({ 
//                     error: 'User not found',
//                     success: false 
//                 });
//             }
            
//             // Try to find existing contact for this phone number
//             contact = await Contact.findByPhone(to, user_id);
//         }

//         // Initiate call via Twilio
//         const call = await twilioClient.calls.create({
//             url: `${process.env.WEBHOOK_BASE_URL}/webhooks/answer`,
//             to: to,
//             from: process.env.TWILIO_PHONE_NUMBER,
//             statusCallback: `${process.env.WEBHOOK_BASE_URL}/webhooks/status`,
//             statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed', 'failed']
//         });

//         // Store call info in Redis
//         await callManager.addCall(call.sid, {
//             to: to,
//             from: process.env.TWILIO_PHONE_NUMBER,
//             sid: call.sid,
//             direction: 'outbound',
//             user_id: user_id || null,
//             contact_id: contact ? contact.id : null
//         });

//         // Add call to user's history if user is specified
//         if (user) {
//             await user.addCallHistory({
//                 call_sid: call.sid,
//                 direction: 'outbound',
//                 phone_number: to,
//                 status: 'initiated',
//                 started_at: new Date().toISOString(),
//                 contact_id: contact ? contact.id : null
//             });
//         }

//         logCall('initiated', call.sid, { 
//             to, 
//             from: process.env.TWILIO_PHONE_NUMBER,
//             user_id,
//             contact_name: contact ? contact.name : null
//         });

//         res.json({
//             success: true,
//             callSid: call.sid,
//             status: 'calling',
//             to: to,
//             contact: contact ? contact.toJSON() : null,
//             message: 'Call initiated successfully'
//         });

//     } catch (error) {
//         logError('Call initiation', error, { to: req.body.to, user_id: req.body.user_id });
//         res.status(500).json({ 
//             error: 'Failed to make call',
//             success: false,
//             details: process.env.NODE_ENV === 'development' ? error.message : undefined
//         });
//     }
// };

// /**
//  * Terminate an active call
//  * @route POST /api/calls/hangup/:callSid
//  * @param {string} req.params.callSid - Twilio call SID to terminate
//  * @returns {Object} Call termination confirmation
//  */
// const hangupCall = async (req, res) => {
//     try {
//         const { callSid } = req.params;

//         // Validate call exists
//         const callInfo = await callManager.getCall(callSid);
//         if (!callInfo) {
//             return res.status(404).json({ 
//                 error: 'Call not found',
//                 success: false 
//             });
//         }

//         // Terminate call via Twilio
//         await twilioClient.calls(callSid).update({
//             status: 'completed'
//         });

//         // Update call status and remove from active calls
//         await callManager.updateCall(callSid, { 
//             status: 'completed',
//             endTime: new Date().toISOString()
//         });

//         // Update call history in database if user is associated
//         if (callInfo.user_id) {
//             const user = await User.findById(callInfo.user_id);
//             if (user) {
//                 await user.updateCallHistory(callSid, {
//                     status: 'completed',
//                     ended_at: new Date().toISOString()
//                 });
//             }
//         }
        
//         // Remove from active storage after brief delay for webhook processing
//         setTimeout(() => callManager.removeCall(callSid), 2000);

//         logCall('terminated', callSid, { reason: 'user_initiated' });

//         res.json({
//             success: true,
//             message: 'Call ended successfully',
//             callSid: callSid
//         });

//     } catch (error) {
//         logError('Call termination', error, { callSid: req.params.callSid });
//         res.status(500).json({ 
//             error: 'Failed to end call',
//             success: false 
//         });
//     }
// };

// /**
//  * ===================================
//  * INCOMING CALL OPERATIONS  
//  * ===================================
//  */

// /**
//  * Accept an incoming call
//  * @route POST /api/calls/accept/:callSid
//  * @param {string} req.params.callSid - Twilio call SID to accept
//  * @param {Object} req.body - Optional user_id for call history
//  * @returns {Object} Call acceptance confirmation
//  */
// const acceptIncomingCall = async (req, res) => {
//     try {
//         const { callSid } = req.params;
//         const { user_id } = req.body;
        
//         const callInfo = await callManager.getCall(callSid);
//         if (!callInfo) {
//             return res.status(404).json({ 
//                 error: 'Incoming call not found',
//                 success: false 
//             });
//         }

//         // Update call status to accepted
//         await callManager.updateCall(callSid, { 
//             status: 'accepted',
//             acceptedAt: new Date().toISOString(),
//             user_id: user_id || null
//         });

//         // Remove from pending calls
//         await callManager.removePendingCall(callSid);

//         // Add to user's call history if user is specified
//         if (user_id) {
//             const user = await User.findById(user_id);
//             if (user) {
//                 // Try to find existing contact for this phone number
//                 const contact = await Contact.findByPhone(callInfo.from, user_id);
                
//                 await user.addCallHistory({
//                     call_sid: callSid,
//                     direction: 'inbound',
//                     phone_number: callInfo.from,
//                     status: 'accepted',
//                     started_at: new Date().toISOString(),
//                     contact_id: contact ? contact.id : null
//                 });
//             }
//         }

//         logCall('accepted', callSid, { from: callInfo.from, user_id });

//         res.json({ 
//             success: true, 
//             message: 'Incoming call accepted',
//             callSid 
//         });

//     } catch (error) {
//         logError('Call acceptance', error, { callSid: req.params.callSid });
//         res.status(500).json({ 
//             error: 'Failed to accept call',
//             success: false 
//         });
//     }
// };

// /**
//  * Reject an incoming call
//  * @route POST /api/calls/reject/:callSid
//  * @param {string} req.params.callSid - Twilio call SID to reject
//  * @param {Object} req.body - Optional user_id for call history
//  * @returns {Object} Call rejection confirmation
//  */
// const rejectIncomingCall = async (req, res) => {
//     try {
//         const { callSid } = req.params;
//         const { user_id } = req.body;
        
//         const callInfo = await callManager.getCall(callSid);
//         if (!callInfo) {
//             return res.status(404).json({ 
//                 error: 'Incoming call not found',
//                 success: false 
//             });
//         }

//         // Update call status to rejected
//         await callManager.updateCall(callSid, { 
//             status: 'rejected',
//             rejectedAt: new Date().toISOString()
//         });

//         // Remove from pending calls
//         await callManager.removePendingCall(callSid);

//         // Add to user's call history if user is specified
//         if (user_id) {
//             const user = await User.findById(user_id);
//             if (user) {
//                 // Try to find existing contact for this phone number
//                 const contact = await Contact.findByPhone(callInfo.from, user_id);
                
//                 await user.addCallHistory({
//                     call_sid: callSid,
//                     direction: 'inbound',
//                     phone_number: callInfo.from,
//                     status: 'rejected',
//                     started_at: new Date().toISOString(),
//                     ended_at: new Date().toISOString(),
//                     contact_id: contact ? contact.id : null
//                 });
//             }
//         }

//         logCall('rejected', callSid, { from: callInfo.from, user_id });

//         res.json({ 
//             success: true, 
//             message: 'Incoming call rejected',
//             callSid 
//         });

//     } catch (error) {
//         logError('Call rejection', error, { callSid: req.params.callSid });
//         res.status(500).json({ 
//             error: 'Failed to reject call',
//             success: false 
//         });
//     }
// };

// /**
//  * ===================================
//  * CALL STATUS & MONITORING
//  * ===================================
//  */

// /**
//  * Get all active calls
//  * @route GET /api/calls/active  
//  * @returns {Object} List of currently active calls
//  */
// const getActiveCalls = async (req, res) => {
//     try {
//         const calls = await callManager.getAllCalls();
        
//         // Filter only active calls (not completed/failed)
//         const activeCalls = calls.filter(call => 
//             call.status && !['completed', 'failed', 'rejected'].includes(call.status)
//         );

//         // Enrich calls with contact information if available
//         const enrichedCalls = await Promise.all(
//             activeCalls.map(async (call) => {
//                 if (call.contact_id) {
//                     const contact = await Contact.findById(call.contact_id);
//                     return {
//                         ...call,
//                         contact: contact ? contact.toJSON() : null
//                     };
//                 }
//                 return call;
//             })
//         );

//         res.json({ 
//             success: true,
//             calls: enrichedCalls,
//             count: enrichedCalls.length
//         });

//     } catch (error) {
//         logError('Fetching active calls', error);
//         res.status(500).json({ 
//             error: 'Failed to fetch active calls',
//             success: false,
//             calls: []
//         });
//     }
// };

// /**
//  * Get pending incoming calls
//  * @route GET /api/calls/pending
//  * @returns {Object} List of incoming calls awaiting response
//  */
// const getPendingCalls = async (req, res) => {
//     try {
//         const pendingCalls = await callManager.getPendingCalls();

//         // Enrich pending calls with contact information if available
//         const enrichedCalls = await Promise.all(
//             pendingCalls.map(async (call) => {
//                 // Try to find contact by phone number for any user (simplified for demo)
//                 // In production, you'd want to be more specific about which user context
//                 const contacts = await Contact.search(call.from, null, { limit: 1 });
//                 const contact = contacts.length > 0 ? contacts[0] : null;
                
//                 return {
//                     ...call,
//                     contact: contact ? contact.toJSON() : null
//                 };
//             })
//         );

//         res.json({ 
//             success: true,
//             pendingCalls: enrichedCalls,
//             count: enrichedCalls.length
//         });

//     } catch (error) {
//         logError('Fetching pending calls', error);
//         res.status(500).json({ 
//             error: 'Failed to fetch pending calls',
//             success: false,
//             pendingCalls: []
//         });
//     }
// };

// /**
//  * Get call details by SID
//  * @route GET /api/calls/:callSid
//  * @param {string} req.params.callSid - Twilio call SID
//  * @returns {Object} Detailed call information
//  */
// const getCallDetails = async (req, res) => {
//     try {
//         const { callSid } = req.params;
//         const callInfo = await callManager.getCall(callSid);

//         if (!callInfo) {
//             return res.status(404).json({ 
//                 error: 'Call not found',
//                 success: false 
//             });
//         }

//         // Enrich with contact and user information
//         let enrichedCall = { ...callInfo };

//         if (callInfo.contact_id) {
//             const contact = await Contact.findById(callInfo.contact_id);
//             enrichedCall.contact = contact ? contact.toJSON() : null;
//         }

//         if (callInfo.user_id) {
//             const user = await User.findById(callInfo.user_id);
//             enrichedCall.user = user ? user.toJSON() : null;
//         }

//         res.json({ 
//             success: true,
//             call: enrichedCall
//         });

//     } catch (error) {
//         logError('Fetching call details', error, { callSid: req.params.callSid });
//         res.status(500).json({ 
//             error: 'Failed to fetch call details',
//             success: false 
//         });
//     }
// };

// /**
//  * ===================================
//  * HELPER FUNCTIONS
//  * ===================================
//  */

// /**
//  * Update call history in database when call status changes
//  * @param {string} callSid - Twilio call SID
//  * @param {Object} statusData - Status update data from webhook
//  */
// const updateCallHistoryFromWebhook = async (callSid, statusData) => {
//     try {
//         const callInfo = await callManager.getCall(callSid);
//         if (!callInfo || !callInfo.user_id) {
//             return; // No user associated with this call
//         }

//         const user = await User.findById(callInfo.user_id);
//         if (!user) {
//             return;
//         }

//         const updates = {
//             status: statusData.CallStatus
//         };

//         // Add duration and end time for completed calls
//         if (statusData.CallStatus === 'completed' && statusData.CallDuration) {
//             updates.duration = parseInt(statusData.CallDuration);
//             updates.ended_at = new Date().toISOString();
//         }

//         await user.updateCallHistory(callSid, updates);
        
//         logCall('history_updated', callSid, { 
//             user_id: callInfo.user_id, 
//             status: statusData.CallStatus 
//         });

//     } catch (error) {
//         logError('Updating call history from webhook', error, { callSid, statusData });
//     }
// };

// module.exports = {
//     // Outbound operations
//     makeCall,
//     hangupCall,
    
//     // Incoming operations
//     acceptIncomingCall,
//     rejectIncomingCall,
    
//     // Status & monitoring
//     getActiveCalls,
//     getPendingCalls,
//     getCallDetails,
    
//     // Helper functions
//     updateCallHistoryFromWebhook
// };

const twilioClient = require('../utils/twilioClient');
const callManager = require('../utils/callManager');
const { PrismaClient } = require('@prisma/client');
const { logCall, logError } = require('../utils/logger');
const { CALL_DIRECTIONS, CALL_STATUSES } = require('../utils/constants');

const prisma = new PrismaClient();

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
        const userId = req.user.id;
        
        // Input validation
        if (!to) {
            logCall('validation_failed', null, { reason: 'Missing phone number', userId });
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

        // Store call info in Redis (for real-time tracking)
        await callManager.addCall(call.sid, {
            to: to,
            from: process.env.TWILIO_PHONE_NUMBER,
            sid: call.sid,
            direction: 'outbound',
            userId: userId
        });

        // Store call in database
        const dbCall = await prisma.call.create({
            data: {
                callSid: call.sid,
                userId: userId,
                direction: CALL_DIRECTIONS.OUTBOUND,
                fromNumber: process.env.TWILIO_PHONE_NUMBER,
                toNumber: to,
                status: CALL_STATUSES.INITIATED,
                startTime: new Date()
            }
        });

        logCall('initiated', call.sid, { 
            to, 
            from: process.env.TWILIO_PHONE_NUMBER,
            userId,
            dbCallId: dbCall.id
        });

        res.json({
            success: true,
            callSid: call.sid,
            callId: dbCall.id,
            status: 'calling',
            to: to,
            message: 'Call initiated successfully'
        });

    } catch (error) {
        logError('Call initiation', error, { to: req.body.to, userId: req.user?.id });
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
        const userId = req.user.id;

        // Validate call exists and belongs to user
        const dbCall = await prisma.call.findFirst({
            where: {
                callSid: callSid,
                userId: userId
            }
        });

        if (!dbCall) {
            return res.status(404).json({ 
                error: 'Call not found or access denied',
                success: false 
            });
        }

        // Terminate call via Twilio
        await twilioClient.calls(callSid).update({
            status: 'completed'
        });

        // Update call status in Redis
        await callManager.updateCall(callSid, { 
            status: 'completed',
            endTime: new Date().toISOString()
        });

        // Update call in database
        await prisma.call.update({
            where: { id: dbCall.id },
            data: { 
                status: CALL_STATUSES.COMPLETED,
                endTime: new Date()
            }
        });
        
        // Remove from active storage after brief delay for webhook processing
        setTimeout(() => callManager.removeCall(callSid), 2000);

        logCall('terminated', callSid, { reason: 'user_initiated', userId });

        res.json({
            success: true,
            message: 'Call ended successfully',
            callSid: callSid
        });

    } catch (error) {
        logError('Call termination', error, { callSid: req.params.callSid, userId: req.user?.id });
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
        const userId = req.user.id;
        
        const callInfo = await callManager.getCall(callSid);
        if (!callInfo) {
            return res.status(404).json({ 
                error: 'Incoming call not found',
                success: false 
            });
        }

        // Update call status in Redis
        await callManager.updateCall(callSid, { 
            status: 'accepted',
            acceptedAt: new Date().toISOString(),
            userId: userId
        });

        // Create or update call in database
        await prisma.call.upsert({
            where: { callSid: callSid },
            update: {
                status: CALL_STATUSES.ANSWERED,
                userId: userId
            },
            create: {
                callSid: callSid,
                userId: userId,
                direction: CALL_DIRECTIONS.INBOUND,
                fromNumber: callInfo.from,
                toNumber: callInfo.to,
                status: CALL_STATUSES.ANSWERED,
                startTime: new Date()
            }
        });

        // Remove from pending calls
        await callManager.removePendingCall(callSid);

        logCall('accepted', callSid, { from: callInfo.from, userId });

        res.json({ 
            success: true, 
            message: 'Incoming call accepted',
            callSid 
        });

    } catch (error) {
        logError('Call acceptance', error, { callSid: req.params.callSid, userId: req.user?.id });
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
        const userId = req.user.id;
        
        const callInfo = await callManager.getCall(callSid);
        if (!callInfo) {
            return res.status(404).json({ 
                error: 'Incoming call not found',
                success: false 
            });
        }

        // Update call status in Redis
        await callManager.updateCall(callSid, { 
            status: 'rejected',
            rejectedAt: new Date().toISOString(),
            userId: userId
        });

        // Create call record in database
        await prisma.call.upsert({
            where: { callSid: callSid },
            update: {
                status: CALL_STATUSES.CANCELED,
                userId: userId
            },
            create: {
                callSid: callSid,
                userId: userId,
                direction: CALL_DIRECTIONS.INBOUND,
                fromNumber: callInfo.from,
                toNumber: callInfo.to,
                status: CALL_STATUSES.CANCELED,
                startTime: new Date(),
                endTime: new Date()
            }
        });

        // Remove from pending calls
        await callManager.removePendingCall(callSid);

        logCall('rejected', callSid, { from: callInfo.from, userId });

        res.json({ 
            success: true, 
            message: 'Incoming call rejected',
            callSid 
        });

    } catch (error) {
        logError('Call rejection', error, { callSid: req.params.callSid, userId: req.user?.id });
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
 * Get all active calls for current user
 * @route GET /api/calls/active  
 * @returns {Object} List of currently active calls
 */
const getActiveCalls = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get calls from Redis and filter by user
        const allCalls = await callManager.getAllCalls();
        const userCalls = allCalls.filter(call => 
            call.userId === userId && 
            call.status && 
            !['completed', 'failed', 'rejected'].includes(call.status)
        );

        res.json({ 
            success: true,
            calls: userCalls,
            count: userCalls.length
        });

    } catch (error) {
        logError('Fetching active calls', error, { userId: req.user?.id });
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
        logError('Fetching pending calls', error, { userId: req.user?.id });
        res.status(500).json({ 
            error: 'Failed to fetch pending calls',
            success: false,
            pendingCalls: []
        });
    }
};

/**
 * Get call history for current user
 * @route GET /api/calls/history
 * @returns {Object} User's call history with pagination
 */
const getCallHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const offset = (page - 1) * limit;

        // Get call history from database
        const [calls, totalCount] = await Promise.all([
            prisma.call.findMany({
                where: { userId },
                orderBy: { startTime: 'desc' },
                take: limit,
                skip: offset,
                select: {
                    id: true,
                    callSid: true,
                    direction: true,
                    fromNumber: true,
                    toNumber: true,
                    status: true,
                    duration: true,
                    startTime: true,
                    endTime: true,
                    cost: true
                }
            }),
            prisma.call.count({
                where: { userId }
            })
        ]);

        res.json({
            success: true,
            calls,
            pagination: {
                page,
                limit,
                total: totalCount,
                pages: Math.ceil(totalCount / limit)
            }
        });

    } catch (error) {
        logError('Fetching call history', error, { userId: req.user?.id });
        res.status(500).json({
            error: 'Failed to fetch call history',
            success: false
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
        const userId = req.user.id;

        // Check both Redis and database
        const [redisCall, dbCall] = await Promise.all([
            callManager.getCall(callSid),
            prisma.call.findFirst({
                where: {
                    callSid: callSid,
                    userId: userId
                }
            })
        ]);

        if (!dbCall && !redisCall) {
            return res.status(404).json({ 
                error: 'Call not found or access denied',
                success: false 
            });
        }

        // Merge data from both sources
        const callInfo = {
            ...dbCall,
            ...redisCall,
            // Prefer database data for persistent fields
            id: dbCall?.id,
            userId: dbCall?.userId || redisCall?.userId,
            direction: dbCall?.direction || redisCall?.direction,
            status: redisCall?.status || dbCall?.status
        };

        res.json({ 
            success: true,
            call: callInfo
        });

    } catch (error) {
        logError('Fetching call details', error, { 
            callSid: req.params.callSid, 
            userId: req.user?.id 
        });
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
    getCallHistory,
    getCallDetails
};
const twilioClient = require('../utils/twilioClient');
const callManager = require('../utils/callManager');

const makeCall = async (req, res) => {
    try {
        const { to } = req.body;
        
        if (!to) {
            return res.status(400).json({ error: 'Phone number is required' });
        }

        const call = await twilioClient.calls.create({
            url: `${process.env.WEBHOOK_BASE_URL}/webhooks/answer`,
            to: to,
            from: process.env.TWILIO_PHONE_NUMBER,
            statusCallback: `${process.env.WEBHOOK_BASE_URL}/webhooks/status`,
            statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed']
        });

        // Store call info
        callManager.addCall(call.sid, {
            to: to,
            from: process.env.TWILIO_PHONE_NUMBER,
            sid: call.sid
        });

        res.json({
            success: true,
            callSid: call.sid,
            status: 'calling',
            to: to
        });

    } catch (error) {
        console.error('Error making call:', error);
        res.status(500).json({ error: 'Failed to make call' });
    }
};

const hangupCall = async (req, res) => {
    try {
        const { callSid } = req.params;

        await twilioClient.calls(callSid).update({
            status: 'completed'
        });

        callManager.removeCall(callSid);

        res.json({
            success: true,
            message: 'Call ended',
            callSid: callSid
        });

    } catch (error) {
        console.error('Error hanging up call:', error);
        res.status(500).json({ error: 'Failed to end call' });
    }
};

const getActiveCalls = (req, res) => {
    const calls = callManager.getAllCalls();
    res.json({ calls });
};

module.exports = {
    makeCall,
    hangupCall,
    getActiveCalls
};
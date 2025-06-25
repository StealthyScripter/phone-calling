const twilio = require('twilio');
const callManager = require('../utils/callManager');

const handleAnswer = (req, res) => {
    const twiml = new twilio.twiml.VoiceResponse();
    
    // Simple greeting for MVP
    twiml.say('Hello! You are connected through the calling app.');
    
    // Keep the call alive and wait for further instructions
    twiml.pause({ length: 1 });
    twiml.say('This call will now connect you to the other party.');
    
    res.type('text/xml');
    res.send(twiml.toString());
};

const handleStatus = (req, res) => {
    const { CallSid, CallStatus, From, To } = req.body;
    
    console.log(`📞 Call ${CallSid}: ${CallStatus} (${From} → ${To})`);
    
    // Update call status in memory
    callManager.updateCall(CallSid, { status: CallStatus });
    
    if (CallStatus === 'completed') {
        callManager.removeCall(CallSid);
    }
    
    res.sendStatus(200);
};

const rejectCall = (req, res) => {
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.reject();
    
    res.type('text/xml');
    res.send(twiml.toString());
};

module.exports = {
    handleAnswer,
    handleStatus,
    rejectCall
};
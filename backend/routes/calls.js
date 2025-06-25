const express = require('express');
const router = express.Router();
const { makeCall, hangupCall, getActiveCalls } = require('../controllers/callController');

router.post('/make', makeCall);
router.post('/hangup/:callSid', hangupCall);
router.get('/active', getActiveCalls);

module.exports = router;
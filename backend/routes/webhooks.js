const express = require('express');
const router = express.Router();
const { handleAnswer, handleStatus, rejectCall } = require('../controllers/webhookController');

router.post('/answer', handleAnswer);
router.post('/status', handleStatus);
router.post('/reject', rejectCall);

module.exports = router;
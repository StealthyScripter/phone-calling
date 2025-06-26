const twilio = require('twilio');

// Check for required environment variables
if (!process.env.TWILIO_ACCOUNT_SID) {
    console.error('❌ TWILIO_ACCOUNT_SID is missing from environment variables');
    console.error('Make sure your .env file contains Twilio SID');
    process.exit(1);
}

if (!process.env.TWILIO_AUTH_TOKEN) {
    console.error('❌ TWILIO_AUTH_TOKEN is missing from environment variables');
    console.error('Make sure your .env file contains twilio auth token');
    process.exit(1);
}

console.log('✅ Twilio credentials loaded successfully');
console.log('Account SID:', process.env.TWILIO_ACCOUNT_SID.substring(0, 10) + '...');
console.log('Auth Token:', process.env.TWILIO_AUTH_TOKEN.substring(0, 8) + '...');

const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

module.exports = client;
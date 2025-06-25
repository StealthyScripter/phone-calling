// test-env.js - Create this file in your backend directory
require('dotenv').config();

console.log('=== Environment Variables Test ===\n');

console.log('Current working directory:', process.cwd());
console.log('Node.js version:', process.version);
console.log('');

console.log('Environment Variables:');
console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID);
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN);
console.log('TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER);
console.log('PORT:', process.env.PORT);
console.log('');

// Check if .env file exists
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env');
console.log('Looking for .env at:', envPath);

if (fs.existsSync(envPath)) {
    console.log('✅ .env file exists');
    const envContent = fs.readFileSync(envPath, 'utf8');
    console.log('File content preview:');
    console.log(envContent.split('\n').slice(0, 5).join('\n'));
} else {
    console.log('❌ .env file NOT FOUND');
}

console.log('');

// Test Twilio connection
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    console.log('✅ Credentials found, testing Twilio...');
    
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch()
        .then(account => {
            console.log('✅ Twilio connection successful!');
            console.log('Account status:', account.status);
        })
        .catch(error => {
            console.error('❌ Twilio connection failed:', error.message);
        });
} else {
    console.log('❌ Missing Twilio credentials in environment');
}

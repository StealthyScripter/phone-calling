/**
 * Models index file for easy importing
 * Centralizes all model exports for clean imports throughout the application
 */

const User = require('./User');
const Contact = require('./Contact');

module.exports = {
    User,
    Contact
};

// Also export individually for backwards compatibility
module.exports.User = User;
module.exports.Contact = Contact;
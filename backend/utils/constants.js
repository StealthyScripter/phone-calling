/**
 * Database enum constants for SQLite compatibility
 * Since SQLite doesn't support native enums, we use string fields with validation
 */

// User roles
const USER_ROLES = {
    USER: 'USER',
    ADMIN: 'ADMIN',
    SUPER_ADMIN: 'SUPER_ADMIN'
};

// Call directions
const CALL_DIRECTIONS = {
    INBOUND: 'INBOUND',
    OUTBOUND: 'OUTBOUND'
};

// Call statuses
const CALL_STATUSES = {
    INITIATED: 'INITIATED',
    RINGING: 'RINGING',
    ANSWERED: 'ANSWERED',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
    BUSY: 'BUSY',
    NO_ANSWER: 'NO_ANSWER',
    CANCELED: 'CANCELED'
};

/**
 * Validation functions
 */
const isValidRole = (role) => {
    return Object.values(USER_ROLES).includes(role);
};

const isValidDirection = (direction) => {
    return Object.values(CALL_DIRECTIONS).includes(direction);
};

const isValidCallStatus = (status) => {
    return Object.values(CALL_STATUSES).includes(status);
};

/**
 * Get all valid values as arrays
 */
const getValidRoles = () => Object.values(USER_ROLES);
const getValidDirections = () => Object.values(CALL_DIRECTIONS);
const getValidCallStatuses = () => Object.values(CALL_STATUSES);

module.exports = {
    USER_ROLES,
    CALL_DIRECTIONS,
    CALL_STATUSES,
    isValidRole,
    isValidDirection,
    isValidCallStatus,
    getValidRoles,
    getValidDirections,
    getValidCallStatuses
};
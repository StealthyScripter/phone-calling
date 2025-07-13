const redis = require('redis');
const { logger, logError } = require('./logger');

/**
 * Redis-based Call Manager
 * Handles persistent storage of call state and metadata
 */
class CallManager {
    constructor() {
        this.redisClient = null;
        this.CALL_PREFIX = 'call:';
        this.PENDING_PREFIX = 'pending:';
        this.SID_MAPPING_PREFIX = 'sid_map:';
        this.CALL_TTL = 3600; // 1 hour TTL for call data
    }

    /**
     * Initialize Redis connection
     */
    async initialize() {
        try {
            this.redisClient = redis.createClient({
                url: process.env.REDIS_URL || 'redis://localhost:6379',
                retry_strategy: (times) => Math.min(times * 50, 2000)
            });

            this.redisClient.on('error', (err) => {
                logError('Redis connection', err);
            });

            this.redisClient.on('connect', () => {
                logger.info('✅ Redis connected successfully');
            });

            await this.redisClient.connect();
        } catch (error) {
            logError('Redis initialization', error);
            // Fallback to in-memory if Redis fails
            this.redisClient = null;
            this.fallbackStorage = new Map();
            logger.warn('⚠️ Falling back to in-memory storage');
        }
    }

    /**
     * Add a new call to storage
     * @param {string} callSid - Twilio call SID
     * @param {Object} callData - Call metadata
     */
    async addCall(callSid, callData) {
        const callInfo = {
            ...callData,
            startTime: new Date().toISOString(),
            status: 'initiated',
            lastUpdated: new Date().toISOString()
        };

        try {
            if (this.redisClient) {
                await this.redisClient.setEx(
                    `${this.CALL_PREFIX}${callSid}`,
                    this.CALL_TTL,
                    JSON.stringify(callInfo)
                );
            } else {
                // Fallback to memory
                this.fallbackStorage.set(callSid, callInfo);
            }
            
            logger.info('📝 Call added to storage', { callSid, to: callData.to });
        } catch (error) {
            logError('Adding call to storage', error, { callSid });
        }
    }

    /**
     * Update call information
     * @param {string} callSid - Twilio call SID
     * @param {Object} updates - Fields to update
     */
    async updateCall(callSid, updates) {
        try {
            if (this.redisClient) {
                const existing = await this.getCall(callSid);
                if (existing) {
                    const updated = {
                        ...existing,
                        ...updates,
                        lastUpdated: new Date().toISOString()
                    };
                    
                    await this.redisClient.setEx(
                        `${this.CALL_PREFIX}${callSid}`,
                        this.CALL_TTL,
                        JSON.stringify(updated)
                    );
                }
            } else {
                // Fallback to memory
                if (this.fallbackStorage.has(callSid)) {
                    const existing = this.fallbackStorage.get(callSid);
                    this.fallbackStorage.set(callSid, { 
                        ...existing, 
                        ...updates,
                        lastUpdated: new Date().toISOString()
                    });
                }
            }
            
            logger.info('📝 Call updated', { callSid, updates });
        } catch (error) {
            logError('Updating call', error, { callSid });
        }
    }

    /**
     * Retrieve call information
     * @param {string} callSid - Twilio call SID
     * @returns {Object|null} Call data or null if not found
     */
    async getCall(callSid) {
        try {
            if (this.redisClient) {
                const data = await this.redisClient.get(`${this.CALL_PREFIX}${callSid}`);
                return data ? JSON.parse(data) : null;
            } else {
                // Fallback to memory
                return this.fallbackStorage.get(callSid) || null;
            }
        } catch (error) {
            logError('Getting call', error, { callSid });
            return null;
        }
    }

    /**
     * Remove call from storage
     * @param {string} callSid - Twilio call SID
     */
    async removeCall(callSid) {
        try {
            if (this.redisClient) {
                await this.redisClient.del(`${this.CALL_PREFIX}${callSid}`);
            } else {
                // Fallback to memory
                this.fallbackStorage.delete(callSid);
            }
            
            logger.info('🗑️ Call removed from storage', { callSid });
        } catch (error) {
            logError('Removing call', error, { callSid });
        }
    }

    /**
     * Get all active calls
     * @returns {Array} Array of call objects
     */
    async getAllCalls() {
        try {
            if (this.redisClient) {
                const keys = await this.redisClient.keys(`${this.CALL_PREFIX}*`);
                const calls = [];
                
                for (const key of keys) {
                    const data = await this.redisClient.get(key);
                    if (data) {
                        calls.push(JSON.parse(data));
                    }
                }
                
                return calls;
            } else {
                // Fallback to memory
                return Array.from(this.fallbackStorage.values());
            }
        } catch (error) {
            logError('Getting all calls', error);
            return [];
        }
    }

    /**
     * Add pending incoming call
     * @param {string} callSid - Twilio call SID
     * @param {Object} callData - Incoming call data
     */
    async addPendingCall(callSid, callData) {
        const pendingInfo = {
            ...callData,
            timestamp: new Date().toISOString(),
            status: 'ringing'
        };

        try {
            if (this.redisClient) {
                await this.redisClient.setEx(
                    `${this.PENDING_PREFIX}${callSid}`,
                    300, // 5 minutes TTL for pending calls
                    JSON.stringify(pendingInfo)
                );
            } else {
                // For fallback, use same storage with prefix
                this.fallbackStorage.set(`pending_${callSid}`, pendingInfo);
            }
            
            logger.info('📞 Pending call added', { callSid, from: callData.from });
        } catch (error) {
            logError('Adding pending call', error, { callSid });
        }
    }

    /**
     * Get all pending incoming calls
     * @returns {Array} Array of pending call objects
     */
    async getPendingCalls() {
        try {
            if (this.redisClient) {
                const keys = await this.redisClient.keys(`${this.PENDING_PREFIX}*`);
                const calls = [];
                
                for (const key of keys) {
                    const data = await this.redisClient.get(key);
                    if (data) {
                        const callData = JSON.parse(data);
                        calls.push({
                            ...callData,
                            callSid: key.replace(this.PENDING_PREFIX, '')
                        });
                    }
                }
                
                return calls;
            } else {
                // Fallback to memory
                const pending = [];
                for (const [key, value] of this.fallbackStorage.entries()) {
                    if (key.startsWith('pending_')) {
                        pending.push({
                            ...value,
                            callSid: key.replace('pending_', '')
                        });
                    }
                }
                return pending;
            }
        } catch (error) {
            logError('Getting pending calls', error);
            return [];
        }
    }

    /**
     * Remove pending call
     * @param {string} callSid - Twilio call SID
     */
    async removePendingCall(callSid) {
        try {
            if (this.redisClient) {
                await this.redisClient.del(`${this.PENDING_PREFIX}${callSid}`);
            } else {
                this.fallbackStorage.delete(`pending_${callSid}`);
            }
            
            logger.info('🗑️ Pending call removed', { callSid });
        } catch (error) {
            logError('Removing pending call', error, { callSid });
        }
    }

    /**
     * Cleanup expired calls (manual cleanup for fallback storage)
     */
    async cleanup() {
        if (!this.redisClient && this.fallbackStorage) {
            const now = new Date();
            const oneHourAgo = new Date(now - 60 * 60 * 1000);
            
            for (const [key, value] of this.fallbackStorage.entries()) {
                const lastUpdated = new Date(value.lastUpdated || value.timestamp);
                if (lastUpdated < oneHourAgo) {
                    this.fallbackStorage.delete(key);
                }
            }
        }
    }
    /**
     * Map temporary SID to real Twilio SID
     * @param {string} tempSid - Temporary SID from frontend
     * @param {string} realSid - Real Twilio SID
     */
    async mapSid(tempSid, realSid) {
    try {
        if (this.redisClient) {
        await this.redisClient.setEx(
            `${this.SID_MAPPING_PREFIX}${tempSid}`,
            this.CALL_TTL,
            realSid
        );
        } else {
        this.fallbackStorage.set(`sid_map_${tempSid}`, realSid);
        }
        console.log(`🔗 Mapped SID: ${tempSid} -> ${realSid}`);
    } catch (error) {
        console.error('Error mapping SID:', error);
    }
    }

    /**
     * Get real SID from temporary SID
     * @param {string} tempSid - Temporary SID
     * @returns {string|null} Real SID or null
     */
    async getRealSid(tempSid) {
    try {
        if (this.redisClient) {
        return await this.redisClient.get(`${this.SID_MAPPING_PREFIX}${tempSid}`);
        } else {
        return this.fallbackStorage.get(`sid_map_${tempSid}`) || null;
        }
    } catch (error) {
        console.error('Error getting real SID:', error);
        return null;
    }
    }

    /**
     * Close Redis connection
     */
    async close() {
        if (this.redisClient) {
            await this.redisClient.quit();
        }
    }
}

// Create singleton instance
const callManager = new CallManager();

module.exports = callManager;
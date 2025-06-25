// Simple in-memory call storage - upgradable to Redis for production
class CallManager {
    constructor() {
        this.activeCalls = new Map();
    }

    addCall(callSid, callData) {
        this.activeCalls.set(callSid, {
            ...callData,
            startTime: new Date(),
            status: 'initiated'
        });
    }

    updateCall(callSid, updates) {
        if (this.activeCalls.has(callSid)) {
            const existing = this.activeCalls.get(callSid);
            this.activeCalls.set(callSid, { ...existing, ...updates });
        }
    }

    getCall(callSid) {
        return this.activeCalls.get(callSid);
    }

    removeCall(callSid) {
        this.activeCalls.delete(callSid);
    }

    getAllCalls() {
        return Array.from(this.activeCalls.values());
    }
}

module.exports = new CallManager();
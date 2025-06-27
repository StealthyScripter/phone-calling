const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { logger, logError } = require('./logger');

class Database {
    constructor() {
        this.db = null;
        this.dbPath = path.join(__dirname, '..', 'data', 'phonecall.db');
    }

    /**
     * Initialize database connection and create tables
     */
    async initialize() {
        try {
            // Ensure data directory exists
            const dataDir = path.dirname(this.dbPath);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            // Create database connection
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    logError('SQLite connection', err);
                    throw err;
                }
                logger.info('✅ SQLite database connected', { path: this.dbPath });
            });

            // Enable foreign keys
            await this.run('PRAGMA foreign_keys = ON');
            
            // Create tables
            await this.createTables();
            
            logger.info('✅ Database initialized successfully');
        } catch (error) {
            logError('Database initialization', error);
            throw error;
        }
    }

    /**
     * Create database tables
     */
    async createTables() {
        const queries = [
            // Users table
            `CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE,
                phone TEXT,
                avatar_url TEXT,
                preferences TEXT DEFAULT '{}',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Contacts table
            `CREATE TABLE IF NOT EXISTS contacts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                name TEXT NOT NULL,
                phone TEXT NOT NULL,
                email TEXT,
                notes TEXT,
                is_favorite BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )`,

            // Call history table
            `CREATE TABLE IF NOT EXISTS call_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                contact_id INTEGER,
                call_sid TEXT UNIQUE NOT NULL,
                direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
                phone_number TEXT NOT NULL,
                status TEXT NOT NULL,
                duration INTEGER DEFAULT 0,
                started_at DATETIME,
                ended_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
                FOREIGN KEY (contact_id) REFERENCES contacts (id) ON DELETE SET NULL
            )`,

            // Create indexes for better performance
            `CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id)`,
            `CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone)`,
            `CREATE INDEX IF NOT EXISTS idx_call_history_user_id ON call_history(user_id)`,
            `CREATE INDEX IF NOT EXISTS idx_call_history_call_sid ON call_history(call_sid)`,
            `CREATE INDEX IF NOT EXISTS idx_call_history_created_at ON call_history(created_at DESC)`
        ];

        for (const query of queries) {
            await this.run(query);
        }

        logger.info('✅ Database tables created successfully');
    }

    /**
     * Execute a query that doesn't return rows (INSERT, UPDATE, DELETE)
     * @param {string} sql - SQL query
     * @param {Array} params - Query parameters
     * @returns {Promise<Object>} Result with lastID and changes
     */
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    logError('Database run query', err, { sql, params });
                    reject(err);
                } else {
                    resolve({
                        lastID: this.lastID,
                        changes: this.changes
                    });
                }
            });
        });
    }

    /**
     * Execute a query that returns a single row
     * @param {string} sql - SQL query
     * @param {Array} params - Query parameters
     * @returns {Promise<Object|null>} Single row or null
     */
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    logError('Database get query', err, { sql, params });
                    reject(err);
                } else {
                    resolve(row || null);
                }
            });
        });
    }

    /**
     * Execute a query that returns multiple rows
     * @param {string} sql - SQL query
     * @param {Array} params - Query parameters
     * @returns {Promise<Array>} Array of rows
     */
    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    logError('Database all query', err, { sql, params });
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    }

    /**
     * Execute multiple queries in a transaction
     * @param {Function} callback - Function that receives the database instance
     * @returns {Promise} Transaction result
     */
    async transaction(callback) {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                this.db.run('BEGIN TRANSACTION');
                
                Promise.resolve(callback(this))
                    .then(result => {
                        this.db.run('COMMIT', (err) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(result);
                            }
                        });
                    })
                    .catch(error => {
                        this.db.run('ROLLBACK', () => {
                            reject(error);
                        });
                    });
            });
        });
    }

    /**
     * Close database connection
     */
    async close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        logError('Database close', err);
                        reject(err);
                    } else {
                        logger.info('✅ Database connection closed');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    /**
     * Get database statistics
     */
    async getStats() {
        try {
            const stats = await Promise.all([
                this.get('SELECT COUNT(*) as count FROM users'),
                this.get('SELECT COUNT(*) as count FROM contacts'),
                this.get('SELECT COUNT(*) as count FROM call_history')
            ]);

            return {
                users: stats[0].count,
                contacts: stats[1].count,
                callHistory: stats[2].count
            };
        } catch (error) {
            logError('Getting database stats', error);
            return null;
        }
    }
}

// Create singleton instance
const database = new Database();

module.exports = database;
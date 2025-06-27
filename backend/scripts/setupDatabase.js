require('dotenv').config();
const database = require('../utils/database');
const User = require('../models/user.model');
const Contact = require('../models/contact.model');
const { logger } = require('../utils/logger');

async function setupDatabase() {
    try {
        console.log('🔧 Setting up database...');
        
        // Initialize database connection and create tables
        await database.initialize();
        
        console.log('✅ Database setup completed successfully!');
        console.log('');
        
        // Create a sample user and contact for testing
        await createSampleData();
        
        // Display stats
        const stats = await database.getStats();
        console.log('📊 Database Statistics:');
        console.log(`Users: ${stats.users}`);
        console.log(`Contacts: ${stats.contacts}`);
        console.log(`Call History: ${stats.callHistory}`);
        console.log('');
        
        console.log('🎉 Database is ready to use!');
        console.log('');
        console.log('Available endpoints:');
        console.log('POST /api/users - Create a user');
        console.log('GET /api/users - Get all users');
        console.log('POST /api/contacts - Create a contact');
        console.log('GET /api/users/:id/contacts - Get user contacts');
        console.log('');
        
    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
        process.exit(1);
    } finally {
        await database.close();
    }
}

async function createSampleData() {
    try {
        console.log('📝 Creating sample data...');
        
        // Check if sample user already exists
        const existingUser = await User.findByEmail('demo@example.com');
        if (existingUser) {
            console.log('⏭️  Sample data already exists, skipping...');
            return;
        }
        
        // Create sample user
        const sampleUser = await User.create({
            name: 'Demo User',
            email: 'demo@example.com',
            phone: '+1234567890',
            preferences: {
                theme: 'light',
                notifications: true
            }
        });
        
        console.log(`✅ Created sample user: ${sampleUser.name} (ID: ${sampleUser.id})`);
        
        // Create sample contacts
        const sampleContacts = [
            {
                user_id: sampleUser.id,
                name: 'John Doe',
                phone: '+1987654321',
                email: 'john.doe@example.com',
                is_favorite: true,
                notes: 'Work colleague'
            },
            {
                user_id: sampleUser.id,
                name: 'Jane Smith',
                phone: '+1555123456',
                email: 'jane.smith@example.com',
                is_favorite: false,
                notes: 'Family friend'
            },
            {
                user_id: sampleUser.id,
                name: 'Emergency Services',
                phone: '+1911',
                is_favorite: true,
                notes: 'Emergency contact'
            }
        ];
        
        for (const contactData of sampleContacts) {
            const contact = await Contact.create(contactData);
            console.log(`✅ Created sample contact: ${contact.name} (${contact.phone})`);
        }
        
        console.log('✅ Sample data created successfully!');
        
    } catch (error) {
        console.error('❌ Failed to create sample data:', error.message);
        // Don't exit here, as the database setup itself succeeded
    }
}

// Add some helper functions for manual database operations
async function resetDatabase() {
    try {
        console.log('🗑️  Resetting database...');
        
        await database.initialize();
        
        // Drop all tables
        await database.run('DROP TABLE IF EXISTS call_history');
        await database.run('DROP TABLE IF EXISTS contacts');
        await database.run('DROP TABLE IF EXISTS users');
        
        console.log('🗑️  All tables dropped');
        
        // Recreate tables
        await database.createTables();
        
        console.log('✅ Database reset completed!');
        
    } catch (error) {
        console.error('❌ Database reset failed:', error.message);
    } finally {
        await database.close();
    }
}

async function showStats() {
    try {
        await database.initialize();
        
        const stats = await database.getStats();
        
        console.log('📊 Database Statistics:');
        console.log(`Users: ${stats.users}`);
        console.log(`Contacts: ${stats.contacts}`);
        console.log(`Call History: ${stats.callHistory}`);
        
        // Show recent activity
        const recentCalls = await database.all(
            'SELECT * FROM call_history ORDER BY created_at DESC LIMIT 5'
        );
        
        if (recentCalls.length > 0) {
            console.log('');
            console.log('📞 Recent Call History:');
            recentCalls.forEach(call => {
                console.log(`  ${call.direction}: ${call.phone_number} (${call.status}) - ${call.created_at}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Failed to get stats:', error.message);
    } finally {
        await database.close();
    }
}

// Command line interface
const command = process.argv[2];

switch (command) {
    case 'reset':
        resetDatabase();
        break;
    case 'stats':
        showStats();
        break;
    case 'setup':
    default:
        setupDatabase();
        break;
}

// Export functions for use in other scripts
module.exports = {
    setupDatabase,
    resetDatabase,
    showStats,
    createSampleData
};
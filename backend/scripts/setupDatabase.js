require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { logger } = require('../utils/logger');

const prisma = new PrismaClient();

async function setupDatabase() {
    try {
        console.log('🔧 Setting up PostgreSQL database with Prisma...');
        
        // Test database connection
        await prisma.$connect();
        console.log('✅ Database connection successful');
        
        // Push schema to database (creates tables)
        console.log('📊 Syncing database schema...');
        // Note: In production, you should use migrations instead
        // Run: npm run db:migrate
        
        console.log('✅ Database setup completed successfully!');
        console.log('');
        
        // Create sample data
        await createSampleData();
        
        // Display stats
        const stats = await getDatabaseStats();
        console.log('📊 Database Statistics:');
        console.log(`Users: ${stats.users}`);
        console.log(`Contacts: ${stats.contacts}`);
        console.log(`Call History: ${stats.callHistory}`);
        console.log('');
        
        console.log('🎉 Database is ready to use!');
        console.log('');
        console.log('Available endpoints:');
        console.log('POST /api/auth/register - Register new user');
        console.log('POST /api/auth/login - User login');
        console.log('POST /api/users - Create a user');
        console.log('GET /api/users - Get all users');
        console.log('POST /api/contacts - Create a contact');
        console.log('GET /api/users/:id/contacts - Get user contacts');
        console.log('');
        
    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
        if (error.code === 'P1001') {
            console.error('💡 Make sure PostgreSQL is running and DATABASE_URL is correct');
        }
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

async function createSampleData() {
    try {
        console.log('📝 Creating sample data...');
        
        // Check if sample user already exists
        const existingUser = await prisma.user.findFirst({
            where: { email: 'demo@example.com' }
        });
        
        if (existingUser) {
            console.log('⏭️  Sample data already exists, skipping...');
            return;
        }
        
        // Create sample auth user with password
        const hashedPassword = await bcrypt.hash('password123', 12);
        const authUser = await prisma.user.create({
            data: {
                name: 'Auth Demo User',
                email: 'demo@example.com',
                username: 'demo_user',
                password: hashedPassword,
                firstName: 'Demo',
                lastName: 'User',
                phoneNumber: '+1234567890',
                preferences: {
                    theme: 'light',
                    notifications: true
                }
            }
        });
        
        console.log(`✅ Created auth user: ${authUser.name} (ID: ${authUser.id})`);
        console.log(`   📧 Email: ${authUser.email}`);
        console.log(`   🔑 Password: password123`);
        
        // Create additional sample users (without auth)
        const sampleUsers = [
            {
                name: 'John Doe',
                email: 'john.doe@example.com',
                phoneNumber: '+1987654321',
                preferences: { theme: 'dark' }
            },
            {
                name: 'Jane Smith',
                email: 'jane.smith@example.com',
                phoneNumber: '+1555123456',
                preferences: { notifications: false }
            }
        ];
        
        const createdUsers = [];
        for (const userData of sampleUsers) {
            const user = await prisma.user.create({ data: userData });
            createdUsers.push(user);
            console.log(`✅ Created sample user: ${user.name} (ID: ${user.id})`);
        }
        
        // Create sample contacts for the auth user
        const sampleContacts = [
            {
                userId: authUser.id,
                name: 'Emergency Services',
                phone: '+1911',
                isFavorite: true,
                notes: 'Emergency contact'
            },
            {
                userId: authUser.id,
                name: 'Pizza Palace',
                phone: '+15551234567',
                email: 'orders@pizzapalace.com',
                isFavorite: true,
                notes: 'Best pizza in town'
            },
            {
                userId: authUser.id,
                name: 'Dr. Johnson',
                phone: '+15559876543',
                email: 'dr.johnson@clinic.com',
                isFavorite: false,
                notes: 'Family doctor'
            }
        ];
        
        // Create contacts for other users too
        for (const user of createdUsers) {
            sampleContacts.push({
                userId: user.id,
                name: 'Work Contact',
                phone: '+15551111111',
                email: 'work@company.com',
                isFavorite: false,
                notes: 'Work related contact'
            });
        }
        
        for (const contactData of sampleContacts) {
            const contact = await prisma.contact.create({ data: contactData });
            console.log(`✅ Created sample contact: ${contact.name} (${contact.phone})`);
        }
        
        // Create some sample call history
        const sampleCalls = [
            {
                callSid: 'CA' + Math.random().toString(36).substr(2, 30), // Fake Twilio SID
                userId: authUser.id,
                direction: 'outbound',
                phoneNumber: '+15551234567',
                status: 'completed',
                duration: 125,
                startedAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
                endedAt: new Date(Date.now() - 1000 * 60 * 60 * 2 + 125000)
            },
            {
                callSid: 'CA' + Math.random().toString(36).substr(2, 30),
                userId: authUser.id,
                direction: 'inbound',
                phoneNumber: '+15559876543',
                status: 'completed',
                duration: 45,
                startedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
                endedAt: new Date(Date.now() - 1000 * 60 * 30 + 45000)
            }
        ];
        
        for (const callData of sampleCalls) {
            const call = await prisma.call.create({ data: callData });
            console.log(`✅ Created sample call: ${call.direction} to ${call.phoneNumber} (${call.status})`);
        }
        
        console.log('✅ Sample data created successfully!');
        
    } catch (error) {
        console.error('❌ Failed to create sample data:', error.message);
        // Don't exit here, as the database setup itself succeeded
    }
}

async function getDatabaseStats() {
    try {
        const [userCount, contactCount, callCount] = await Promise.all([
            prisma.user.count(),
            prisma.contact.count(),
            prisma.call.count()
        ]);

        return {
            users: userCount,
            contacts: contactCount,
            callHistory: callCount
        };
    } catch (error) {
        console.error('❌ Failed to get database stats:', error.message);
        return { users: 0, contacts: 0, callHistory: 0 };
    }
}

async function resetDatabase() {
    try {
        console.log('🗑️  Resetting database...');
        
        await prisma.$connect();
        
        // Delete all data in correct order (respecting foreign keys)
        await prisma.call.deleteMany({});
        await prisma.contact.deleteMany({});
        await prisma.user.deleteMany({});
        
        console.log('🗑️  All data deleted');
        console.log('✅ Database reset completed!');
        
    } catch (error) {
        console.error('❌ Database reset failed:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

async function showStats() {
    try {
        await prisma.$connect();
        
        const stats = await getDatabaseStats();
        
        console.log('📊 Database Statistics:');
        console.log(`Users: ${stats.users}`);
        console.log(`Contacts: ${stats.contacts}`);
        console.log(`Call History: ${stats.callHistory}`);
        
        // Show recent activity
        const recentCalls = await prisma.call.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { name: true, email: true } },
                contact: { select: { name: true } }
            }
        });
        
        if (recentCalls.length > 0) {
            console.log('');
            console.log('📞 Recent Call History:');
            recentCalls.forEach(call => {
                const userName = call.user?.name || 'Unknown User';
                const contactName = call.contact?.name || 'Unknown Contact';
                console.log(`  ${call.direction}: ${call.phoneNumber} (${call.status}) - ${call.createdAt.toISOString()}`);
                console.log(`    User: ${userName}, Contact: ${contactName}`);
            });
        }
        
        // Show users
        const users = await prisma.user.findMany({
            take: 10,
            select: { id: true, name: true, email: true, createdAt: true }
        });
        
        if (users.length > 0) {
            console.log('');
            console.log('👤 Users:');
            users.forEach(user => {
                console.log(`  ${user.name} (${user.email}) - Created: ${user.createdAt.toISOString()}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Failed to get stats:', error.message);
    } finally {
        await prisma.$disconnect();
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
    createSampleData,
    getDatabaseStats
};

# Phone Calling MVP with SQLite Database

A comprehensive Node.js backend for managing phone calls, users, and contacts using Twilio's API with SQLite database integration.

## 🚀 Features

### Core Functionality
- **Outbound Calls**: Make calls to any phone number
- **Incoming Calls**: Handle and manage incoming calls
- **Real-time Status**: Track call status with webhooks
- **Call History**: Persistent storage of all call records

### Database Features
- **User Management**: Create and manage user profiles
- **Contact Management**: Store and organize contacts with favorites
- **Call History**: Detailed call logs with duration and status
- **Search & Filter**: Find contacts and calls quickly
- **Statistics**: Call analytics per user and contact

### Technical Features
- **SQLite Database**: Lightweight, file-based database
- **Redis Integration**: For real-time call state management
- **Twilio Integration**: Professional telephony services
- **RESTful API**: Clean API design with comprehensive endpoints
- **Web Interface**: Modern, responsive frontend
- **Logging**: Comprehensive logging with Winston

## 📋 Prerequisites

- Node.js (v14 or higher)
- Twilio Account with phone number
- Redis (optional, will fallback to in-memory storage)

## 🛠️ Installation

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd backend
npm install
```

### 2. Environment Configuration

Create a `.env` file in the backend directory:

```env
# Twilio Configuration (Required)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Webhook Configuration (Required for incoming calls)
WEBHOOK_BASE_URL=https://your-ngrok-url.ngrok.io

# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration (Optional)
# SQLite database will be created in data/phonecall.db by default

# Redis Configuration (Optional - will fallback to memory)
REDIS_URL=redis://localhost:6379

# Logging Configuration (Optional)
LOG_LEVEL=info
```

### 3. Database Setup

Initialize the database with sample data:

```bash
npm run db:setup
```

Alternative database commands:
```bash
# Reset database (removes all data)
npm run db:setup reset

# View database statistics
npm run db:setup stats
```

### 4. Start Development Server

```bash
npm run dev
```

The server will start on http://localhost:3000

## 🔧 Twilio Setup

### 1. Get Twilio Credentials
1. Sign up at [Twilio Console](https://console.twilio.com)
2. Get your Account SID and Auth Token
3. Purchase a phone number

### 2. Configure Webhooks
1. Install ngrok: `npm install -g ngrok`
2. Start ngrok: `ngrok http 3000`
3. Copy the HTTPS URL to your `.env` file as `WEBHOOK_BASE_URL`
4. Configure your Twilio phone number webhooks:
   - Voice URL: `https://your-ngrok-url.ngrok.io/webhooks/incoming`
   - Status Callback: `https://your-ngrok-url.ngrok.io/webhooks/status`

## 📚 API Documentation

### Users API

#### Create User
```http
POST /api/users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "preferences": {
    "theme": "dark",
    "notifications": true
  }
}
```

#### Get All Users
```http
GET /api/users?limit=100&offset=0
```

#### Get User by ID
```http
GET /api/users/:id
```

#### Update User
```http
PUT /api/users/:id
Content-Type: application/json

{
  "name": "John Smith",
  "email": "john.smith@example.com"
}
```

#### Get User Call History
```http
GET /api/users/:id/call-history?direction=inbound&limit=50
```

#### Get User Call Statistics
```http
GET /api/users/:id/call-stats?startDate=2024-01-01&endDate=2024-12-31
```

### Contacts API

#### Create Contact
```http
POST /api/contacts
Content-Type: application/json

{
  "user_id": 1,
  "name": "Jane Doe",
  "phone": "+1987654321",
  "email": "jane@example.com",
  "notes": "Important client",
  "is_favorite": true
}
```

#### Get User Contacts
```http
GET /api/users/:userId/contacts?search=jane&favoritesOnly=true&limit=100
```

#### Search Contacts
```http
GET /api/users/:userId/contacts/search?q=jane
```

#### Toggle Favorite
```http
POST /api/contacts/:id/toggle-favorite
```

#### Get Contact Call History
```http
GET /api/contacts/:id/call-history
```

### Calls API

#### Make Call
```http
POST /api/calls/make
Content-Type: application/json

{
  "to": "+1987654321",
  "user_id": 1
}
```

#### Accept Incoming Call
```http
POST /api/calls/accept/:callSid
Content-Type: application/json

{
  "user_id": 1
}
```

#### Reject Incoming Call
```http
POST /api/calls/reject/:callSid
Content-Type: application/json

{
  "user_id": 1
}
```

#### Get Active Calls
```http
GET /api/calls/active
```

#### Get Pending Calls
```http
GET /api/calls/pending
```

#### Hangup Call
```http
POST /api/calls/hangup/:callSid
```

## 🗃️ Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    avatar_url TEXT,
    preferences TEXT DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Contacts Table
```sql
CREATE TABLE contacts (
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
);
```

### Call History Table
```sql
CREATE TABLE call_history (
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
);
```

## 🖥️ Web Interface

The application includes a modern web interface accessible at `http://localhost:3000` with the following features:

### Tabs
- **Calls**: Make calls, manage active/pending calls
- **Contacts**: Manage contacts, search, favorites
- **Users**: User management and statistics
- **History**: View call history and analytics

### Features
- **Quick Contacts**: Favorite contacts for easy calling
- **Real-time Updates**: Live updates of call status
- **Search**: Find contacts quickly
- **Statistics**: Call analytics and metrics
- **Responsive Design**: Works on mobile and desktop

## 📊 Monitoring & Health Checks

### Health Check Endpoint
```http
GET /api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "database": {
    "connected": true,
    "stats": {
      "users": 5,
      "contacts": 25,
      "callHistory": 150
    }
  },
  "callManager": {
    "connected": true,
    "activeCalls": 2
  }
}
```

### API Documentation
```http
GET /api/docs
```

### Logs
- **Application logs**: `logs/combined.log`
- **Error logs**: `logs/error.log`
- **Console output**: Real-time in development mode

## 🔧 Development Scripts

```bash
# Start development server with auto-reload
npm run dev

# Start production server
npm start

# Setup database with sample data
npm run db:setup

# Reset database (removes all data)
npm run db:setup reset

# View database statistics
npm run db:setup stats

# Run tests (when implemented)
npm test
```

## 🐛 Troubleshooting

### Common Issues

#### Database Errors
```bash
# Reset and recreate database
npm run db:setup reset
npm run db:setup
```

#### Twilio Connection Issues
1. Verify credentials in `.env` file
2. Check Twilio console for account status
3. Ensure phone number is active

#### Webhook Issues
1. Confirm ngrok is running: `ngrok http 3000`
2. Update WEBHOOK_BASE_URL in `.env`
3. Configure Twilio phone number webhooks
4. Test webhook: `GET /webhooks/health`

#### Redis Connection Issues
- Redis is optional; app will use memory fallback
- Install Redis: `brew install redis` (macOS) or `sudo apt install redis` (Ubuntu)
- Start Redis: `redis-server`

### Debug Mode
Set environment variables for debugging:
```bash
export NODE_ENV=development
export LOG_LEVEL=debug
```

## 🚀 Production Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Use production Redis instance
3. Configure persistent storage for SQLite database
4. Set up proper webhook URL (no ngrok)
5. Configure reverse proxy (nginx)
6. Set up process manager (PM2)

### Security Considerations
- Use HTTPS for webhooks
- Implement authentication for API endpoints
- Rate limiting for public endpoints
- Validate webhook signatures from Twilio
- Environment variable security

## 📝 License

This project is licensed under the ISC License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review API documentation
3. Check Twilio console for service issues
4. Create an issue in the repository
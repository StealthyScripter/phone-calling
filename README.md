# 📞 Phone Calling App

A comprehensive phone calling application built with **React Native** (frontend) and **Node.js** (backend), integrated with **Twilio** for real phone calls.

## 🚀 Features

- **📱 React Native Mobile App** - Cross-platform mobile interface
- **🖥️ Web Interface** - Browser-based calling interface  
- **☁️ Node.js Backend** - RESTful API with WebSocket support
- **📞 Twilio Integration** - Real phone calls and SMS
- **👥 Contact Management** - Store and organize contacts
- **📊 Call History** - Track all incoming and outgoing calls
- **🔄 Real-time Updates** - Live call status via WebSocket
- **💾 Database Storage** - SQLite with optional PostgreSQL
- **⚡ Redis Caching** - Call state management (optional)

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  React Native   │    │   Web Browser   │    │     Twilio      │
│   Mobile App    │◄──►│   Interface     │◄──►│   Phone API     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └─────────────►│   Node.js API   │◄─────────────┘
                        │   + WebSocket   │
                        └─────────────────┘
                                 │
                    ┌─────────────────┐    ┌─────────────────┐
                    │     SQLite      │    │     Redis       │
                    │   (Database)    │    │   (Optional)    │
                    └─────────────────┘    └─────────────────┘
```

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **npm** (v8 or higher)
- **Expo CLI** (for React Native)
- **Twilio Account** (with phone number)
- **Redis** (optional - app has fallback)
- **Docker** (optional - for PostgreSQL)

## 🛠️ Quick Start

### 1. Clone Repository

```bash
git clone <repository-url>
cd phone-calling-app
```

### 2. Install Dependencies

```bash
# Install all dependencies (backend + frontend)
npm run install:all
```

### 3. Environment Setup

Create `backend/.env` file:

```env
# Twilio Configuration (Required)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Webhook Configuration (Required for production)
WEBHOOK_BASE_URL=https://your-ngrok-url.ngrok.io

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key

# Database (SQLite by default)
# DATABASE_URL="postgresql://postgres:password@localhost:5432/phone_calling?schema=public"

# Redis (Optional - uses memory fallback)
REDIS_URL=redis://localhost:6379
```

### 4. Setup Database

```bash
# Initialize database with sample data
npm run setup
```

### 5. Start Development Servers

```bash
# Start both backend and frontend
npm run dev
```

This will start:
- **Backend**: http://localhost:3000
- **Frontend**: Expo development server (scan QR code with phone)

## 📱 Usage

### Web Interface

1. Open **http://localhost:3000** in your browser
2. Use the web interface to:
   - Make calls
   - Manage contacts
   - View call history
   - Monitor active calls

### Mobile App

1. Install **Expo Go** on your phone
2. Run `npm run dev` 
3. Scan the QR code with Expo Go
4. Use the mobile app for calling

### Making Your First Call

1. **Web Interface**: 
   - Go to http://localhost:3000
   - Enter a phone number
   - Click "Call"

2. **API Call**:
   ```bash
   curl -X POST http://localhost:3000/api/calls/make \
     -H "Content-Type: application/json" \
     -d '{"to": "+1234567890", "user_id": 1}'
   ```

3. **Mobile App**:
   - Open dialer tab
   - Enter phone number
   - Tap call button

## 🧪 Testing

### Test Backend Connectivity

```bash
# Health check
npm run health

# Full connectivity test
npm run test:connectivity

# Test specific number
curl -X POST http://localhost:3000/api/calls/make \
  -H "Content-Type: application/json" \
  -d '{"to": "+19313439345", "user_id": 1}'
```

### Test Frontend

```bash
# Start frontend only
npm run dev:frontend

# Test on different platforms
npx expo start --web      # Web browser
npx expo start --android  # Android
npx expo start --ios      # iOS
```

## 🔧 Available Scripts

### Development

```bash
npm run dev              # Start both backend and frontend
npm run dev:backend      # Start backend only
npm run dev:frontend     # Start frontend only
npm run setup           # Full setup (install + database)
```

### Database Management

```bash
npm run db:setup         # Initialize database with sample data
npm run db:reset         # Reset database (removes all data)
npm run db:stats         # Show database statistics
```

### Docker Operations

```bash
npm run docker:up        # Start PostgreSQL and Redis
npm run docker:down      # Stop Docker containers  
npm run docker:logs      # View container logs
```

### Testing & Monitoring

```bash
npm run test            # Run all tests
npm run health          # Check backend health
npm run logs:backend    # View backend logs
npm run logs:error      # View error logs
```

### Utilities

```bash
npm run clean           # Clean all node_modules
npm run reset           # Clean + reinstall + setup
npm run ngrok           # Start ngrok tunnel (install ngrok first)
```

## 🌐 API Documentation

### Authentication (Optional)

```bash
# Register user
POST /api/auth/register
{
  "email": "user@example.com",
  "username": "username",
  "password": "password"
}

# Login
POST /api/auth/login
{
  "emailOrUsername": "user@example.com",
  "password": "password"
}
```

### Call Management

```bash
# Make a call
POST /api/calls/make
{
  "to": "+1234567890",
  "user_id": 1
}

# Hangup call
POST /api/calls/hangup/:callSid

# Get active calls
GET /api/calls/active

# Get pending calls
GET /api/calls/pending
```

### User Management

```bash
# Get all users
GET /api/users

# Create user
POST /api/users
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890"
}

# Get user call history
GET /api/users/:id/call-history
```

### Contact Management

```bash
# Get user contacts
GET /api/users/:userId/contacts

# Create contact
POST /api/contacts
{
  "user_id": 1,
  "name": "Jane Doe", 
  "phone": "+1987654321",
  "email": "jane@example.com"
}

# Toggle favorite
POST /api/contacts/:id/toggle-favorite
```

### WebSocket Events

```javascript
// Connect to WebSocket
const socket = io('http://localhost:3000');

// Listen for events
socket.on('incomingCall', (data) => {
  console.log('Incoming call from:', data.from);
});

socket.on('callStatusUpdate', (data) => {
  console.log('Call status:', data.status);
});
```

## 🐳 Docker Setup

### Option 1: SQLite (Default)
```bash
# No Docker needed - uses local SQLite file
npm run setup
npm run dev
```

### Option 2: PostgreSQL + Redis
```bash
# Start Docker services
npm run docker:up

# Add to backend/.env:
# DATABASE_URL="postgresql://postgres:password@localhost:5432/phone_calling?schema=public"

# Setup database
cd backend
npm run db:generate
npm run db:push

# Start servers
npm run dev
```

### Docker Services

- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379  
- **Adminer** (DB GUI): localhost:8080

## 📞 Twilio Setup

### 1. Create Twilio Account

1. Sign up at [twilio.com](https://twilio.com)
2. Get your Account SID and Auth Token
3. Purchase a phone number

### 2. Configure Webhooks (Production)

```bash
# Install ngrok
npm install -g ngrok

# Start ngrok tunnel
npm run ngrok

# Copy HTTPS URL to backend/.env
WEBHOOK_BASE_URL=https://abc123.ngrok.io

# Configure Twilio webhooks:
# Voice URL: https://abc123.ngrok.io/webhooks/incoming
# Status Callback: https://abc123.ngrok.io/webhooks/status
```

## 🔍 Troubleshooting

### Backend Issues

```bash
# Server won't start
npm run clean
npm run setup

# Database errors
npm run db:reset
npm run db:setup

# Port already in use
lsof -ti:3000 | xargs kill -9

# Redis connection errors (add to .env)
REDIS_URL=
```

### Frontend Issues

```bash
# Expo issues
cd react-frontend
npx expo install --fix
npx expo start --clear

# Metro bundler issues
npx react-native start --reset-cache

# Connection to backend fails
# Check backend is running: npm run health
```

### Call Issues

```bash
# Calls fail to connect
1. Check Twilio account balance
2. Verify phone number format (+1 prefix)
3. Check webhook URL configuration
4. Review Twilio console for errors

# Test with curl:
curl -X POST http://localhost:3000/api/calls/make \
  -H "Content-Type: application/json" \
  -d '{"to": "+19313439345", "user_id": 1}'
```

### Docker Issues

```bash
# Containers won't start
docker-compose down
docker-compose up -d

# Database connection fails
docker-compose logs postgres
docker-compose restart postgres

# Check running containers
docker-compose ps
```

## 📂 Project Structure

```
phone-calling-app/
├── backend/                 # Node.js backend
│   ├── controllers/         # API controllers
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── utils/              # Utilities
│   ├── public/             # Web interface
│   ├── logs/               # Application logs
│   ├── data/               # SQLite database
│   └── package.json
├── react-frontend/         # React Native app
│   ├── screens/            # App screens
│   ├── components/         # Reusable components
│   ├── services/           # API services
│   └── package.json
├── package.json            # Root package.json
└── README.md              # This file
```

## 🚀 Deployment

### Backend (Production)

```bash
# Environment variables
export NODE_ENV=production
export PORT=3000
export DATABASE_URL="your-production-db-url"

# Start server
npm run start:backend
```

### Frontend (Production)

```bash
# Build for production
cd react-frontend
npx expo build:web          # Web build
npx expo build:android      # Android APK
npx expo build:ios          # iOS build
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 📞 Support

- **Documentation**: Check this README
- **Issues**: Create GitHub issue
- **API Docs**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/api/health

## 🎯 Quick Commands Reference

```bash
# Complete setup
npm run setup && npm run dev

# Test everything
npm run health && npm run test:connectivity

# Reset everything
npm run reset

# Production ready
npm run docker:up && npm run dev

# Test call
curl -X POST http://localhost:3000/api/calls/make \
  -H "Content-Type: application/json" \
  -d '{"to": "+1234567890", "user_id": 1}'
```

---

**🎉 You're ready to make calls! Start with `npm run setup && npm run dev`**
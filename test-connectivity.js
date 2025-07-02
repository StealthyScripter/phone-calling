#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const checkFile = (filePath) => {
  return fs.existsSync(filePath);
};

const runCommand = (command, cwd = process.cwd()) => {
  return new Promise((resolve, reject) => {
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stdout, stderr });
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
};

const testBackendHealth = async () => {
  try {
    const { stdout } = await runCommand('curl -s http://localhost:3000/api/health');
    const response = JSON.parse(stdout);
    return response.status === 'healthy';
  } catch (error) {
    return false;
  }
};

const testCall = async (phoneNumber) => {
  try {
    const command = `curl -s -X POST http://localhost:3000/api/calls/make -H "Content-Type: application/json" -d '{"to": "${phoneNumber}", "user_id": 1}'`;
    const { stdout } = await runCommand(command);
    const response = JSON.parse(stdout);
    return response.success === true;
  } catch (error) {
    return false;
  }
};

const main = async () => {
  log('📞 Phone Calling App - Complete System Test', 'cyan');
  log('=' * 50, 'cyan');
  
  // Test 1: Project Structure
  log('\n1. 📂 Checking Project Structure...', 'yellow');
  
  const requiredFiles = [
    'package.json',
    'README.md',
    'backend/package.json',
    'backend/.env',
    'react-frontend/package.json',
    'backend/server.js'
  ];
  
  let structureValid = true;
  for (const file of requiredFiles) {
    if (checkFile(file)) {
      log(`   ✅ ${file}`, 'green');
    } else {
      log(`   ❌ ${file} - Missing`, 'red');
      structureValid = false;
    }
  }
  
  if (!structureValid) {
    log('\n❌ Project structure incomplete. Please check missing files.', 'red');
    return;
  }
  
  // Test 2: Dependencies
  log('\n2. 📦 Checking Dependencies...', 'yellow');
  
  const hasBackendNodeModules = checkFile('backend/node_modules');
  const hasFrontendNodeModules = checkFile('react-frontend/node_modules');
  const hasRootNodeModules = checkFile('node_modules');
  
  log(`   Backend dependencies: ${hasBackendNodeModules ? '✅' : '❌'}`, hasBackendNodeModules ? 'green' : 'red');
  log(`   Frontend dependencies: ${hasFrontendNodeModules ? '✅' : '❌'}`, hasFrontendNodeModules ? 'green' : 'red');
  log(`   Root dependencies: ${hasRootNodeModules ? '✅' : '❌'}`, hasRootNodeModules ? 'green' : 'red');
  
  if (!hasRootNodeModules) {
    log('\n⚠️  Run: npm run install:all', 'yellow');
  }
  
  // Test 3: Environment Configuration
  log('\n3. ⚙️  Checking Environment Configuration...', 'yellow');
  
  try {
    const envContent = fs.readFileSync('backend/.env', 'utf8');
    const hasAccountSid = envContent.includes('TWILIO_ACCOUNT_SID=');
    const hasAuthToken = envContent.includes('TWILIO_AUTH_TOKEN=');
    const hasPhoneNumber = envContent.includes('TWILIO_PHONE_NUMBER=');
    
    log(`   Twilio Account SID: ${hasAccountSid ? '✅' : '❌'}`, hasAccountSid ? 'green' : 'red');
    log(`   Twilio Auth Token: ${hasAuthToken ? '✅' : '❌'}`, hasAuthToken ? 'green' : 'red');
    log(`   Twilio Phone Number: ${hasPhoneNumber ? '✅' : '❌'}`, hasPhoneNumber ? 'green' : 'red');
    
    if (!hasAccountSid || !hasAuthToken || !hasPhoneNumber) {
      log('   ⚠️  Please configure Twilio credentials in backend/.env', 'yellow');
    }
  } catch (error) {
    log('   ❌ Could not read backend/.env file', 'red');
  }
  
  // Test 4: Database
  log('\n4. 💾 Checking Database...', 'yellow');
  
  const hasSqliteDb = checkFile('backend/data/phonecall.db');
  log(`   SQLite Database: ${hasSqliteDb ? '✅' : '❌'}`, hasSqliteDb ? 'green' : 'red');
  
  if (!hasSqliteDb) {
    log('   ⚠️  Run: npm run db:setup', 'yellow');
  }
  
  // Test 5: Backend Health
  log('\n5. 🔍 Testing Backend Health...', 'yellow');
  
  const backendHealthy = await testBackendHealth();
  log(`   Backend Health: ${backendHealthy ? '✅' : '❌'}`, backendHealthy ? 'green' : 'red');
  
  if (!backendHealthy) {
    log('   ⚠️  Backend not running. Start with: npm run dev:backend', 'yellow');
    log('   🔗 Should be available at: http://localhost:3000', 'blue');
    return;
  }
  
  // Test 6: API Endpoints
  log('\n6. 🌐 Testing API Endpoints...', 'yellow');
  
  const endpoints = [
    { name: 'Health Check', url: 'http://localhost:3000/api/health' },
    { name: 'Users API', url: 'http://localhost:3000/api/users' },
    { name: 'Active Calls', url: 'http://localhost:3000/api/calls/active' },
    { name: 'API Docs', url: 'http://localhost:3000/api/docs' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const { stdout } = await runCommand(`curl -s -o /dev/null -w "%{http_code}" ${endpoint.url}`);
      const statusCode = stdout.trim();
      const isWorking = statusCode === '200';
      log(`   ${endpoint.name}: ${isWorking ? '✅' : '❌'} (${statusCode})`, isWorking ? 'green' : 'red');
    } catch (error) {
      log(`   ${endpoint.name}: ❌ (Error)`, 'red');
    }
  }
  
  // Test 7: Sample Call Test
  log('\n7. 📞 Testing Call API...', 'yellow');
  
  const testPhoneNumber = '+1234567890';
  const callWorked = await testCall(testPhoneNumber);
  log(`   Call API: ${callWorked ? '✅' : '❌'}`, callWorked ? 'green' : 'red');
  
  if (callWorked) {
    log(`   ✅ Successfully initiated test call to ${testPhoneNumber}`, 'green');
  } else {
    log(`   ⚠️  Call test failed - check Twilio configuration`, 'yellow');
  }
  
  // Test 8: Frontend Setup
  log('\n8. 📱 Checking Frontend Setup...', 'yellow');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('react-frontend/package.json', 'utf8'));
    const hasExpo = packageJson.dependencies && packageJson.dependencies.expo;
    const hasNavigation = packageJson.dependencies && packageJson.dependencies['@react-navigation/native'];
    
    log(`   Expo Framework: ${hasExpo ? '✅' : '❌'}`, hasExpo ? 'green' : 'red');
    log(`   Navigation: ${hasNavigation ? '✅' : '❌'}`, hasNavigation ? 'green' : 'red');
  } catch (error) {
    log('   ❌ Could not read frontend package.json', 'red');
  }
  
  // Summary
  log('\n📊 Test Summary', 'cyan');
  log('=' * 20, 'cyan');
  
  if (backendHealthy && callWorked) {
    log('🎉 All systems operational!', 'green');
    log('\n🚀 Quick Start Commands:', 'blue');
    log('   npm run dev              # Start both backend and frontend', 'blue');
    log('   npm run health           # Check backend health', 'blue');
    log('   npm run test:connectivity # Run connectivity tests', 'blue');
    
    log('\n🌐 Available Interfaces:', 'blue');
    log('   http://localhost:3000           # Web Interface', 'blue');
    log('   http://localhost:3000/api/docs  # API Documentation', 'blue');
    log('   Expo QR Code                    # Mobile App', 'blue');
    
  } else {
    log('⚠️  Some issues detected. Please fix the items marked with ❌ above.', 'yellow');
    
    log('\n🔧 Common Fixes:', 'blue');
    log('   npm run setup           # Complete setup', 'blue');
    log('   npm run install:all     # Install dependencies', 'blue');
    log('   npm run db:setup        # Setup database', 'blue');
    log('   npm run dev:backend     # Start backend only', 'blue');
  }
  
  log('\n📖 For more help, see README.md', 'blue');
};

// Run the test
main().catch(error => {
  log(`\n❌ Test failed: ${error.message}`, 'red');
  process.exit(1);
});
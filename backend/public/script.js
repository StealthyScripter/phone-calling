// Global state
let activeCalls = [];
let pendingCalls = [];
let contacts = [];
let callHistory = [];
let socket = null;
let authToken = null;
let currentUser = null;

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    checkAuthentication();
});

// ===================================
// AUTHENTICATION FUNCTIONS
// ===================================

function checkAuthentication() {
    authToken = localStorage.getItem('authToken');
    currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    
    if (authToken && currentUser) {
        showMainApp();
    } else {
        showAuthSection();
    }
}

function showAuthSection() {
    document.getElementById('authSection').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');
}

function showMainApp() {
    document.getElementById('authSection').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    
    // Update user info
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userEmail').textContent = currentUser.email;
    
    // Initialize app
    loadInitialData();
    setupEventListeners();
    initializeWebSocket();
}

function showAuthTab(tab, event) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    
    if (event && event.target) {
        event.target.classList.add('active');
    } else {
        // Fallback: find the button that was clicked
        const button = document.querySelector(`[onclick*="showAuthTab('${tab}')"]`);
        if (button) button.classList.add('active');
    }
    
    document.getElementById(tab + 'Form').classList.add('active');
    clearAuthMessage();
}

async function login(event) {
    event.preventDefault();
    
    const emailOrUsername = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emailOrUsername, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            authToken = data.token;
            currentUser = data.user;
            
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            showAuthMessage('Login successful!', 'success');
            setTimeout(showMainApp, 1000);
        } else {
            showAuthMessage(data.error, 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAuthMessage('Login failed: ' + error.message, 'error');
    }
}

async function register(event) {
    event.preventDefault();
    
    const userData = {
        name: document.getElementById('registerName').value,
        username: document.getElementById('registerUsername').value,
        email: document.getElementById('registerEmail').value,
        phoneNumber: document.getElementById('registerPhone').value,
        password: document.getElementById('registerPassword').value
    };
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            authToken = data.token;
            currentUser = data.user;
            
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            showAuthMessage('Registration successful!', 'success');
            setTimeout(showMainApp, 1000);
        } else {
            showAuthMessage(data.error, 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showAuthMessage('Registration failed: ' + error.message, 'error');
    }
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    authToken = null;
    currentUser = null;
    
    if (socket) {
        socket.disconnect();
    }
    
    showAuthSection();
    showAuthMessage('Logged out successfully', 'success');
}

function showAuthMessage(message, type) {
    const messageDiv = document.getElementById('authMessage');
    messageDiv.innerHTML = `<div class="${type}-message">${message}</div>`;
}

function clearAuthMessage() {
    document.getElementById('authMessage').innerHTML = '';
}

// ===================================
// API HELPER WITH AUTHENTICATION
// ===================================

async function apiCall(url, options = {}) {
    try {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        const response = await fetch(url, {
            headers,
            ...options
        });
        
        if (response.status === 401) {
            // Token expired or invalid
            logout();
            throw new Error('Authentication expired. Please login again.');
        }
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// ===================================
// CALL MANAGEMENT (AUTHENTICATED)
// ===================================

async function makeCall() {
    const phoneNumber = document.getElementById('phoneNumber').value;
    
    if (!phoneNumber) {
        showToast('Please enter a phone number', 'warning');
        return;
    }
    
    try {
        const response = await apiCall('/api/calls/make', {
            method: 'POST',
            body: JSON.stringify({ to: phoneNumber })
        });
        
        if (response.success) {
            addLog(`📞 Calling ${phoneNumber}... (SID: ${response.callSid})`);
            await loadActiveCalls();
            document.getElementById('phoneNumber').value = '';
        } else {
            showToast('Failed to make call', 'error');
        }
    } catch (error) {
        console.error('Error making call:', error);
        showToast('Error making call: ' + error.message, 'error');
    }
}

async function hangupCall(callSid) {
    try {
        const response = await apiCall(`/api/calls/hangup/${callSid}`, {
            method: 'POST'
        });
        
        if (response.success) {
            addLog(`📴 Call ended (SID: ${callSid})`);
            await loadActiveCalls();
        }
    } catch (error) {
        console.error('Error ending call:', error);
        showToast('Error ending call', 'error');
    }
}

async function acceptCall(callSid) {
    try {
        const response = await apiCall(`/api/calls/accept/${callSid}`, {
            method: 'POST'
        });
        
        if (response.success) {
            addLog(`✅ Call accepted (SID: ${callSid})`);
            await loadPendingCalls();
            await loadActiveCalls();
        }
    } catch (error) {
        console.error('Error accepting call:', error);
        showToast('Error accepting call', 'error');
    }
}

async function rejectCall(callSid) {
    try {
        const response = await apiCall(`/api/calls/reject/${callSid}`, {
            method: 'POST'
        });
        
        if (response.success) {
            addLog(`❌ Call rejected (SID: ${callSid})`);
            await loadPendingCalls();
        }
    } catch (error) {
        console.error('Error rejecting call:', error);
        showToast('Error rejecting call', 'error');
    }
}

// ===================================
// LOAD DATA FUNCTIONS
// ===================================

async function loadInitialData() {
    try {
        await Promise.all([
            loadActiveCalls(),
            loadPendingCalls(),
            loadContacts()
        ]);
        
        updateQuickContacts();
    } catch (error) {
        console.error('Error loading initial data:', error);
        showToast('Failed to load initial data', 'error');
    }
}

async function loadActiveCalls() {
    try {
        const response = await apiCall('/api/calls/active');
        activeCalls = response.calls || [];
        updateCallsList();
        return activeCalls;
    } catch (error) {
        console.error('Error loading active calls:', error);
        return [];
    }
}

async function loadPendingCalls() {
    try {
        const response = await apiCall('/api/calls/pending');
        pendingCalls = response.pendingCalls || [];
        updatePendingCallsList();
        return pendingCalls;
    } catch (error) {
        console.error('Error loading pending calls:', error);
        return [];
    }
}

async function loadContacts() {
    try {
        const response = await apiCall(`/api/users/${currentUser.id}/contacts`);
        contacts = response.contacts || [];
        updateContactsList();
        updateQuickContacts();
        return contacts;
    } catch (error) {
        console.error('Error loading contacts:', error);
        return [];
    }
}

async function loadCallHistory() {
    const direction = document.getElementById('historyDirection').value;
    
    try {
        let url = `/api/users/${currentUser.id}/call-history`;
        if (direction) {
            url += `?direction=${direction}`;
        }
        
        const response = await apiCall(url);
        callHistory = response.callHistory || [];
        updateCallHistoryList();
    } catch (error) {
        console.error('Error loading call history:', error);
        showToast('Failed to load call history', 'error');
    }
}

// ===================================
// CONTACT MANAGEMENT
// ===================================

async function addContact(event) {
    event.preventDefault();
    
    const contactData = {
        user_id: currentUser.id,
        name: document.getElementById('newContactName').value,
        phone: document.getElementById('newContactPhone').value,
        email: document.getElementById('newContactEmail').value,
        notes: document.getElementById('newContactNotes').value,
        is_favorite: document.getElementById('newContactFavorite').checked
    };
    
    try {
        const response = await apiCall('/api/contacts', {
            method: 'POST',
            body: JSON.stringify(contactData)
        });
        
        if (response.success) {
            await loadContacts();
            hideAddContactForm();
            showToast('Contact added successfully', 'success');
        }
    } catch (error) {
        console.error('Error adding contact:', error);
        showToast('Failed to add contact: ' + error.message, 'error');
    }
}

async function toggleFavorite(contactId) {
    try {
        const response = await apiCall(`/api/contacts/${contactId}/toggle-favorite`, {
            method: 'POST'
        });
        
        if (response.success) {
            await loadContacts();
            showToast('Favorite status updated', 'success');
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
        showToast('Failed to update favorite', 'error');
    }
}

async function deleteContact(contactId) {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    
    try {
        const response = await apiCall(`/api/contacts/${contactId}`, {
            method: 'DELETE'
        });
        
        if (response.success) {
            await loadContacts();
            showToast('Contact deleted successfully', 'success');
        }
    } catch (error) {
        console.error('Error deleting contact:', error);
        showToast('Failed to delete contact', 'error');
    }
}

async function searchContacts() {
    const searchTerm = document.getElementById('contactSearch').value;
    
    try {
        let url = `/api/users/${currentUser.id}/contacts`;
        if (searchTerm) {
            url += `/search?q=${encodeURIComponent(searchTerm)}`;
        }
        
        const response = await apiCall(url);
        contacts = response.contacts || [];
        updateContactsList();
    } catch (error) {
        console.error('Error searching contacts:', error);
        showToast('Failed to search contacts', 'error');
    }
}

async function callContact(phoneNumber) {
    document.getElementById('phoneNumber').value = phoneNumber;
    await makeCall();
}

// ===================================
// UI UPDATE FUNCTIONS
// ===================================

function updateCallsList() {
    const callsList = document.getElementById('callsList');
    
    if (activeCalls.length === 0) {
        callsList.innerHTML = '<div class="empty-state"><h3>No active calls</h3></div>';
        return;
    }
    
    callsList.innerHTML = activeCalls.map(call => `
        <div class="call-item">
            <div class="item-info">
                <div class="item-title">
                    📞 ${call.contact ? call.contact.name : call.to || call.from}
                </div>
                <div class="item-subtitle">${call.to || call.from}</div>
                <div class="item-subtitle">
                    <span class="status-badge status-active">${call.status}</span>
                </div>
            </div>
            <div class="item-actions">
                <button class="danger" onclick="hangupCall('${call.sid}')">📴 End Call</button>
            </div>
        </div>
    `).join('');
}

function updatePendingCallsList() {
    const pendingCallsList = document.getElementById('pendingCalls');
    
    if (pendingCalls.length === 0) {
        pendingCallsList.innerHTML = '<div class="empty-state"><h3>No pending calls</h3></div>';
        return;
    }
    
    pendingCallsList.innerHTML = pendingCalls.map(call => `
        <div class="call-item">
            <div class="item-info">
                <div class="item-title">
                    📞 Incoming: ${call.contact ? call.contact.name : call.from}
                </div>
                <div class="item-subtitle">${call.from}</div>
                <div class="item-subtitle">
                    <span class="status-badge status-pending">Ringing</span>
                </div>
            </div>
            <div class="item-actions">
                <button class="success" onclick="acceptCall('${call.callSid}')">✅ Accept</button>
                <button class="danger" onclick="rejectCall('${call.callSid}')">❌ Reject</button>
            </div>
        </div>
    `).join('');
}

function updateContactsList() {
    const contactsList = document.getElementById('contactsList');
    
    if (contacts.length === 0) {
        contactsList.innerHTML = '<div class="empty-state"><h3>No contacts found</h3><p>Add a contact to get started</p></div>';
        return;
    }
    
    contactsList.innerHTML = contacts.map(contact => `
        <div class="contact-item">
            <div class="item-info">
                <div class="item-title">
                    ${contact.name}
                    <span class="favorite-star ${contact.is_favorite ? '' : 'inactive'}" 
                            onclick="toggleFavorite('${contact.id}')">⭐</span>
                </div>
                <div class="item-subtitle">${contact.formatted_phone || contact.phone}</div>
                <div class="item-subtitle">${contact.email || ''}</div>
                ${contact.notes ? `<div class="item-subtitle">${contact.notes}</div>` : ''}
            </div>
            <div class="item-actions">
                <button onclick="callContact('${contact.phone}')">📞 Call</button>
                <button class="danger" onclick="deleteContact('${contact.id}')">🗑️ Delete</button>
            </div>
        </div>
    `).join('');
}

function updateQuickContacts() {
    const quickContacts = document.getElementById('quickContacts');
    const favoriteContacts = contacts.filter(contact => contact.is_favorite);
    
    if (favoriteContacts.length === 0) {
        quickContacts.innerHTML = '<p>No favorite contacts</p>';
        return;
    }
    
    quickContacts.innerHTML = favoriteContacts.map(contact => `
        <div class="quick-contact favorite" onclick="callContact('${contact.phone}')">
            ${contact.name} (${contact.phone})
        </div>
    `).join('');
}

function updateCallHistoryList() {
    const callHistoryList = document.getElementById('callHistory');
    
    if (callHistory.length === 0) {
        callHistoryList.innerHTML = '<div class="empty-state"><h3>No call history found</h3></div>';
        return;
    }
    
    callHistoryList.innerHTML = callHistory.map(call => `
        <div class="history-item">
            <div class="item-info">
                <div class="item-title">
                    ${call.direction === 'inbound' ? '📞' : '📱'} 
                    ${call.contact_name || call.phone_number}
                </div>
                <div class="item-subtitle">${call.phone_number}</div>
                <div class="item-subtitle">
                    <span class="status-badge status-${call.status}">${call.status}</span>
                    ${call.duration ? `• ${Math.floor(call.duration / 60)}:${(call.duration % 60).toString().padStart(2, '0')}` : ''}
                </div>
                <div class="item-subtitle">${new Date(call.created_at).toLocaleString()}</div>
            </div>
            <div class="item-actions">
                <button onclick="callContact('${call.phone_number}')">📞 Call Back</button>
            </div>
        </div>
    `).join('');
}

// ===================================
// WEBSOCKET & OTHER FUNCTIONS
// ===================================

function initializeWebSocket() {
    socket = io();
    
    socket.on('connect', () => {
        console.log('📡 Connected to server');
        addLog('📡 Connected to real-time updates');
        document.getElementById('connectionStatus').textContent = '📡 Connected';
        document.getElementById('connectionStatus').className = 'connection-status connected';
    });
    
    socket.on('disconnect', () => {
        console.log('📡 Disconnected from server');
        addLog('📡 Disconnected from real-time updates');
        document.getElementById('connectionStatus').textContent = '📡 Disconnected';
        document.getElementById('connectionStatus').className = 'connection-status disconnected';
    });
    
    // Listen for call events
    socket.on('incomingCall', (data) => {
        addLog(`📞 Incoming call from ${data.contact ? data.contact.name : data.from}`);
        loadPendingCalls();
        
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Incoming Call', {
                body: `Call from ${data.contact ? data.contact.name : data.from}`,
                icon: '📞'
            });
        }
    });
    
    socket.on('callInitiated', (data) => {
        if (data.user_id === currentUser.id) {
            addLog(`📞 Calling ${data.contact ? data.contact.name : data.to}...`);
            loadActiveCalls();
        }
    });
    
    socket.on('callEnded', (data) => {
        if (data.user_id === currentUser.id) {
            addLog(`📴 Call ended (${data.callSid})`);
            loadActiveCalls();
        }
    });

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    document.getElementById(`${tabName}-tab`).classList.add('active');
    document.querySelector(`[onclick="showTab('${tabName}')"]`).classList.add('active');
    
    if (tabName === 'contacts') {
        loadContacts();
    } else if (tabName === 'history') {
        loadCallHistory();
    }
}

function showAddContactForm() {
    document.getElementById('addContactForm').style.display = 'flex';
}

function hideAddContactForm() {
    document.getElementById('addContactForm').style.display = 'none';
    document.getElementById('addContactForm').querySelector('form').reset();
}

function setupEventListeners() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    document.getElementById('contactSearch').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchContacts();
        }
    });
}

function addLog(message) {
    const logsList = document.getElementById('logsList');
    const logItem = document.createElement('div');
    logItem.className = 'log-item';
    logItem.textContent = `${new Date().toLocaleTimeString()} - ${message}`;
    logsList.insertBefore(logItem, logsList.firstChild);
    
    while (logsList.children.length > 50) {
        logsList.removeChild(logsList.lastChild);
    }
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}


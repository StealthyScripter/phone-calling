// Global state
let activeCalls = [];
let pendingCalls = [];
let users = [];
let contacts = [];
let currentUser = null;
let callHistory = [];
let socket = null;

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    await loadInitialData();
    setupEventListeners();
});

// WebSocket connection and real-time updates
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
        
        // Show browser notification if supported
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Incoming Call', {
                body: `Call from ${data.contact ? data.contact.name : data.from}`,
                icon: '📞'
            });
        }
    });
    
    socket.on('callInitiated', (data) => {
        addLog(`📞 Calling ${data.contact ? data.contact.name : data.to}...`);
        loadActiveCalls();
    });
    
    socket.on('callAccepted', (data) => {
        addLog(`✅ Call accepted (${data.callSid})`);
        loadPendingCalls();
        loadActiveCalls();
    });
    
    socket.on('callRejected', (data) => {
        addLog(`❌ Call rejected (${data.callSid})`);
        loadPendingCalls();
    });
    
    socket.on('callEnded', (data) => {
        addLog(`📴 Call ended (${data.callSid})`);
        loadActiveCalls();
    });
    
    socket.on('callStatusUpdate', (data) => {
        if (['answered', 'completed', 'failed'].includes(data.status)) {
            addLog(`📞 Call ${data.status}: ${data.from} → ${data.to}`);
            loadActiveCalls();
            loadPendingCalls();
        }
    });
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// Tab Management
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(`${tabName}-tab`).classList.add('active');
    document.querySelector(`[onclick="showTab('${tabName}')"]`).classList.add('active');
    
    // Load tab-specific data
    switch(tabName) {
        case 'contacts':
            loadContacts();
            break;
        case 'users':
            loadUsers();
            break;
        case 'history':
            loadCallHistory();
            break;
    }
}

// Load initial data
async function loadInitialData() {
    try {
        await Promise.all([
            loadUsers(),
            loadActiveCalls(),
            loadPendingCalls()
        ]);
        
        if (users.length > 0) {
            currentUser = users[0];
            await loadContacts(currentUser.id);
        }
        
        populateUserSelects();
        updateQuickContacts();
        
        // Initialize WebSocket instead of polling
        initializeWebSocket();
        
    } catch (error) {
        console.error('Error loading initial data:', error);
        showToast('Failed to load initial data', 'error');
    }
}

// API Helper Functions
async function apiCall(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// User Management
async function loadUsers() {
    try {
        const response = await apiCall('/api/users');
        users = response.users || [];
        updateUsersList();
        return users;
    } catch (error) {
        console.error('Error loading users:', error);
        return [];
    }
}

async function addUser(event) {
    event.preventDefault();
    
    const userData = {
        name: document.getElementById('newUserName').value,
        email: document.getElementById('newUserEmail').value,
        phone: document.getElementById('newUserPhone').value
    };
    
    try {
        const response = await apiCall('/api/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        if (response.success) {
            await loadUsers();
            populateUserSelects();
            hideAddUserForm();
            showToast('User added successfully', 'success');
        }
    } catch (error) {
        console.error('Error adding user:', error);
        showToast('Failed to add user', 'error');
    }
}

function updateUsersList() {
    const usersList = document.getElementById('usersList');
    
    if (users.length === 0) {
        usersList.innerHTML = '<div class="empty-state"><h3>No users found</h3><p>Add a user to get started</p></div>';
        return;
    }
    
    usersList.innerHTML = users.map(user => `
        <div class="user-item">
            <div class="item-info">
                <div class="item-title">${user.name}</div>
                <div class="item-subtitle">${user.email || 'No email'}</div>
                <div class="item-subtitle">${user.phone || 'No phone'}</div>
            </div>
            <div class="item-actions">
                <button onclick="viewUserDetails(${user.id})">📊 Stats</button>
                <button onclick="loadContacts(${user.id})">👥 Contacts</button>
                <button class="danger" onclick="deleteUser(${user.id})">🗑️ Delete</button>
            </div>
        </div>
    `).join('');
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
        const response = await apiCall(`/api/users/${userId}`, {
            method: 'DELETE'
        });
        
        if (response.success) {
            await loadUsers();
            populateUserSelects();
            showToast('User deleted successfully', 'success');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showToast('Failed to delete user', 'error');
    }
}

// Contact Management
async function loadContacts(userId = null) {
    if (!userId && users.length > 0) {
        userId = users[0].id;
    }
    
    if (!userId) return;
    
    try {
        const response = await apiCall(`/api/users/${userId}/contacts`);
        contacts = response.contacts || [];
        updateContactsList();
        updateQuickContacts();
        return contacts;
    } catch (error) {
        console.error('Error loading contacts:', error);
        return [];
    }
}

async function searchContacts() {
    const userId = document.getElementById('contactUserSelect').value;
    const searchTerm = document.getElementById('contactSearch').value;
    
    if (!userId) {
        showToast('Please select a user first', 'warning');
        return;
    }
    
    try {
        let url = `/api/users/${userId}/contacts`;
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

async function addContact(event) {
    event.preventDefault();
    
    const contactData = {
        user_id: parseInt(document.getElementById('newContactUser').value),
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
            await loadContacts(contactData.user_id);
            hideAddContactForm();
            showToast('Contact added successfully', 'success');
        }
    } catch (error) {
        console.error('Error adding contact:', error);
        showToast('Failed to add contact', 'error');
    }
}

async function toggleFavorite(contactId) {
    try {
        const response = await apiCall(`/api/contacts/${contactId}/toggle-favorite`, {
            method: 'POST'
        });
        
        if (response.success) {
            await loadContacts();
            updateQuickContacts();
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
            updateQuickContacts();
            showToast('Contact deleted successfully', 'success');
        }
    } catch (error) {
        console.error('Error deleting contact:', error);
        showToast('Failed to delete contact', 'error');
    }
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
                          onclick="toggleFavorite(${contact.id})">⭐</span>
                </div>
                <div class="item-subtitle">${contact.formatted_phone || contact.phone}</div>
                <div class="item-subtitle">${contact.email || ''}</div>
                ${contact.notes ? `<div class="item-subtitle">${contact.notes}</div>` : ''}
            </div>
            <div class="item-actions">
                <button onclick="callContact('${contact.phone}', ${contact.user_id})">📞 Call</button>
                <button onclick="viewContactHistory(${contact.id})">📋 History</button>
                <button class="danger" onclick="deleteContact(${contact.id})">🗑️ Delete</button>
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
        <div class="quick-contact favorite" onclick="callContact('${contact.phone}', ${contact.user_id})">
            ${contact.name} (${contact.phone})
        </div>
    `).join('');
}

// Call Management
async function makeCall() {
    const phoneNumber = document.getElementById('phoneNumber').value;
    const userId = document.getElementById('userSelect').value;
    
    if (!phoneNumber) {
        showToast('Please enter a phone number', 'warning');
        return;
    }
    
    try {
        const callData = { to: phoneNumber };
        if (userId) {
            callData.user_id = parseInt(userId);
        }
        
        const response = await apiCall('/api/calls/make', {
            method: 'POST',
            body: JSON.stringify(callData)
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
        showToast('Error making call', 'error');
    }
}

async function callContact(phoneNumber, userId) {
    document.getElementById('phoneNumber').value = phoneNumber;
    if (userId) {
        document.getElementById('userSelect').value = userId;
    }
    await makeCall();
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
    const userId = document.getElementById('userSelect').value;
    
    try {
        const requestBody = {};
        if (userId) {
            requestBody.user_id = parseInt(userId);
        }
        
        const response = await apiCall(`/api/calls/accept/${callSid}`, {
            method: 'POST',
            body: JSON.stringify(requestBody)
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
    const userId = document.getElementById('userSelect').value;
    
    try {
        const requestBody = {};
        if (userId) {
            requestBody.user_id = parseInt(userId);
        }
        
        const response = await apiCall(`/api/calls/reject/${callSid}`, {
            method: 'POST',
            body: JSON.stringify(requestBody)
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

// Call History
async function loadCallHistory() {
    const userId = document.getElementById('historyUserSelect').value;
    const direction = document.getElementById('historyDirection').value;
    
    try {
        let url = '/api/users';
        if (userId) {
            url += `/${userId}/call-history`;
            const params = new URLSearchParams();
            if (direction) params.append('direction', direction);
            if (params.toString()) url += '?' + params.toString();
        } else {
            // Load call history for all users (you'd need to implement this endpoint)
            showToast('Please select a user to view call history', 'warning');
            return;
        }
        
        const response = await apiCall(url);
        callHistory = response.callHistory || [];
        updateCallHistoryList();
    } catch (error) {
        console.error('Error loading call history:', error);
        showToast('Failed to load call history', 'error');
    }
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

// UI Helper Functions
function populateUserSelects() {
    const selects = [
        'userSelect',
        'contactUserSelect',
        'newContactUser',
        'historyUserSelect'
    ];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            const currentValue = select.value;
            select.innerHTML = select.id === 'historyUserSelect' 
                ? '<option value="">All Users</option>' 
                : '<option value="">Select User</option>';
            
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = user.name;
                select.appendChild(option);
            });
            
            if (currentValue) {
                select.value = currentValue;
            }
        }
    });
}

// Modal Functions
function showAddUserForm() {
    document.getElementById('addUserForm').style.display = 'flex';
}

function hideAddUserForm() {
    document.getElementById('addUserForm').style.display = 'none';
    document.getElementById('addUserForm').querySelector('form').reset();
}

function showAddContactForm() {
    populateUserSelects();
    document.getElementById('addContactForm').style.display = 'flex';
}

function hideAddContactForm() {
    document.getElementById('addContactForm').style.display = 'none';
    document.getElementById('addContactForm').querySelector('form').reset();
}

// Event Listeners
function setupEventListeners() {
    // Close modals when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Search contacts on enter
    document.getElementById('contactSearch').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchContacts();
        }
    });
    
    // Auto-load contacts when user selection changes
    document.getElementById('contactUserSelect').addEventListener('change', (e) => {
        if (e.target.value) {
            loadContacts(e.target.value);
        }
    });
}

// Utility Functions
function addLog(message) {
    const logsList = document.getElementById('logsList');
    const logItem = document.createElement('div');
    logItem.className = 'log-item';
    logItem.textContent = `${new Date().toLocaleTimeString()} - ${message}`;
    logsList.insertBefore(logItem, logsList.firstChild);
    
    // Keep only last 50 logs
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

// View functions
async function viewUserDetails(userId) {
    try {
        const response = await apiCall(`/api/users/${userId}/call-stats`);
        const stats = response.stats;
        
        alert(`User Statistics:
Total Calls: ${stats.totalCalls}
Inbound: ${stats.inboundCalls}
Outbound: ${stats.outboundCalls}
Total Duration: ${Math.floor(stats.totalDuration / 60)} minutes
Average Duration: ${stats.averageDuration} seconds`);
    } catch (error) {
        console.error('Error loading user stats:', error);
        showToast('Failed to load user statistics', 'error');
    }
}

async function viewContactHistory(contactId) {
    try {
        const response = await apiCall(`/api/contacts/${contactId}/call-history`);
        const history = response.callHistory || [];
        
        if (history.length === 0) {
            showToast('No call history for this contact', 'info');
            return;
        }
        
        const historyText = history.map(call => 
            `${call.direction}: ${call.status} (${new Date(call.created_at).toLocaleDateString()})`
        ).join('\n');
        
        alert(`Contact Call History:\n\n${historyText}`);
    } catch (error) {
        console.error('Error loading contact history:', error);
        showToast('Failed to load contact history', 'error');
    }
}
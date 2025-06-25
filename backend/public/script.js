let activeCalls = [];

async function makeCall() {
    const phoneNumber = document.getElementById('phoneNumber').value;
    
    if (!phoneNumber) {
        alert('Please enter a phone number');
        return;
    }

    try {
        const response = await fetch('/api/calls/make', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ to: phoneNumber })
        });

        const result = await response.json();
        
        if (result.success) {
            addLog(`📞 Calling ${phoneNumber}... (SID: ${result.callSid})`);
            activeCalls.push(result);
            updateCallsList();
        } else {
            addLog(`❌ Failed to call ${phoneNumber}`);
        }
    } catch (error) {
        console.error('Error:', error);
        addLog('❌ Error making call');
    }
}

async function hangupCall(callSid) {
    try {
        const response = await fetch(`/api/calls/hangup/${callSid}`, {
            method: 'POST'
        });

        const result = await response.json();
        
        if (result.success) {
            addLog(`📴 Call ended (SID: ${callSid})`);
            activeCalls = activeCalls.filter(call => call.callSid !== callSid);
            updateCallsList();
        }
    } catch (error) {
        console.error('Error:', error);
        addLog('❌ Error ending call');
    }
}

function updateCallsList() {
    const callsList = document.getElementById('callsList');
    
    if (activeCalls.length === 0) {
        callsList.innerHTML = '<p>No active calls</p>';
        return;
    }

    callsList.innerHTML = activeCalls.map(call => `
        <div class="call-item">
            <span>📞 ${call.to}</span>
            <button onclick="hangupCall('${call.callSid}')">End Call</button>
        </div>
    `).join('');
}

function addLog(message) {
    const logsList = document.getElementById('logsList');
    const logItem = document.createElement('div');
    logItem.className = 'log-item';
    logItem.textContent = `${new Date().toLocaleTimeString()} - ${message}`;
    logsList.insertBefore(logItem, logsList.firstChild);
}

// Refresh active calls every 5 seconds
setInterval(async () => {
    try {
        const response = await fetch('/api/calls/active');
        const data = await response.json();
        
        // Update UI based on server state
        if (data.calls.length !== activeCalls.length) {
            activeCalls = data.calls;
            updateCallsList();
        }
    } catch (error) {
        console.error('Error fetching active calls:', error);
    }
}, 5000);
// Get the blocked URL from the query parameter
const urlParams = new URLSearchParams(window.location.search);
const blockedUrl = urlParams.get('url') || 'This site';

// Display the blocked site
try {
  const url = new URL(decodeURIComponent(blockedUrl));
  document.getElementById('blockedSite').textContent = url.hostname.replace('www.', '');
} catch (e) {
  document.getElementById('blockedSite').textContent = 'This site';
}

// Load and display stats
function updateStats() {
  chrome.storage.local.get(['timerState', 'distractions'], (data) => {
    if (data.timerState && data.timerState.timeRemaining) {
      const mins = Math.floor(data.timerState.timeRemaining / 60);
      const secs = data.timerState.timeRemaining % 60;
      document.getElementById('timeLeft').textContent = 
        `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    document.getElementById('blocksToday').textContent = data.distractions || 0;
  });
}

function closeTab() {
  window.close();
}

function openDashboard() {
  chrome.runtime.sendMessage({ action: 'openDashboard' });
  window.close();
}

// Update stats every second
updateStats();
setInterval(updateStats, 1000);
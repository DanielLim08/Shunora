// Add this to the beginning of your popup.js file

// Check authentication status on popup load
chrome.runtime.sendMessage({ action: 'checkAuthStatus' }, (response) => {
  if (!response || !response.isAuthenticated) {
    // User is not authenticated, redirect to auth page
    showAuthRequired();
  } else {
    // User is authenticated, show main popup content
    showMainContent(response.user);
  }
});

// Listen for auth state changes
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'authStateChanged') {
    if (message.isAuthenticated) {
      showMainContent(message.user);
    } else {
      showAuthRequired();
    }
  }
});

function showAuthRequired() {
  // Hide main content
  const mainContent = document.getElementById('main-content');
  if (mainContent) {
    mainContent.style.display = 'none';
  }
  
  // Show auth required message
  let authContainer = document.getElementById('auth-required-container');
  if (!authContainer) {
    authContainer = document.createElement('div');
    authContainer.id = 'auth-required-container';
    authContainer.innerHTML = `
      <div style="padding: 40px 20px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 20px;">🔒</div>
        <h2 style="font-size: 20px; font-weight: 600; color: #111827; margin-bottom: 12px;">
          Authentication Required
        </h2>
        <p style="color: #6b7280; margin-bottom: 24px; font-size: 14px;">
          Please sign in to use Shunora Focus Timer
        </p>
        <button id="openAuthBtn" style="
          width: 100%;
          padding: 12px 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
        ">
          Sign In / Sign Up
        </button>
      </div>
    `;
    document.body.appendChild(authContainer);
    
    // Add click handler for auth button
    document.getElementById('openAuthBtn').addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('auth.html') });
    });
  }
  authContainer.style.display = 'block';
}

function showMainContent(user) {
  // Hide auth required message
  const authContainer = document.getElementById('auth-required-container');
  if (authContainer) {
    authContainer.style.display = 'none';
  }
  
  // Show main content
  const mainContent = document.getElementById('main-content');
  if (mainContent) {
    mainContent.style.display = 'block';
  }
  
  // Update user info if you have a user display element
  const userDisplay = document.getElementById('user-display');
  if (userDisplay && user) {
    userDisplay.textContent = user.displayName || user.email;
  }
  
  // Add sign out button if not already present
  addSignOutButton();
}

function addSignOutButton() {
  // Check if sign out button already exists
  if (document.getElementById('signOutBtn')) {
    return;
  }
  
  // Find a good place to add the sign out button (adjust based on your popup layout)
  // This is just an example - modify based on your actual popup structure
  const settingsSection = document.querySelector('.settings-section') || document.body;
  
  const signOutBtn = document.createElement('button');
  signOutBtn.id = 'signOutBtn';
  signOutBtn.textContent = 'Sign Out';
  signOutBtn.style.cssText = `
    width: 100%;
    padding: 10px;
    margin-top: 10px;
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  `;
  
  signOutBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to sign out?')) {
      chrome.runtime.sendMessage({ action: 'signOut' }, (response) => {
        if (response.success) {
          showAuthRequired();
        }
      });
    }
  });
  
  signOutBtn.addEventListener('mouseenter', () => {
    signOutBtn.style.background = '#dc2626';
  });
  
  signOutBtn.addEventListener('mouseleave', () => {
    signOutBtn.style.background = '#ef4444';
  });
  
  settingsSection.appendChild(signOutBtn);
}

// Wrap your existing popup content in a main-content div
// You'll need to modify your popup.html to have a structure like:
// <div id="main-content">
//   <!-- Your existing popup content here -->
// </div>
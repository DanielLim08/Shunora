// Firebase App (the core Firebase SDK)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
// Firebase Firestore
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js";
// Firebase Auth
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-auth.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAq9dL_jSlpOJZkJSy8W0LpPql0XiZOF1M",
  authDomain: "shunora-2120b.firebaseapp.com",
  projectId: "shunora-2120b",
  storageBucket: "shunora-2120b.firebasestorage.app",
  messagingSenderId: "500608461096",
  appId: "1:500608461096:web:4efa289efc32439487081d",
  measurementId: "G-5GLHRNZRSY"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let userUid = null;
let userDocRef = null;
let isAuthenticated = false;

let timerState = {
  isRunning: false,
  isPaused: false,
  timeRemaining: 25 * 60,
  totalTime: 25 * 60,
  sessionType: 'work'
};

let timerInterval = null;
let lastCheckedUrl = '';
let totalFocusSeconds = 0;
let minuteCounter = 0; // Track seconds to update Firebase every minute

const ICON_PATHS = {
  active: {
    16: 'icons/icon-active-16.png',
    32: 'icons/icon-active-32.png',
    48: 'icons/icon-active-48.png',
    128: 'icons/icon-active-128.png'
  },
  inactive: {
    16: 'icons/icon-inactive-16.png',
    32: 'icons/icon-inactive-32.png',
    48: 'icons/icon-inactive-48.png',
    128: 'icons/icon-inactive-128.png'
  }
};

// Default blocked sites
const DEFAULT_BLOCKED_SITES = [
  'youtube.com',
  'instagram.com',
  'facebook.com',
  'twitter.com',
  'x.com',
  'tiktok.com',
  'reddit.com',
  'netflix.com',
  'twitch.tv',
  'discord.com',
  'pinterest.com',
  'snapchat.com',
  'linkedin.com',
  'tumblr.com',
  'whatsapp.com'
];

let blockedSites = [...DEFAULT_BLOCKED_SITES];

// Listen for authentication state changes
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // User is signed in
    userUid = user.uid;
    userDocRef = doc(db, "users", userUid);
    isAuthenticated = true;
    
    console.log("User authenticated:", userUid);
    
    // Load user data from Firebase
    await loadUserData();
    
    // Initialize timer if needed
    chrome.storage.local.get(['timerState', 'totalFocusSeconds'], (data) => {
      if (data.timerState) {
        timerState = data.timerState;
      }
      if (typeof data.totalFocusSeconds === 'number') {
        totalFocusSeconds = data.totalFocusSeconds;
      }
      
      if (timerState.isRunning && !timerState.isPaused) {
        startTimer();
      } else {
        updateActionIcon();
      }
    });
    
    // Notify popup that user is authenticated
    chrome.runtime.sendMessage({ 
      action: 'authStateChanged', 
      isAuthenticated: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      }
    });
  } else {
    // User is signed out
    userUid = null;
    userDocRef = null;
    isAuthenticated = false;
    
    console.log("User signed out");
    
    // Clear timer if running
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    
    // Notify popup that user is signed out
    chrome.runtime.sendMessage({ 
      action: 'authStateChanged', 
      isAuthenticated: false 
    });
  }
});

// Load user data from Firebase
async function loadUserData() {
  if (!isAuthenticated || !userDocRef) {
    console.log("Cannot load user data: not authenticated");
    return;
  }
  
  try {
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      
      // Load totalHours from Firebase (stored in hours)
      if (typeof data.totalHours === 'number') {
        totalFocusSeconds = Math.floor(data.totalHours * 3600); // Convert hours to seconds
      }
      
      // Load blocked sites from Firebase
      if (data.blockedSites && Array.isArray(data.blockedSites)) {
        blockedSites = data.blockedSites;
      } else {
        blockedSites = [...DEFAULT_BLOCKED_SITES];
        // Initialize blockedSites in Firebase
        await updateDoc(userDocRef, {
          blockedSites: blockedSites
        });
      }
      
      // Sync to local storage
      chrome.storage.local.set({ 
        totalFocusSeconds,
        blockedSites 
      });
      
      console.log("User data loaded from Firebase");
    } else {
      // If user document doesn't exist, create one with default values
      const user = auth.currentUser;
      await setDoc(userDocRef, {
        name: user.displayName || "User",
        email: user.email || "",
        totalHours: 0,
        blockedSites: [...DEFAULT_BLOCKED_SITES],
        createdAt: new Date().toISOString()
      });
      console.log("New user document created in Firebase");
    }
  } catch (error) {
    console.error("Error loading user data from Firebase:", error);
  }
}

// Update totalHours in Firebase every minute
async function updateFirebaseTotalHours() {
  if (!isAuthenticated || !userDocRef) {
    console.log("Cannot update Firebase: not authenticated");
    return;
  }
  
  try {
    const hoursToAdd = 1 / 60; // 1 minute = 1/60 hours
    
    await updateDoc(userDocRef, {
      totalHours: increment(hoursToAdd)
    });
    
    console.log(`Added ${hoursToAdd} hours to Firebase`);
  } catch (error) {
    console.error("Error updating totalHours in Firebase:", error);
  }
}

// Save blocked sites to Firebase
async function saveBlockedSitesToFirebase() {
  if (!isAuthenticated || !userDocRef) {
    console.log("Cannot save blocked sites: not authenticated");
    return;
  }
  
  try {
    await updateDoc(userDocRef, {
      blockedSites: blockedSites
    });
    console.log("Blocked sites saved to Firebase");
  } catch (error) {
    console.error("Error saving blocked sites to Firebase:", error);
  }
}

function isUrlBlocked(url) {
  if (!url || !timerState.isRunning || timerState.isPaused || timerState.sessionType === 'break') {
    return false;
  }
  
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '').toLowerCase();
    
    // Don't block Chrome pages
    const chromePages = ['chrome://', 'chrome-extension://', 'edge://', 'about:'];
    if (chromePages.some(page => url.startsWith(page))) {
      return false;
    }
    
    // Check if URL matches any blocked site
    return blockedSites.some(blocked => hostname.includes(blocked.toLowerCase()));
  } catch (e) {
    return false;
  }
}

function redirectToBlockedPage(tabId, url) {
  const blockedPageUrl = chrome.runtime.getURL('blocked.html') + '?url=' + encodeURIComponent(url);
  chrome.tabs.update(tabId, { url: blockedPageUrl });
}

// Update badge with timer countdown
function updateBadge() {
  if (timerState.isRunning && !timerState.isPaused) {
    const mins = Math.floor(timerState.timeRemaining / 60);
    const badgeText = mins > 0 ? `${mins}m` : '<1m';
    
    chrome.action.setBadgeText({ text: badgeText });
    chrome.action.setBadgeBackgroundColor({ 
      color: timerState.sessionType === 'work' ? '#6366f1' : '#06b6d4' 
    });
  } else if (timerState.isPaused) {
    chrome.action.setBadgeText({ text: '⏸' });
    chrome.action.setBadgeBackgroundColor({ color: '#f59e0b' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

function updateActionIcon() {
  const iconKey = timerState.isRunning && !timerState.isPaused ? 'active' : 'inactive';
  chrome.action.setIcon({ path: ICON_PATHS[iconKey] });
  
  // Update title with current status
  let title = 'Shunora - Focus Timer';
  if (timerState.isRunning && !timerState.isPaused) {
    const mins = Math.floor(timerState.timeRemaining / 60);
    const secs = timerState.timeRemaining % 60;
    title = `Shunora - ${mins}:${secs.toString().padStart(2, '0')} (${timerState.sessionType === 'work' ? 'Work' : 'Break'})`;
  } else if (timerState.isPaused) {
    title = 'Shunora - Paused';
  }
  chrome.action.setTitle({ title });
  
  updateBadge();
}

function checkActiveTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].url) {
      const currentUrl = tabs[0].url;
      
      // Don't check the blocked page itself
      if (currentUrl.includes('blocked.html')) {
        return;
      }
      
      if (currentUrl !== lastCheckedUrl) {
        lastCheckedUrl = currentUrl;
        
        if (isUrlBlocked(currentUrl)) {
          // Increment distraction counter
          chrome.storage.local.get(['distractions'], (data) => {
            const count = (data.distractions || 0) + 1;
            chrome.storage.local.set({ distractions: count });
          });
          
          // Redirect to blocked page
          redirectToBlockedPage(tabs[0].id, currentUrl);
          
          chrome.runtime.sendMessage({ action: 'updateStats' });
        }
      }
    }
  });
}

function broadcastTimerUpdate(actionType = 'updateTimer') {
  chrome.runtime.sendMessage({
    action: actionType,
    state: timerState,
    totalFocusSeconds
  });
}

function startTimer() {
  if (!isAuthenticated) {
    console.log("Cannot start timer: not authenticated");
    return;
  }
  
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  
  updateActionIcon();
  timerInterval = setInterval(() => {
    if (timerState.isRunning && !timerState.isPaused) {
      timerState.timeRemaining--;

      if (timerState.sessionType === 'work') {
        totalFocusSeconds++;
        minuteCounter++;
        
        // Update Firebase every 60 seconds (1 minute)
        if (minuteCounter >= 60) {
          updateFirebaseTotalHours();
          minuteCounter = 0;
        }
        
        chrome.storage.local.set({ timerState, totalFocusSeconds });
      } else {
        chrome.storage.local.set({ timerState });
      }
      
      // Update badge every second for real-time countdown
      updateActionIcon();
      
      broadcastTimerUpdate('updateTimer');
      
      // Check every 3 seconds
      if (timerState.timeRemaining % 3 === 0) {
        checkActiveTab();
      }
      
      if (timerState.timeRemaining <= 0) {
        handleSessionComplete();
      }
    }
  }, 1000);
}

function handleSessionComplete() {
  clearInterval(timerInterval);
  
  // If there are remaining seconds in the minute counter, update Firebase
  if (minuteCounter > 0 && timerState.sessionType === 'work' && isAuthenticated) {
    const partialHours = minuteCounter / 3600; // Convert remaining seconds to hours
    updateDoc(userDocRef, {
      totalHours: increment(partialHours)
    }).catch(error => {
      console.error("Error updating final partial hours:", error);
    });
    minuteCounter = 0;
  }
  
  chrome.storage.local.get(['workDuration', 'breakDuration'], (data) => {
    if (timerState.sessionType === 'work') {
      // Work session completed - just stop, don't auto-switch
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-active-48.png',
        title: '🎉 Work Session Complete!',
        message: 'Great job! Take a break or start another session.',
        priority: 2,
        requireInteraction: true,
        silent: false
      });
      
      // Play completion sound
      playCompletionSound();
      
      timerState.isRunning = false;
      timerState.isPaused = false;
    } else {
      // Break completed - just stop
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-active-48.png',
        title: '💪 Break Complete!',
        message: 'Ready to get back to work?',
        priority: 2,
        requireInteraction: true,
        silent: false
      });
      
      // Play completion sound
      playCompletionSound();
      
      timerState.isRunning = false;
      timerState.isPaused = false;
    }
    
    chrome.storage.local.set({ timerState, totalFocusSeconds });
    
    broadcastTimerUpdate('sessionComplete');
    chrome.runtime.sendMessage({ action: 'updateStats' });
    updateActionIcon();
  });
}

// Play completion sound using Web Audio API
function playCompletionSound() {
  // Create audio context
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  
  // Create a pleasant notification sound (three ascending tones)
  const playTone = (frequency, startTime, duration) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    // Envelope for smooth sound
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  };
  
  const now = audioContext.currentTime;
  // Play three pleasant tones: C5, E5, G5 (major chord)
  playTone(523.25, now, 0.2);        // C5
  playTone(659.25, now + 0.15, 0.2); // E5
  playTone(783.99, now + 0.30, 0.3); // G5
}

// Message Listeners
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'checkAuthStatus') {
    sendResponse({ 
      isAuthenticated,
      user: isAuthenticated ? {
        uid: userUid,
        email: auth.currentUser?.email,
        displayName: auth.currentUser?.displayName
      } : null
    });
  } else if (message.action === 'startTimer') {
    if (!isAuthenticated) {
      sendResponse({ success: false, error: 'Not authenticated' });
      return true;
    }
    timerState = message.state;
    minuteCounter = 0; // Reset minute counter
    startTimer();
    checkActiveTab();
    sendResponse({ success: true });
  } else if (message.action === 'pauseTimer') {
    timerState.isPaused = true;
    chrome.storage.local.set({ timerState });
    updateActionIcon();
    
    // Save any remaining partial minutes to Firebase
    if (minuteCounter > 0 && timerState.sessionType === 'work' && isAuthenticated) {
      const partialHours = minuteCounter / 3600;
      updateDoc(userDocRef, {
        totalHours: increment(partialHours)
      }).catch(error => {
        console.error("Error updating partial hours on pause:", error);
      });
      minuteCounter = 0;
    }
  } else if (message.action === 'resetTimer') {
    clearInterval(timerInterval);
    timerState = {
      isRunning: false,
      isPaused: false,
      timeRemaining: 25 * 60,
      totalTime: 25 * 60,
      sessionType: 'work'
    };
    chrome.storage.local.set({ timerState });
    lastCheckedUrl = '';
    minuteCounter = 0;
    updateActionIcon();
  } else if (message.action === 'switchSession') {
    // Allow switching sessions even when timer is running
    clearInterval(timerInterval);
    
    // Save any remaining partial minutes before switching
    if (minuteCounter > 0 && timerState.sessionType === 'work' && isAuthenticated) {
      const partialHours = minuteCounter / 3600;
      updateDoc(userDocRef, {
        totalHours: increment(partialHours)
      }).catch(error => {
        console.error("Error updating partial hours on session switch:", error);
      });
    }
    minuteCounter = 0;
    
    timerState = message.state;
    chrome.storage.local.set({ timerState });
    
    // Restart timer if it was running
    if (timerState.isRunning) {
      startTimer();
    } else {
      updateActionIcon();
    }
    
    sendResponse({ success: true });
  } else if (message.action === 'openDashboard') {
    chrome.action.openPopup();
  } else if (message.action === 'getTimerSnapshot') {
    sendResponse({
      state: timerState,
      totalFocusSeconds,
      isAuthenticated
    });
  } else if (message.action === 'updateBlockedSites') {
    blockedSites = message.sites;
    chrome.storage.local.set({ blockedSites });
    
    // Save to Firebase
    if (isAuthenticated) {
      saveBlockedSitesToFirebase();
    }
    
    sendResponse({ success: true });
  } else if (message.action === 'getBlockedSites') {
    sendResponse({ sites: blockedSites });
  } else if (message.action === 'resetBlockedSites') {
    blockedSites = [...DEFAULT_BLOCKED_SITES];
    chrome.storage.local.set({ blockedSites });
    
    // Save to Firebase
    if (isAuthenticated) {
      saveBlockedSitesToFirebase();
    }
    
    sendResponse({ sites: blockedSites });
  } else if (message.action === 'signOut') {
    auth.signOut().then(() => {
      sendResponse({ success: true });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
  }
  
  return true;
});

// Tab Event Listeners
chrome.tabs.onActivated.addListener(() => {
  if (timerState.isRunning && !timerState.isPaused) {
    checkActiveTab();
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && timerState.isRunning && !timerState.isPaused) {
    checkActiveTab();
  }
});

// Initialize icon on startup
updateActionIcon();
// blocked-page.js - Handles the blocked page functionality

// Motivational Quotes Array
const quotes = [
  { text: "The successful warrior is the average person, with laser-like focus.", author: "Bruce Lee" },
  { text: "Focus is a matter of deciding what things you're not going to do.", author: "John Carmack" },
  { text: "It's not always that we need to do more but rather that we need to focus on less.", author: "Nathan W. Morris" },
  { text: "The key to success is to focus on goals, not obstacles.", author: "Unknown" },
  { text: "Where focus goes, energy flows.", author: "Tony Robbins" },
  { text: "Concentrate all your thoughts upon the work in hand. The sun's rays do not burn until brought to a focus.", author: "Alexander Graham Bell" },
  { text: "Your focus determines your reality.", author: "George Lucas" },
  { text: "The shorter way to do many things is to only do one thing at a time.", author: "Mozart" },
  { text: "One reason so few of us achieve what we truly want is that we never direct our focus; we never concentrate our power.", author: "Tony Robbins" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "Starve your distractions, feed your focus.", author: "Unknown" },
  { text: "The secret of change is to focus all of your energy not on fighting the old, but on building the new.", author: "Socrates" },
  { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
  { text: "Lack of direction, not lack of time, is the problem. We all have twenty-four hour days.", author: "Zig Ziglar" },
  { text: "Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.", author: "Buddha" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { text: "You will never find time for anything. If you want time, you must make it.", author: "Charles Buxton" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Amateurs sit and wait for inspiration, the rest of us just get up and go to work.", author: "Stephen King" }
];

// Get random quote
function getRandomQuote() {
  const randomIndex = Math.floor(Math.random() * quotes.length);
  return quotes[randomIndex];
}

// Display random quote
const quote = getRandomQuote();
document.getElementById('quoteText').textContent = quote.text;
document.getElementById('quoteAuthor').textContent = `— ${quote.author}`;

// Get blocked URL
const urlParams = new URLSearchParams(window.location.search);
const blockedUrl = urlParams.get('url') || 'This site';

try {
  const url = new URL(decodeURIComponent(blockedUrl));
  document.getElementById('blockedSite').textContent = url.hostname.replace('www.', '');
} catch (e) {
  document.getElementById('blockedSite').textContent = 'This site';
}

// Update stats and progress using chrome.storage
function updateStats() {
  chrome.storage.local.get(['timerState', 'distractions'], (data) => {
    // Update time remaining
    if (data.timerState && typeof data.timerState.timeRemaining === 'number') {
      const mins = Math.floor(data.timerState.timeRemaining / 60);
      const secs = data.timerState.timeRemaining % 60;
      document.getElementById('timeLeft').textContent = 
        `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      
      // Calculate progress
      const totalTime = data.timerState.totalTime || 1500; // Default 25 minutes
      const timeRemaining = data.timerState.timeRemaining || 0;
      const progress = ((totalTime - timeRemaining) / totalTime) * 100;
      
      document.getElementById('progressFill').style.width = `${Math.max(0, Math.min(100, progress))}%`;
      document.getElementById('progressPercent').textContent = `${Math.round(progress)}%`;
    } else {
      document.getElementById('timeLeft').textContent = '00:00';
      document.getElementById('progressFill').style.width = '0%';
      document.getElementById('progressPercent').textContent = '0%';
    }
    
    // Update blocks today
    const blocksCount = data.distractions || 0;
    document.getElementById('blocksToday').textContent = blocksCount;
  });
}

// Breathing animation text
let breathingPhase = 0;
const breathingTexts = ['Inhale', 'Hold', 'Exhale', 'Hold'];

setInterval(() => {
  breathingPhase = (breathingPhase + 1) % 4;
  document.getElementById('breathingText').textContent = breathingTexts[breathingPhase];
}, 4000);

// Button functions
function closeTab() {
  window.close();
}

function goBack() {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.close();
  }
}

// Make functions available globally
window.closeTab = closeTab;
window.goBack = goBack;

// Initial update
updateStats();

// Update stats every second
setInterval(updateStats, 1000);
// 🔧 TODO: set this to your real website domain, e.g. "lumora.app" or "studyhub.com"
const FOCUS_SITE_HOST = 'yourdomain.com';

const isFocusSite = window.location.hostname.includes(FOCUS_SITE_HOST);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'checkFocus') {
    sendResponse({ focused: document.hasFocus() });
  }

  // Forward timer updates to the website
  if (
    isFocusSite &&
    (message.action === 'updateTimer' || message.action === 'sessionComplete')
  ) {
    window.postMessage(
      {
        type: 'SHUNORA_TIMER_UPDATE',
        action: message.action,
        state: message.state,
        totalFocusSeconds: message.totalFocusSeconds
      },
      '*'
    );
  }

  return true;
});

// On initial load, ask background for current state so the website
// can immediately display the correct total time.
if (isFocusSite) {
  chrome.runtime.sendMessage({ action: 'getTimerSnapshot' }, (response) => {
    if (!response) return;

    window.postMessage(
      {
        type: 'SHUNORA_TIMER_UPDATE',
        action: 'snapshot',
        state: response.state,
        totalFocusSeconds: response.totalFocusSeconds
      },
      '*'
    );
  });
}
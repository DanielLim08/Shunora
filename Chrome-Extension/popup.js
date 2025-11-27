const DEFAULT_WORK_MINUTES = 25;
const DEFAULT_BREAK_MINUTES = 5;
const DURATION_LIMITS = {
  work: { min: 1, max: 60, defaultValue: DEFAULT_WORK_MINUTES },
  break: { min: 1, max: 30, defaultValue: DEFAULT_BREAK_MINUTES }
};

// Timer State
let timerState = {
  isRunning: false,
  isPaused: false,
  timeRemaining: DEFAULT_WORK_MINUTES * 60,
  totalTime: DEFAULT_WORK_MINUTES * 60,
  sessionType: 'work'
};

// DOM Elements
const timeDisplay = document.getElementById('timeDisplay');
const sessionType = document.getElementById('sessionType');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const workDuration = document.getElementById('workDuration');
const breakDuration = document.getElementById('breakDuration');
const workSlider = document.getElementById('workSlider');
const breakSlider = document.getElementById('breakSlider');
const totalStudyTime = document.getElementById('totalStudyTime');
const distractions = document.getElementById('distractions');
const progressCircle = document.getElementById('progressCircle');
const widgetContainer = document.getElementById('widgetContainer');
const workSessionBtn = document.getElementById('workSessionBtn');
const breakSessionBtn = document.getElementById('breakSessionBtn');

// Add SVG gradients
function addSVGGradients() {
  const svg = document.querySelector('.progress-ring svg');
  if (!svg) return;
  
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  
  // Work gradient
  const workGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
  workGradient.setAttribute('id', 'progressGradient');
  workGradient.setAttribute('x1', '0%');
  workGradient.setAttribute('y1', '0%');
  workGradient.setAttribute('x2', '100%');
  workGradient.setAttribute('y2', '100%');
  
  const workStop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  workStop1.setAttribute('offset', '0%');
  workStop1.setAttribute('stop-color', '#8b5cf6');
  
  const workStop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  workStop2.setAttribute('offset', '100%');
  workStop2.setAttribute('stop-color', '#7c3aed');
  
  workGradient.appendChild(workStop1);
  workGradient.appendChild(workStop2);
  
  // Break gradient
  const breakGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
  breakGradient.setAttribute('id', 'breakGradient');
  breakGradient.setAttribute('x1', '0%');
  breakGradient.setAttribute('y1', '0%');
  breakGradient.setAttribute('x2', '100%');
  breakGradient.setAttribute('y2', '100%');
  
  const breakStop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  breakStop1.setAttribute('offset', '0%');
  breakStop1.setAttribute('stop-color', '#06b6d4');
  
  const breakStop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  breakStop2.setAttribute('offset', '100%');
  breakStop2.setAttribute('stop-color', '#8b5cf6');
  
  breakGradient.appendChild(breakStop1);
  breakGradient.appendChild(breakStop2);
  
  defs.appendChild(workGradient);
  defs.appendChild(breakGradient);
  svg.insertBefore(defs, svg.firstChild);
}

// Tab switching
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const targetTab = btn.dataset.tab;
    
    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    
    btn.classList.add('active');
    document.getElementById(`${targetTab}-tab`).classList.add('active');
  });
});

// Minimize functionality
const minimizeBtn = document.getElementById('minimizeBtn');
const widgetContent = document.getElementById('widgetContent');
let isMinimized = false;

minimizeBtn.addEventListener('click', () => {
  isMinimized = !isMinimized;
  if (isMinimized) {
    widgetContent.style.display = 'none';
    minimizeBtn.textContent = '+';
    widgetContainer.style.height = 'auto';
  } else {
    widgetContent.style.display = 'block';
    minimizeBtn.textContent = '−';
    widgetContainer.style.height = '';
  }
});

// Timer Functions
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatStudyTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

function updateDisplay() {
  timeDisplay.textContent = formatTime(timerState.timeRemaining);
  sessionType.textContent = timerState.sessionType === 'work' ? 'Work Session' : 'Break Time';
  
  // Update session buttons
  if (timerState.sessionType === 'work') {
    workSessionBtn.classList.add('active');
    breakSessionBtn.classList.remove('active');
  } else {
    workSessionBtn.classList.remove('active');
    breakSessionBtn.classList.add('active');
  }
  
  const circumference = 2 * Math.PI * 70;
  const progress = timerState.timeRemaining / timerState.totalTime;
  const offset = circumference * (1 - progress);
  progressCircle.style.strokeDashoffset = offset;
  
  // Update the timer text inside the circle
  const timerInCircle = document.getElementById('timerInCircle');
  if (timerInCircle) {
    timerInCircle.textContent = formatTime(timerState.timeRemaining);
  }
  
  const timerDisplay = document.querySelector('.timer-display');
  if (timerState.sessionType === 'work') {
    timerDisplay.classList.remove('session-break');
    progressCircle.style.stroke = 'url(#progressGradient)';
  } else {
    timerDisplay.classList.add('session-break');
    progressCircle.style.stroke = 'url(#breakGradient)';
  }
}

function sanitizeDurationValue(value, config) {
  let parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    parsed = config.defaultValue;
  }
  return Math.min(config.max, Math.max(config.min, parsed));
}

function normalizeDurationInput(input, config) {
  const value = sanitizeDurationValue(input.value, config);
  input.value = value;
  return value;
}

function persistDurationSettings() {
  const workMinutes = normalizeDurationInput(workDuration, DURATION_LIMITS.work);
  const breakMinutes = normalizeDurationInput(breakDuration, DURATION_LIMITS.break);
  chrome.storage.local.set({
    workDuration: workMinutes,
    breakDuration: breakMinutes
  });
  return { workMinutes, breakMinutes };
}

function updateSliderProgress(slider, value, max) {
  const percent = ((value - 1) / (max - 1)) * 100;
  slider.style.setProperty('--range-progress', `${percent}%`);
}

function syncDurationsFromStorage(data) {
  const workMinutes = sanitizeDurationValue(data.workDuration, DURATION_LIMITS.work);
  const breakMinutes = sanitizeDurationValue(data.breakDuration, DURATION_LIMITS.break);
  workDuration.value = workMinutes;
  breakDuration.value = breakMinutes;
  workSlider.value = workMinutes;
  breakSlider.value = breakMinutes;
  updateSliderProgress(workSlider, workMinutes, 60);
  updateSliderProgress(breakSlider, breakMinutes, 30);
  chrome.storage.local.set({
    workDuration: workMinutes,
    breakDuration: breakMinutes
  });
}

function handleDurationInputChange() {
  const { workMinutes } = persistDurationSettings();
  workSlider.value = workMinutes;
  updateSliderProgress(workSlider, workMinutes, 60);
  if (!timerState.isRunning && timerState.sessionType === 'work') {
    timerState.timeRemaining = workMinutes * 60;
    timerState.totalTime = workMinutes * 60;
    updateDisplay();
  }
}

function handleBreakInputChange() {
  const breakMinutes = normalizeDurationInput(breakDuration, DURATION_LIMITS.break);
  breakSlider.value = breakMinutes;
  updateSliderProgress(breakSlider, breakMinutes, 30);
  chrome.storage.local.set({ breakDuration: breakMinutes });
  if (!timerState.isRunning && timerState.sessionType === 'break') {
    timerState.timeRemaining = breakMinutes * 60;
    timerState.totalTime = breakMinutes * 60;
    updateDisplay();
  }
}

// Slider event handlers
workSlider.addEventListener('input', (e) => {
  const value = parseInt(e.target.value);
  workDuration.value = value;
  updateSliderProgress(workSlider, value, 60);
  handleDurationInputChange();
});

breakSlider.addEventListener('input', (e) => {
  const value = parseInt(e.target.value);
  breakDuration.value = value;
  updateSliderProgress(breakSlider, value, 30);
  handleBreakInputChange();
});

function bumpStat(element) {
  const statCard = element.closest('.stat-mini');
  if (!statCard) return;
  statCard.classList.remove('bump');
  void statCard.offsetWidth;
  statCard.classList.add('bump');
}

let lastStats = {
  totalFocusSeconds: 0,
  distractions: 0
};

function loadStats() {
  chrome.storage.local.get(['totalFocusSeconds', 'distractions', 'lastResetDate'], (data) => {
    const today = new Date().toDateString();
    
    if (data.lastResetDate !== today) {
      chrome.storage.local.set({
        totalFocusSeconds: 0,
        distractions: 0,
        lastResetDate: today
      });
      totalStudyTime.textContent = '0h 0m';
      distractions.textContent = '0';
      lastStats.totalFocusSeconds = 0;
      lastStats.distractions = 0;
    } else {
      const newFocusTime = data.totalFocusSeconds || 0;
      const newDistractions = data.distractions || 0;

      if (newFocusTime !== lastStats.totalFocusSeconds) {
        totalStudyTime.textContent = formatStudyTime(newFocusTime);
        bumpStat(totalStudyTime);
      }

      if (newDistractions !== lastStats.distractions) {
        distractions.textContent = newDistractions;
        bumpStat(distractions);
      }

      lastStats.totalFocusSeconds = newFocusTime;
      lastStats.distractions = newDistractions;
    }
  });
}

function loadTimerState() {
  chrome.storage.local.get(['timerState', 'workDuration', 'breakDuration'], (data) => {
    const storageData = data || {};
    syncDurationsFromStorage(storageData);
    
    if (storageData.timerState) {
      timerState = storageData.timerState;
      updateDisplay();
      
      const timerDisplay = document.querySelector('.timer-display');
      
      if (timerState.isRunning && !timerState.isPaused) {
        startBtn.style.display = 'none';
        pauseBtn.style.display = 'block';
        timerDisplay.classList.add('pulsing');
        widgetContainer.classList.add('timer-running');
      } else if (timerState.isPaused) {
        startBtn.textContent = 'Resume';
        startBtn.style.display = 'block';
        pauseBtn.style.display = 'none';
        timerDisplay.classList.remove('pulsing');
        widgetContainer.classList.remove('timer-running');
      } else {
        timerDisplay.classList.remove('pulsing');
        widgetContainer.classList.remove('timer-running');
      }
    }
  });
}

// Session toggle buttons - FIXED to allow switching anytime
workSessionBtn.addEventListener('click', () => {
  const workMinutes = parseInt(workDuration.value);
  const wasRunning = timerState.isRunning;
  
  timerState.sessionType = 'work';
  timerState.timeRemaining = workMinutes * 60;
  timerState.totalTime = workMinutes * 60;
  
  // Send message to background to switch session
  chrome.runtime.sendMessage({ 
    action: 'switchSession', 
    state: timerState 
  });
  
  updateDisplay();
});

breakSessionBtn.addEventListener('click', () => {
  const breakMinutes = parseInt(breakDuration.value);
  const wasRunning = timerState.isRunning;
  
  timerState.sessionType = 'break';
  timerState.timeRemaining = breakMinutes * 60;
  timerState.totalTime = breakMinutes * 60;
  
  // Send message to background to switch session
  chrome.runtime.sendMessage({ 
    action: 'switchSession', 
    state: timerState 
  });
  
  updateDisplay();
});

startBtn.addEventListener('click', () => {
  if (!timerState.isRunning || timerState.isPaused) {
    if (!timerState.isRunning) {
      // Get the current session type and appropriate duration
      const duration = timerState.sessionType === 'work' 
        ? parseInt(workDuration.value) * 60
        : parseInt(breakDuration.value) * 60;
      
      timerState.timeRemaining = duration;
      timerState.totalTime = duration;
    }
    
    timerState.isRunning = true;
    timerState.isPaused = false;
    
    chrome.runtime.sendMessage({ action: 'startTimer', state: timerState });
    
    startBtn.style.display = 'none';
    pauseBtn.style.display = 'block';
    startBtn.textContent = 'Start';
    document.querySelector('.timer-display').classList.add('pulsing');
    widgetContainer.classList.add('timer-running');
    
    updateDisplay();
  }
});

pauseBtn.addEventListener('click', () => {
  timerState.isPaused = true;
  chrome.runtime.sendMessage({ action: 'pauseTimer' });
  
  pauseBtn.style.display = 'none';
  startBtn.style.display = 'block';
  startBtn.textContent = 'Resume';
  document.querySelector('.timer-display').classList.remove('pulsing');
  widgetContainer.classList.remove('timer-running');
});

resetBtn.addEventListener('click', () => {
  // Reset to current session type with appropriate duration
  const duration = timerState.sessionType === 'work'
    ? parseInt(workDuration.value) * 60
    : parseInt(breakDuration.value) * 60;
  
  timerState = {
    isRunning: false,
    isPaused: false,
    timeRemaining: duration,
    totalTime: duration,
    sessionType: timerState.sessionType // Keep current session type
  };
  
  chrome.runtime.sendMessage({ action: 'resetTimer' });
  
  startBtn.style.display = 'block';
  pauseBtn.style.display = 'none';
  startBtn.textContent = 'Start';
  document.querySelector('.timer-display').classList.remove('pulsing');
  widgetContainer.classList.remove('timer-running');
  
  updateDisplay();
});

// Spotify Controls
document.getElementById('openSpotify').addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://open.spotify.com' });
});

// Tasks Management
let tasks = [];

function loadTasks() {
  chrome.storage.local.get(['tasks'], (data) => {
    tasks = data.tasks || [];
    renderTasks();
  });
}

function saveTasks() {
  chrome.storage.local.set({ tasks });
}

function renderTasks() {
  const tasksList = document.getElementById('tasksList');
  const taskCount = document.getElementById('taskCount');
  
  if (tasks.length === 0) {
    tasksList.innerHTML = '<div class="empty-state">No tasks yet. Add one to get started! 🎯</div>';
    taskCount.textContent = '0 tasks';
    return;
  }
  
  tasksList.innerHTML = '';
  const activeTasks = tasks.filter(t => !t.completed).length;
  taskCount.textContent = `${activeTasks} task${activeTasks !== 1 ? 's' : ''}`;
  
  tasks.forEach((task, index) => {
    const taskItem = document.createElement('div');
    taskItem.className = 'task-item';
    
    const checkbox = document.createElement('div');
    checkbox.className = `task-checkbox ${task.completed ? 'checked' : ''}`;
    checkbox.addEventListener('click', () => toggleTask(index, taskItem));
    
    const text = document.createElement('div');
    text.className = `task-text ${task.completed ? 'completed' : ''}`;
    text.textContent = task.text;
    
    const editBtn = document.createElement('button');
    editBtn.className = 'task-edit';
    editBtn.setAttribute('aria-label', 'Edit task');
    editBtn.innerHTML = '✎';
    editBtn.addEventListener('click', () => beginTaskEdit(index, taskItem));
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'task-delete';
    deleteBtn.textContent = '×';
    deleteBtn.addEventListener('click', () => deleteTask(index));
    
    taskItem.appendChild(checkbox);
    taskItem.appendChild(text);
    taskItem.appendChild(editBtn);
    taskItem.appendChild(deleteBtn);
    tasksList.appendChild(taskItem);

    requestAnimationFrame(() => {
      taskItem.classList.add('enter');
    });
  });
}

function addTask() {
  const input = document.getElementById('taskInput');
  const text = input.value.trim();
  
  if (text) {
    tasks.unshift({ text, completed: false, createdAt: Date.now() });
    saveTasks();
    renderTasks();
    input.value = '';
  }
}

function toggleTask(index, taskItem) {
  tasks[index].completed = !tasks[index].completed;
  saveTasks();

  if (taskItem) {
    taskItem.classList.add('completed-anim');
    setTimeout(() => taskItem.classList.remove('completed-anim'), 400);
  }

  renderTasks();
}

function deleteTask(index) {
  tasks.splice(index, 1);
  saveTasks();
  renderTasks();
}

function beginTaskEdit(index, taskItem) {
  const textElement = taskItem.querySelector('.task-text');
  if (!textElement) return;
  
  const input = document.createElement('input');
  input.type = 'text';
  input.value = tasks[index].text;
  input.className = 'task-edit-input';
  input.setAttribute('aria-label', 'Edit task text');
  
  let committed = false;
  const finalizeEdit = (shouldSave) => {
    if (committed) return;
    committed = true;
    const trimmed = input.value.trim();
    const original = tasks[index].text;
    if (shouldSave && trimmed && trimmed !== original) {
      tasks[index].text = trimmed;
      saveTasks();
    }
    renderTasks();
  };
  
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      finalizeEdit(true);
    } else if (event.key === 'Escape') {
      finalizeEdit(false);
    }
  });
  
  input.addEventListener('blur', () => finalizeEdit(true));
  
  textElement.replaceWith(input);
  
  requestAnimationFrame(() => {
    input.focus();
    const length = input.value.length;
    input.setSelectionRange(length, length);
  });
}

function clearCompleted() {
  tasks = tasks.filter(t => !t.completed);
  saveTasks();
  renderTasks();
}

// Blocked Sites Management
let blockedSites = [];

function loadBlockedSites() {
  chrome.runtime.sendMessage({ action: 'getBlockedSites' }, (response) => {
    if (response && response.sites) {
      blockedSites = response.sites;
      renderBlockedSites();
    }
  });
}

function renderBlockedSites() {
  const sitesList = document.getElementById('blockedSitesList');
  
  if (blockedSites.length === 0) {
    sitesList.innerHTML = '<div class="empty-sites">No blocked sites yet. Add websites you want to avoid during work sessions.</div>';
    return;
  }
  
  sitesList.innerHTML = '';
  
  blockedSites.forEach((site, index) => {
    const siteItem = document.createElement('div');
    siteItem.className = 'site-item';
    
    const icon = document.createElement('div');
    icon.className = 'site-icon';
    icon.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `;
    
    const name = document.createElement('div');
    name.className = 'site-name';
    name.textContent = site;
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'site-remove';
    removeBtn.textContent = '×';
    removeBtn.setAttribute('aria-label', 'Remove site');
    removeBtn.addEventListener('click', () => removeSite(index));
    
    siteItem.appendChild(icon);
    siteItem.appendChild(name);
    siteItem.appendChild(removeBtn);
    sitesList.appendChild(siteItem);
    
    requestAnimationFrame(() => {
      siteItem.classList.add('enter');
    });
  });
}

function isValidDomain(domain) {
  // Remove protocol if present
  domain = domain.replace(/^https?:\/\//, '');
  // Remove www if present
  domain = domain.replace(/^www\./, '');
  // Remove path if present
  domain = domain.split('/')[0];
  
  // Basic domain validation
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
  return domainRegex.test(domain);
}

function addSite() {
  const input = document.getElementById('siteInput');
  let site = input.value.trim().toLowerCase();
  
  if (!site) return;
  
  // Clean up the input
  site = site.replace(/^https?:\/\//, '');
  site = site.replace(/^www\./, '');
  site = site.split('/')[0];
  
  if (!isValidDomain(site)) {
    input.classList.add('error');
    setTimeout(() => input.classList.remove('error'), 300);
    return;
  }
  
  if (blockedSites.includes(site)) {
    input.classList.add('error');
    setTimeout(() => input.classList.remove('error'), 300);
    return;
  }
  
  blockedSites.push(site);
  chrome.runtime.sendMessage({ 
    action: 'updateBlockedSites', 
    sites: blockedSites 
  });
  
  renderBlockedSites();
  input.value = '';
}

function removeSite(index) {
  blockedSites.splice(index, 1);
  chrome.runtime.sendMessage({ 
    action: 'updateBlockedSites', 
    sites: blockedSites 
  });
  renderBlockedSites();
}

function resetToDefaults() {
  chrome.runtime.sendMessage({ action: 'resetBlockedSites' }, (response) => {
    if (response && response.sites) {
      blockedSites = response.sites;
      renderBlockedSites();
    }
  });
}

// Event Listeners
document.getElementById('addTaskBtn').addEventListener('click', addTask);
document.getElementById('taskInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addTask();
});
document.getElementById('clearCompleted').addEventListener('click', clearCompleted);
workDuration.addEventListener('change', handleDurationInputChange);
breakDuration.addEventListener('change', handleBreakInputChange);

// Blocked Sites Event Listeners
document.getElementById('addSiteBtn').addEventListener('click', addSite);
document.getElementById('siteInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addSite();
});
document.getElementById('resetDefaultsBtn').addEventListener('click', resetToDefaults);

// Message Listener
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'updateTimer') {
    timerState = message.state;
    updateDisplay();
  } else if (message.action === 'sessionComplete') {
    loadStats();
    const timerDisplay = document.querySelector('.timer-display');
    if (timerState.sessionType === 'work') {
      timerDisplay.classList.remove('pulsing');
      widgetContainer.classList.remove('timer-running');
    }
  } else if (message.action === 'updateStats') {
    loadStats();
  }
});

// Initialize
addSVGGradients();
loadStats();
loadTimerState();
loadTasks();
loadBlockedSites();
updateDisplay();
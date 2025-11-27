// ============================================
// StudyFlow - Main Application Logic
// ============================================

// Check if Supabase info file exists, if not create a placeholder
const SUPABASE_PROJECT_ID = 'YOUR_PROJECT_ID';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';

// Initialize Supabase Client
let supabaseClient = null;
let currentUser = null;
let accessToken = null;

// App State
const appState = {
    // Timer
    timerMode: 'work',
    timerRunning: false,
    timeLeft: 25 * 60,
    sessionCount: 0,
    timerInterval: null,
    
    // Settings
    settings: {
        workDuration: 25,
        shortBreak: 5,
        longBreak: 15,
        sessionsBeforeLongBreak: 4,
        autoStartBreaks: false,
        autoStartWork: false,
        blockedSites: []
    },
    
    // Tasks
    tasks: [
        {
            id: '1',
            title: 'Complete math homework',
            completed: false,
            priority: 'high',
            dueDate: '2025-11-17',
            category: 'Homework'
        },
        {
            id: '2',
            title: 'Study for biology exam',
            completed: false,
            priority: 'urgent',
            dueDate: '2025-11-18',
            category: 'Exam'
        },
        {
            id: '3',
            title: 'Read chapter 5',
            completed: true,
            priority: 'medium',
            category: 'Reading'
        }
    ],
    taskFilter: 'all',
    
    // Notes
    notes: [
        {
            id: '1',
            title: 'Biology Notes',
            content: 'Cell structure and functions...',
            color: '#d596ff',
            tags: ['biology', 'exam']
        },
        {
            id: '2',
            title: 'Math Formulas',
            content: 'Quadratic formula: x = (-b ± √(b²-4ac)) / 2a',
            color: '#8eacff',
            tags: ['math', 'formulas']
        }
    ],
    
    // Resources
    resources: [
        {
            id: '1',
            title: 'Khan Academy',
            url: 'https://www.khanacademy.org',
            description: 'Free online courses and lessons'
        },
        {
            id: '2',
            title: 'Coursera',
            url: 'https://www.coursera.org',
            description: 'Online learning platform'
        }
    ],
    
    // Calendar
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    
    // Active tab
    activeTab: 'timer'
};

// ============================================
// Initialization
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    // Initialize Supabase if credentials are provided
    if (SUPABASE_PROJECT_ID !== 'YOUR_PROJECT_ID') {
        try {
            supabaseClient = supabase.createClient(
                `https://${SUPABASE_PROJECT_ID}.supabase.co`,
                SUPABASE_ANON_KEY
            );
            
            // Check for existing session
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (session?.access_token) {
                accessToken = session.access_token;
                currentUser = session.user;
                showApp();
                loadUserData();
            } else {
                showAuth();
            }
        } catch (error) {
            console.error('Supabase initialization error:', error);
            showAuth();
        }
    } else {
        // Demo mode without Supabase
        setTimeout(() => {
            showAuth();
        }, 1000);
    }
}

// ============================================
// UI Display Functions
// ============================================
function showAuth() {
    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('auth-container').style.display = 'flex';
    document.getElementById('app-container').style.display = 'none';
    createFloatingParticles(document.querySelector('.floating-particles'), 30);
    initializeAuthForm();
}

function showApp() {
    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('app-container').style.display = 'flex';
    createBackgroundParticles();
    createTimerParticles();
    initializeAppEvents();
    renderTasks();
    renderNotes();
    renderCalendar();
    renderResources();
    renderLeaderboard();
    renderBlockedSites();
    updateDashboard();
    initializeStudyCoach();
}

// ============================================
// Floating Particles
// ============================================
function createFloatingParticles(container, count) {
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.width = '8px';
        particle.style.height = '8px';
        particle.style.borderRadius = '50%';
        particle.style.background = 'rgba(211, 150, 255, 0.3)';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animation = `float ${6 + Math.random() * 4}s ease-in-out infinite`;
        particle.style.animationDelay = Math.random() * 3 + 's';
        container.appendChild(particle);
    }
}

function createBackgroundParticles() {
    const container = document.querySelector('.background-particles');
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.width = '8px';
        particle.style.height = '8px';
        particle.style.borderRadius = '50%';
        particle.style.background = 'rgba(211, 150, 255, 0.1)';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animation = `float ${10 + Math.random() * 10}s ease-in-out infinite`;
        particle.style.animationDelay = Math.random() * 5 + 's';
        container.appendChild(particle);
    }
}

function createTimerParticles() {
    const container = document.querySelector('.timer-particles');
    if (!container) return;
    
    for (let i = 0; i < 15; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.width = '8px';
        particle.style.height = '8px';
        particle.style.borderRadius = '50%';
        particle.style.background = 'rgba(147, 51, 234, 0.3)';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animation = `float ${4 + Math.random() * 3}s ease-in-out infinite`;
        particle.style.animationDelay = Math.random() * 2 + 's';
        container.appendChild(particle);
    }
}

// ============================================
// Authentication
// ============================================
function initializeAuthForm() {
    const signinTab = document.getElementById('signin-tab');
    const signupTab = document.getElementById('signup-tab');
    const authForm = document.getElementById('auth-form');
    const nameField = document.getElementById('name-field');
    const authButtonText = document.getElementById('auth-button-text');
    
    let isSignUp = false;
    
    signinTab.addEventListener('click', () => {
        isSignUp = false;
        signinTab.classList.add('active');
        signupTab.classList.remove('active');
        nameField.style.display = 'none';
        authButtonText.textContent = 'Sign In';
    });
    
    signupTab.addEventListener('click', () => {
        isSignUp = true;
        signupTab.classList.add('active');
        signinTab.classList.remove('active');
        nameField.style.display = 'flex';
        authButtonText.textContent = 'Sign Up';
    });
    
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const name = document.getElementById('name').value;
        const errorDiv = document.getElementById('auth-error');
        
        errorDiv.style.display = 'none';
        
        if (SUPABASE_PROJECT_ID === 'YOUR_PROJECT_ID') {
            // Demo mode
            showToast('Demo mode - Welcome to StudyFlow! 🎉', 'success');
            accessToken = 'demo-token';
            showApp();
            return;
        }
        
        try {
            if (isSignUp) {
                const { data, error } = await supabaseClient.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { name }
                    }
                });
                
                if (error) throw error;
                
                showToast('Account created! Please check your email to verify.', 'success');
                isSignUp = false;
                signinTab.click();
            } else {
                const { data, error } = await supabaseClient.auth.signInWithPassword({
                    email,
                    password
                });
                
                if (error) throw error;
                
                accessToken = data.session.access_token;
                currentUser = data.user;
                showToast('Welcome to StudyFlow! 🎉', 'success');
                showApp();
                loadUserData();
            }
        } catch (error) {
            errorDiv.textContent = error.message;
            errorDiv.style.display = 'block';
        }
    });
}

// ============================================
// App Event Listeners
// ============================================
function initializeAppEvents() {
    // Sign out
    document.getElementById('signout-btn').addEventListener('click', handleSignOut);
    
    // Tabs
    document.querySelectorAll('.tab-trigger').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
    
    // Timer
    initializeTimer();
    
    // Tasks
    document.getElementById('add-task-btn').addEventListener('click', addTask);
    document.getElementById('new-task-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => filterTasks(btn.dataset.filter));
    });
    
    // Notes
    document.getElementById('add-note-btn').addEventListener('click', addNote);
    
    // Calendar
    document.getElementById('calendar-prev').addEventListener('click', () => changeMonth(-1));
    document.getElementById('calendar-next').addEventListener('click', () => changeMonth(1));
    
    // Resources
    document.getElementById('add-resource-btn').addEventListener('click', addResource);
    
    // Blocker
    document.getElementById('add-blocked-site-btn').addEventListener('click', addBlockedSite);
    
    // Music
    document.querySelectorAll('.playlist-item').forEach(item => {
        item.addEventListener('click', () => {
            window.open(item.dataset.url, '_blank');
            showToast('Opening playlist... 🎵', 'success');
        });
    });
    
    // Settings
    document.getElementById('settings-btn').addEventListener('click', openSettingsDialog);
    document.getElementById('close-settings').addEventListener('click', closeSettingsDialog);
    document.getElementById('settings-overlay').addEventListener('click', closeSettingsDialog);
    document.getElementById('save-settings').addEventListener('click', saveSettings);
    
    // Study Coach
    document.getElementById('close-coach').addEventListener('click', hideStudyCoach);
    document.getElementById('show-coach').addEventListener('click', showStudyCoach);
}

async function handleSignOut() {
    if (supabaseClient) {
        await supabaseClient.auth.signOut();
    }
    accessToken = null;
    currentUser = null;
    showToast('See you soon! 👋', 'success');
    location.reload();
}

function switchTab(tabName) {
    appState.activeTab = tabName;
    
    // Update tab triggers
    document.querySelectorAll('.tab-trigger').forEach(trigger => {
        trigger.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// ============================================
// Timer Functions
// ============================================
function initializeTimer() {
    const toggleBtn = document.getElementById('timer-toggle');
    const resetBtn = document.getElementById('timer-reset');
    const modeButtons = document.querySelectorAll('.mode-button');
    
    toggleBtn.addEventListener('click', toggleTimer);
    resetBtn.addEventListener('click', resetTimer);
    
    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => switchTimerMode(btn.dataset.mode));
    });
    
    updateTimerDisplay();
}

function toggleTimer() {
    appState.timerRunning = !appState.timerRunning;
    
    const toggleBtn = document.getElementById('timer-toggle');
    const toggleText = document.getElementById('timer-toggle-text');
    const playIcon = document.getElementById('play-icon');
    const timerDisplay = document.getElementById('timer-display');
    const settingsIcon = document.getElementById('settings-icon');
    
    if (appState.timerRunning) {
        toggleText.textContent = 'Pause';
        playIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
        timerDisplay.classList.add('running');
        settingsIcon.style.animation = 'rotate 2s linear infinite';
        startTimer();
    } else {
        toggleText.textContent = 'Start';
        playIcon.innerHTML = '<polygon points="6 3 20 12 6 21 6 3"/>';
        timerDisplay.classList.remove('running');
        settingsIcon.style.animation = '';
        stopTimer();
    }
}

function startTimer() {
    appState.timerInterval = setInterval(() => {
        appState.timeLeft--;
        
        if (appState.timeLeft <= 0) {
            handleTimerComplete();
        }
        
        updateTimerDisplay();
    }, 1000);
}

function stopTimer() {
    if (appState.timerInterval) {
        clearInterval(appState.timerInterval);
        appState.timerInterval = null;
    }
}

function resetTimer() {
    stopTimer();
    appState.timerRunning = false;
    appState.timeLeft = getDuration(appState.timerMode);
    updateTimerDisplay();
    
    const toggleBtn = document.getElementById('timer-toggle');
    const toggleText = document.getElementById('timer-toggle-text');
    const playIcon = document.getElementById('play-icon');
    const timerDisplay = document.getElementById('timer-display');
    
    toggleText.textContent = 'Start';
    playIcon.innerHTML = '<polygon points="6 3 20 12 6 21 6 3"/>';
    timerDisplay.classList.remove('running');
}

function switchTimerMode(mode) {
    if (appState.timerRunning) {
        stopTimer();
        appState.timerRunning = false;
    }
    
    appState.timerMode = mode;
    appState.timeLeft = getDuration(mode);
    
    document.querySelectorAll('.mode-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
    
    updateTimerDisplay();
    resetTimer();
}

function getDuration(mode) {
    switch (mode) {
        case 'work':
            return appState.settings.workDuration * 60;
        case 'shortBreak':
            return appState.settings.shortBreak * 60;
        case 'longBreak':
            return appState.settings.longBreak * 60;
        default:
            return 25 * 60;
    }
}

function updateTimerDisplay() {
    const timeDisplay = document.getElementById('timer-time');
    const timerDisplay = document.getElementById('timer-display');
    const modeLabel = document.getElementById('timer-mode-label');
    const progressFill = document.getElementById('timer-progress');
    const sessionCountEl = document.getElementById('session-count');
    
    // Update time
    const minutes = Math.floor(appState.timeLeft / 60);
    const seconds = appState.timeLeft % 60;
    timeDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    // Update mode display
    timerDisplay.className = 'timer-display ' + appState.timerMode;
    if (appState.timerRunning) {
        timerDisplay.classList.add('running');
    }
    
    // Update mode label
    const modeLabels = {
        work: 'Focus Time',
        shortBreak: 'Short Break',
        longBreak: 'Long Break'
    };
    modeLabel.textContent = modeLabels[appState.timerMode] || 'Focus Time';
    
    // Update progress
    const totalDuration = getDuration(appState.timerMode);
    const progress = ((totalDuration - appState.timeLeft) / totalDuration) * 100;
    progressFill.style.width = progress + '%';
    
    // Update session count
    sessionCountEl.textContent = appState.sessionCount;
}

async function handleTimerComplete() {
    stopTimer();
    playNotificationSound();
    
    if (appState.timerMode === 'work') {
        // Show celebration
        showCelebration();
        appState.sessionCount++;
        
        // Log session if Supabase is available
        if (accessToken && SUPABASE_PROJECT_ID !== 'YOUR_PROJECT_ID') {
            try {
                await logSession(accessToken, appState.settings.workDuration, 'work');
            } catch (error) {
                console.error('Failed to log session:', error);
            }
        }
        
        // Update dashboard
        updateDashboard();
        
        // Determine next break
        if (appState.sessionCount % appState.settings.sessionsBeforeLongBreak === 0) {
            appState.timerMode = 'longBreak';
        } else {
            appState.timerMode = 'shortBreak';
        }
        
        appState.timeLeft = getDuration(appState.timerMode);
        
        if (appState.settings.autoStartBreaks) {
            appState.timerRunning = true;
            startTimer();
        } else {
            appState.timerRunning = false;
        }
        
        showToast('Great job! Time for a break! 🎉', 'success');
    } else {
        // Break ended
        appState.timerMode = 'work';
        appState.timeLeft = getDuration('work');
        
        if (appState.settings.autoStartWork) {
            appState.timerRunning = true;
            startTimer();
        } else {
            appState.timerRunning = false;
        }
        
        showToast('Break over! Ready to focus? 💪', 'success');
    }
    
    document.querySelectorAll('.mode-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-mode="${appState.timerMode}"]`).classList.add('active');
    
    updateTimerDisplay();
}

function playNotificationSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
        console.error('Audio playback error:', error);
    }
}

function showCelebration() {
    const celebration = document.getElementById('celebration');
    celebration.innerHTML = '';
    
    for (let i = 0; i < 12; i++) {
        const spark = document.createElement('div');
        spark.innerHTML = '✨';
        spark.style.position = 'absolute';
        spark.style.fontSize = '24px';
        spark.style.top = '50%';
        spark.style.left = '50%';
        spark.style.transform = 'translate(-50%, -50%)';
        spark.style.pointerEvents = 'none';
        
        const angle = (i / 12) * Math.PI * 2;
        const distance = 150;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        
        celebration.appendChild(spark);
        
        spark.animate([
            { transform: 'translate(-50%, -50%) scale(0)', opacity: 1 },
            { transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(1)`, opacity: 0.5 },
            { transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(0)`, opacity: 0 }
        ], {
            duration: 1500,
            easing: 'ease-out'
        });
    }
    
    setTimeout(() => {
        celebration.innerHTML = '';
    }, 1500);
}

// ============================================
// Tasks Functions
// ============================================
function renderTasks() {
    const tasksList = document.getElementById('tasks-list');
    const filteredTasks = appState.tasks.filter(task => {
        if (appState.taskFilter === 'active') return !task.completed;
        if (appState.taskFilter === 'completed') return task.completed;
        return true;
    });
    
    tasksList.innerHTML = filteredTasks.map(task => `
        <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}" draggable="true">
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask('${task.id}')">
            <svg class="task-drag-handle" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="9" cy="12" r="1"/>
                <circle cx="9" cy="5" r="1"/>
                <circle cx="9" cy="19" r="1"/>
                <circle cx="15" cy="12" r="1"/>
                <circle cx="15" cy="5" r="1"/>
                <circle cx="15" cy="19" r="1"/>
            </svg>
            <div class="task-content">
                <div class="task-title">${task.title}</div>
                <div class="task-meta">
                    <span class="task-badge ${task.priority}">${task.priority}</span>
                    ${task.dueDate ? `<span class="task-badge">Due: ${task.dueDate}</span>` : ''}
                    ${task.category ? `<span class="task-badge">${task.category}</span>` : ''}
                </div>
            </div>
            <button class="task-delete" onclick="deleteTask('${task.id}')">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 6h18"/>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                </svg>
            </button>
        </div>
    `).join('');
    
    // Setup drag and drop
    setupTaskDragAndDrop();
}

function setupTaskDragAndDrop() {
    const taskItems = document.querySelectorAll('.task-item');
    let draggedElement = null;
    
    taskItems.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            draggedElement = item;
            item.style.opacity = '0.5';
        });
        
        item.addEventListener('dragend', (e) => {
            item.style.opacity = '1';
        });
        
        item.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        
        item.addEventListener('drop', (e) => {
            e.preventDefault();
            if (draggedElement !== item) {
                const allItems = [...taskItems];
                const draggedIndex = allItems.indexOf(draggedElement);
                const targetIndex = allItems.indexOf(item);
                
                // Reorder tasks array
                const draggedTask = appState.tasks[draggedIndex];
                appState.tasks.splice(draggedIndex, 1);
                appState.tasks.splice(targetIndex, 0, draggedTask);
                
                renderTasks();
            }
        });
    });
}

function addTask() {
    const input = document.getElementById('new-task-input');
    const prioritySelect = document.getElementById('new-task-priority');
    const title = input.value.trim();
    
    if (!title) {
        showToast('Please enter a task title', 'error');
        return;
    }
    
    const newTask = {
        id: Date.now().toString(),
        title,
        completed: false,
        priority: prioritySelect.value
    };
    
    appState.tasks.unshift(newTask);
    input.value = '';
    prioritySelect.value = 'medium';
    
    renderTasks();
    showToast('Task added! ✨', 'success');
}

function toggleTask(id) {
    const task = appState.tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        if (task.completed) {
            showToast('Task completed! Great job! 🎉', 'success');
        }
        renderTasks();
    }
}

function deleteTask(id) {
    appState.tasks = appState.tasks.filter(t => t.id !== id);
    renderTasks();
    showToast('Task deleted', 'success');
}

function filterTasks(filter) {
    appState.taskFilter = filter;
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
    
    renderTasks();
}

// ============================================
// Notes Functions
// ============================================
function renderNotes() {
    const notesGrid = document.getElementById('notes-grid');
    
    notesGrid.innerHTML = appState.notes.map(note => `
        <div class="note-card" data-id="${note.id}" style="border-color: ${note.color};">
            <div class="note-header">
                <div class="note-color" style="background: ${note.color};" onclick="changeNoteColor('${note.id}')"></div>
                <button class="note-delete" onclick="deleteNote('${note.id}')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 6h18"/>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                    </svg>
                </button>
            </div>
            <textarea class="note-title" rows="1" onchange="updateNote('${note.id}', 'title', this.value)">${note.title}</textarea>
            <textarea class="note-content" rows="4" onchange="updateNote('${note.id}', 'content', this.value)">${note.content}</textarea>
            <div class="note-tags">
                ${note.tags.map(tag => `<span class="note-tag">#${tag}</span>`).join('')}
            </div>
        </div>
    `).join('');
}

function addNote() {
    const colors = ['#d596ff', '#8eacff', '#FFC857', '#FF4E4E', '#16a34a'];
    const newNote = {
        id: Date.now().toString(),
        title: 'New Note',
        content: 'Start writing...',
        color: colors[Math.floor(Math.random() * colors.length)],
        tags: []
    };
    
    appState.notes.unshift(newNote);
    renderNotes();
    showToast('Note created! ✨', 'success');
}

function updateNote(id, field, value) {
    const note = appState.notes.find(n => n.id === id);
    if (note) {
        note[field] = value;
    }
}

function changeNoteColor(id) {
    const colors = ['#d596ff', '#8eacff', '#FFC857', '#FF4E4E', '#16a34a'];
    const note = appState.notes.find(n => n.id === id);
    if (note) {
        const currentIndex = colors.indexOf(note.color);
        note.color = colors[(currentIndex + 1) % colors.length];
        renderNotes();
    }
}

function deleteNote(id) {
    appState.notes = appState.notes.filter(n => n.id !== id);
    renderNotes();
    showToast('Note deleted', 'success');
}

// ============================================
// Calendar Functions
// ============================================
function renderCalendar() {
    const calendarGrid = document.getElementById('calendar-grid');
    const calendarTitle = document.getElementById('calendar-title');
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    calendarTitle.textContent = `${monthNames[appState.currentMonth]} ${appState.currentYear}`;
    
    const firstDay = new Date(appState.currentYear, appState.currentMonth, 1);
    const lastDay = new Date(appState.currentYear, appState.currentMonth + 1, 0);
    const prevLastDay = new Date(appState.currentYear, appState.currentMonth, 0);
    
    const firstDayOfWeek = firstDay.getDay();
    const lastDateOfMonth = lastDay.getDate();
    const prevLastDate = prevLastDay.getDate();
    
    let html = '';
    
    // Day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        html += `<div class="calendar-day-header">${day}</div>`;
    });
    
    // Previous month days
    for (let i = firstDayOfWeek; i > 0; i--) {
        html += `<div class="calendar-day other-month"><span class="calendar-day-number">${prevLastDate - i + 1}</span></div>`;
    }
    
    // Current month days
    const today = new Date();
    for (let day = 1; day <= lastDateOfMonth; day++) {
        const isToday = day === today.getDate() && 
                       appState.currentMonth === today.getMonth() && 
                       appState.currentYear === today.getFullYear();
        
        const hasStudySession = Math.random() > 0.7; // Demo data
        const hasTaskDue = Math.random() > 0.8; // Demo data
        
        html += `
            <div class="calendar-day ${isToday ? 'today' : ''}">
                <span class="calendar-day-number">${day}</span>
                <div class="calendar-day-dots">
                    ${hasStudySession ? '<span class="calendar-dot study-session"></span>' : ''}
                    ${hasTaskDue ? '<span class="calendar-dot task-due"></span>' : ''}
                </div>
            </div>
        `;
    }
    
    // Next month days
    const remainingDays = 42 - (firstDayOfWeek + lastDateOfMonth);
    for (let i = 1; i <= remainingDays; i++) {
        html += `<div class="calendar-day other-month"><span class="calendar-day-number">${i}</span></div>`;
    }
    
    calendarGrid.innerHTML = html;
}

function changeMonth(delta) {
    appState.currentMonth += delta;
    
    if (appState.currentMonth > 11) {
        appState.currentMonth = 0;
        appState.currentYear++;
    } else if (appState.currentMonth < 0) {
        appState.currentMonth = 11;
        appState.currentYear--;
    }
    
    renderCalendar();
}

// ============================================
// Resources Functions
// ============================================
function renderResources() {
    const resourcesList = document.getElementById('resources-list');
    
    resourcesList.innerHTML = appState.resources.map(resource => `
        <div class="resource-item" data-id="${resource.id}">
            <div class="resource-header">
                <a href="${resource.url}" target="_blank" class="resource-title">${resource.title}</a>
                <button class="resource-delete" onclick="deleteResource('${resource.id}')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 6h18"/>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                    </svg>
                </button>
            </div>
            <a href="${resource.url}" target="_blank" class="resource-url">${resource.url}</a>
            <p class="resource-description">${resource.description}</p>
        </div>
    `).join('');
}

function addResource() {
    const title = prompt('Enter resource title:');
    if (!title) return;
    
    const url = prompt('Enter resource URL:');
    if (!url) return;
    
    const description = prompt('Enter resource description:') || '';
    
    const newResource = {
        id: Date.now().toString(),
        title,
        url,
        description
    };
    
    appState.resources.unshift(newResource);
    renderResources();
    showToast('Resource added! 📚', 'success');
}

function deleteResource(id) {
    appState.resources = appState.resources.filter(r => r.id !== id);
    renderResources();
    showToast('Resource deleted', 'success');
}

// ============================================
// Dashboard Functions
// ============================================
function updateDashboard() {
    document.getElementById('total-sessions').textContent = appState.sessionCount;
    document.getElementById('study-streak').textContent = Math.floor(Math.random() * 7) + ' days';
    
    const totalHours = Math.floor((appState.sessionCount * appState.settings.workDuration) / 60);
    document.getElementById('total-hours').textContent = totalHours + 'h';
    
    // Simple bar chart
    const canvas = document.getElementById('weekly-chart');
    if (canvas && canvas.getContext) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        ctx.clearRect(0, 0, width, height);
        
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const data = [3, 5, 2, 7, 4, 6, 3]; // Demo data
        const maxValue = Math.max(...data);
        const barWidth = width / days.length - 20;
        
        // Draw bars
        data.forEach((value, index) => {
            const barHeight = (value / maxValue) * (height - 40);
            const x = index * (width / days.length) + 10;
            const y = height - barHeight - 20;
            
            // Gradient
            const gradient = ctx.createLinearGradient(0, y, 0, height - 20);
            gradient.addColorStop(0, '#d596ff');
            gradient.addColorStop(1, '#8eacff');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, barWidth, barHeight);
            
            // Day label
            ctx.fillStyle = '#A1A1A1';
            ctx.font = '12px Comfortaa';
            ctx.textAlign = 'center';
            ctx.fillText(days[index], x + barWidth / 2, height - 5);
            
            // Value label
            ctx.fillStyle = '#373737';
            ctx.fillText(value.toString(), x + barWidth / 2, y - 5);
        });
    }
}

// ============================================
// Leaderboard Functions
// ============================================
function renderLeaderboard() {
    const leaderboardList = document.getElementById('leaderboard-list');
    
    const demoUsers = [
        { rank: 1, name: 'Sarah Johnson', sessions: 127, hours: 53 },
        { rank: 2, name: 'Michael Chen', sessions: 115, hours: 48 },
        { rank: 3, name: 'Emma Davis', sessions: 108, hours: 45 },
        { rank: 4, name: 'You', sessions: appState.sessionCount, hours: Math.floor((appState.sessionCount * 25) / 60) },
        { rank: 5, name: 'James Wilson', sessions: 89, hours: 37 },
        { rank: 6, name: 'Olivia Martinez', sessions: 82, hours: 34 },
        { rank: 7, name: 'Daniel Brown', sessions: 76, hours: 32 }
    ];
    
    leaderboardList.innerHTML = demoUsers.map(user => `
        <div class="leaderboard-item ${user.rank <= 3 ? 'top-3' : ''}">
            <div class="leaderboard-rank">${user.rank}</div>
            <div class="leaderboard-info">
                <div class="leaderboard-name">${user.name}</div>
                <div class="leaderboard-stats">${user.sessions} sessions • ${user.hours} hours</div>
            </div>
            <div class="leaderboard-score">${user.sessions * 10}</div>
        </div>
    `).join('');
}

// ============================================
// Website Blocker Functions
// ============================================
function renderBlockedSites() {
    const blockedSitesList = document.getElementById('blocked-sites-list');
    
    if (appState.settings.blockedSites.length === 0) {
        blockedSitesList.innerHTML = '<p style="text-align: center; color: var(--medium-gray); padding: 2rem;">No blocked sites yet. Add one to get started!</p>';
        return;
    }
    
    blockedSitesList.innerHTML = appState.settings.blockedSites.map(site => `
        <div class="blocked-site-item">
            <span class="blocked-site-url">${site}</span>
            <button class="unblock-btn" onclick="removeBlockedSite('${site}')">Unblock</button>
        </div>
    `).join('');
}

function addBlockedSite() {
    const input = document.getElementById('blocked-site-input');
    const site = input.value.trim();
    
    if (!site) {
        showToast('Please enter a website URL', 'error');
        return;
    }
    
    if (appState.settings.blockedSites.includes(site)) {
        showToast('This site is already blocked', 'error');
        return;
    }
    
    appState.settings.blockedSites.push(site);
    input.value = '';
    
    renderBlockedSites();
    showToast('Site blocked! 🛡️', 'success');
}

function removeBlockedSite(site) {
    appState.settings.blockedSites = appState.settings.blockedSites.filter(s => s !== site);
    renderBlockedSites();
    showToast('Site unblocked!', 'success');
}

// ============================================
// Study Coach Functions
// ============================================
function initializeStudyCoach() {
    const messages = [
        "You're doing amazing! Keep up the great work! 🌟",
        "Every minute of focus brings you closer to your goals!",
        "Remember: Progress, not perfection!",
        "Your dedication today shapes your success tomorrow.",
        "Tip: Take breaks to recharge your brain power! 🧠",
        "Try the 50-10 rule: 50 min focus, 10 min break.",
        "Break big tasks into smaller, manageable chunks.",
        "Hydrate and stretch during your breaks!"
    ];
    
    // Rotate messages every 5 minutes
    setInterval(() => {
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        document.getElementById('coach-message').textContent = randomMessage;
    }, 300000);
}

function hideStudyCoach() {
    document.getElementById('study-coach').style.display = 'none';
    document.getElementById('show-coach').style.display = 'flex';
}

function showStudyCoach() {
    document.getElementById('study-coach').style.display = 'block';
    document.getElementById('show-coach').style.display = 'none';
}

// ============================================
// Settings Dialog Functions
// ============================================
function openSettingsDialog() {
    const dialog = document.getElementById('settings-dialog');
    dialog.style.display = 'block';
    
    // Populate current settings
    document.getElementById('work-duration').value = appState.settings.workDuration;
    document.getElementById('short-break').value = appState.settings.shortBreak;
    document.getElementById('long-break').value = appState.settings.longBreak;
    document.getElementById('sessions-before-long').value = appState.settings.sessionsBeforeLongBreak;
    document.getElementById('auto-start-breaks').checked = appState.settings.autoStartBreaks;
    document.getElementById('auto-start-work').checked = appState.settings.autoStartWork;
}

function closeSettingsDialog() {
    document.getElementById('settings-dialog').style.display = 'none';
}

function saveSettings() {
    appState.settings.workDuration = parseInt(document.getElementById('work-duration').value);
    appState.settings.shortBreak = parseInt(document.getElementById('short-break').value);
    appState.settings.longBreak = parseInt(document.getElementById('long-break').value);
    appState.settings.sessionsBeforeLongBreak = parseInt(document.getElementById('sessions-before-long').value);
    appState.settings.autoStartBreaks = document.getElementById('auto-start-breaks').checked;
    appState.settings.autoStartWork = document.getElementById('auto-start-work').checked;
    
    // Update timer if needed
    if (!appState.timerRunning) {
        appState.timeLeft = getDuration(appState.timerMode);
        updateTimerDisplay();
    }
    
    closeSettingsDialog();
    showToast('Settings saved! ✨', 'success');
}

// ============================================
// Toast Notifications
// ============================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? '✓' : '⚠';
    
    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-message">${message}</div>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            container.removeChild(toast);
        }, 300);
    }, 3000);
}

// ============================================
// API Functions (Supabase)
// ============================================
async function logSession(accessToken, duration, type) {
    if (SUPABASE_PROJECT_ID === 'YOUR_PROJECT_ID') return;
    
    const API_BASE = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/make-server-8a9e60ff`;
    
    try {
        const response = await fetch(`${API_BASE}/sessions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                duration,
                type,
                completedAt: new Date().toISOString()
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to log session');
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

async function loadUserData() {
    if (SUPABASE_PROJECT_ID === 'YOUR_PROJECT_ID' || !accessToken) return;
    
    const API_BASE = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/make-server-8a9e60ff`;
    
    try {
        // Load settings
        const settingsResponse = await fetch(`${API_BASE}/settings`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (settingsResponse.ok) {
            const data = await settingsResponse.json();
            appState.settings = { ...appState.settings, ...data.settings };
        }
        
        // Load sessions for stats
        const sessionsResponse = await fetch(`${API_BASE}/sessions`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (sessionsResponse.ok) {
            const data = await sessionsResponse.json();
            if (data.sessions) {
                appState.sessionCount = data.sessions.filter(s => s.type === 'work').length;
                updateDashboard();
            }
        }
    } catch (error) {
        console.error('Failed to load user data:', error);
    }
}

// ============================================
// Make functions global for inline event handlers
// ============================================
window.toggleTask = toggleTask;
window.deleteTask = deleteTask;
window.updateNote = updateNote;
window.changeNoteColor = changeNoteColor;
window.deleteNote = deleteNote;
window.deleteResource = deleteResource;
window.removeBlockedSite = removeBlockedSite;

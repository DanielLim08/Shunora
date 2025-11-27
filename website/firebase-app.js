// ============================================
// Shunora - Firebase Integration
// ============================================

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAq9dL_jSlpOJZkJSy8W0LpPql0XiZOF1M",
  authDomain: "shunora-2120b.firebaseapp.com",
  projectId: "shunora-2120b",
  storageBucket: "shunora-2120b.firebasestorage.app",
  messagingSenderId: "500608461096",
  appId: "1:500608461096:web:4efa289efc32439487081d",
  measurementId: "G-5GLHRNZRSY"
};

let auth = null;
let db = null;
let currentUser = null;
let selectedDate = null;

const appState = {
    timerMode: 'work',
    timerRunning: false,
    timeLeft: 25 * 60,
    sessionCount: 0,
    totalStudyTime: 0,
    timerInterval: null,
    noteUpdateTimers: {},
    
    settings: {
        workDuration: 25,
        shortBreak: 5,
        longBreak: 15,
        sessionsBeforeLongBreak: 4,
        autoStartBreaks: false,
        autoStartWork: false
    },
    
    tasks: [],
    taskFilter: 'all',
    notes: [],
    resources: [],
    calendarEvents: [],
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    activeTab: 'timer',
    weeklyData: [0, 0, 0, 0, 0, 0, 0]
};

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    if (typeof firebase === 'undefined') {
        console.error('Firebase SDK not loaded');
        showAuth();
        return;
    }
    
    try {
        firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();
        
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                currentUser = user;
                await loadUserData();
                showApp();
            } else {
                currentUser = null;
                showAuth();
            }
        });
    } catch (error) {
        console.error('Firebase error:', error);
        showAuth();
    }
}

// ============================================
// App Initialization and Auth
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
    updateDashboard();
    initializeStudyCoach();
}

function createFloatingParticles(container, count) {
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `position:absolute;width:8px;height:8px;border-radius:50%;background:rgba(211,150,255,0.3);left:${Math.random()*100}%;top:${Math.random()*100}%;animation:float ${6+Math.random()*4}s ease-in-out infinite;animation-delay:${Math.random()*3}s`;
        container.appendChild(particle);
    }
}

function createBackgroundParticles() {
    const container = document.querySelector('.background-particles');
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `position:absolute;width:8px;height:8px;border-radius:50%;background:rgba(211,150,255,0.1);left:${Math.random()*100}%;top:${Math.random()*100}%;animation:float ${10+Math.random()*10}s ease-in-out infinite;animation-delay:${Math.random()*5}s`;
        container.appendChild(particle);
    }
}

function createTimerParticles() {
    const container = document.querySelector('.timer-particles');
    if (!container) return;
    for (let i = 0; i < 15; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `position:absolute;width:8px;height:8px;border-radius:50%;background:rgba(147,51,234,0.3);left:${Math.random()*100}%;top:${Math.random()*100}%;animation:float ${4+Math.random()*3}s ease-in-out infinite;animation-delay:${Math.random()*2}s`;
        container.appendChild(particle);
    }
}

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
        
        try {
            if (isSignUp) {
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                await userCredential.user.updateProfile({ displayName: name });
                await db.collection('users').doc(userCredential.user.uid).set({
                    name: name,
                    email: email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                showToast('Account created! 🎉', 'success');
            } else {
                await auth.signInWithEmailAndPassword(email, password);
                showToast('Welcome back! 🎉', 'success');
            }
        } catch (error) {
            errorDiv.textContent = error.message;
            errorDiv.style.display = 'block';
        }
    });
}

async function loadUserData() {
    if (!currentUser || !db) return;
    
    try {
        const settingsDoc = await db.collection('users').doc(currentUser.uid).collection('settings').doc('preferences').get();
        if (settingsDoc.exists) {
            appState.settings = { ...appState.settings, ...settingsDoc.data() };
        }
        
        const tasksSnapshot = await db.collection('users').doc(currentUser.uid).collection('tasks').orderBy('createdAt', 'desc').get();
        appState.tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const notesSnapshot = await db.collection('users').doc(currentUser.uid).collection('notes').orderBy('createdAt', 'desc').get();
        appState.notes = notesSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                title: data.title || 'New Note',
                content: data.content || 'Start writing...',
                color: data.color || '#d596ff',
                tags: data.tags || []
            };
        });
        
        const resourcesSnapshot = await db.collection('users').doc(currentUser.uid).collection('resources').orderBy('createdAt', 'desc').get();
        appState.resources = resourcesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const eventsSnapshot = await db.collection('users').doc(currentUser.uid).collection('calendarEvents').get();
        appState.calendarEvents = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const sessionsSnapshot = await db.collection('users').doc(currentUser.uid).collection('sessions').orderBy('completedAt', 'desc').get();
        
        appState.sessionCount = 0;
        appState.totalStudyTime = 0;
        appState.weeklyData = [0, 0, 0, 0, 0, 0, 0];
        
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        
        sessionsSnapshot.forEach(doc => {
            const session = doc.data();
            if (session.type === 'work') {
                appState.sessionCount++;
                appState.totalStudyTime += session.duration || 0;
                
                if (session.completedAt) {
                    const sessionDate = session.completedAt.toDate();
                    if (sessionDate >= startOfWeek) {
                        const dayIndex = sessionDate.getDay();
                        appState.weeklyData[dayIndex]++;
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Error loading data', 'error');
    }
}

async function saveSettingsToFirebase() {
    if (!currentUser || !db) return;
    try {
        await db.collection('users').doc(currentUser.uid).collection('settings').doc('preferences').set(appState.settings);
    } catch (error) {
        console.error('Error saving settings:', error);
    }
}

async function logSessionToFirebase(duration, type) {
    if (!currentUser || !db) return;

    try {
        const userDocRef = db.collection('users').doc(currentUser.uid);
        const userDoc = await userDocRef.get();

        if (userDoc.exists) {
            await userDocRef.update({
                totalHours: firebase.firestore.FieldValue.increment(duration / 60),
                sessions: firebase.firestore.FieldValue.increment(1),
                lastActive: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            await userDocRef.set({
                name: currentUser.displayName || currentUser.email,
                email: currentUser.email,
                sessions: 1,
                totalHours: duration / 60,
                lastActive: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
    } catch (error) {
        console.error('Error logging session:', error);
    }
}

function initializeAppEvents() {
    document.getElementById('signout-btn').addEventListener('click', handleSignOut);
    document.querySelectorAll('.tab-trigger').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
    
    initializeTimer();
    
    document.getElementById('add-task-btn').addEventListener('click', addTask);
    document.getElementById('new-task-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => filterTasks(btn.dataset.filter));
    });
    
    document.getElementById('add-note-btn').addEventListener('click', addNote);
    document.getElementById('calendar-prev').addEventListener('click', () => changeMonth(-1));
    document.getElementById('calendar-next').addEventListener('click', () => changeMonth(1));
    document.getElementById('add-resource-btn').addEventListener('click', addResource);
    
    // Calendar event buttons
    document.getElementById('add-calendar-event').addEventListener('click', addCalendarEvent);
    document.getElementById('close-events-panel').addEventListener('click', () => {
        document.getElementById('calendar-events-panel').style.display = 'none';
        selectedDate = null;
    });
    
    document.querySelectorAll('.playlist-item').forEach(item => {
        item.addEventListener('click', () => {
            window.open(item.dataset.url, '_blank');
            showToast('Opening playlist... 🎵', 'success');
        });
    });
    
    document.getElementById('settings-btn').addEventListener('click', openSettingsDialog);
    document.getElementById('close-settings').addEventListener('click', closeSettingsDialog);
    document.getElementById('settings-overlay').addEventListener('click', closeSettingsDialog);
    document.getElementById('save-settings').addEventListener('click', saveSettings);
    document.getElementById('close-coach').addEventListener('click', hideStudyCoach);
    document.getElementById('show-coach').addEventListener('click', showStudyCoach);
}

async function handleSignOut() {
    if (auth) await auth.signOut();
    currentUser = null;
    showToast('See you soon! 👋', 'success');
}

function switchTab(tabName) {
    appState.activeTab = tabName;
    document.querySelectorAll('.tab-trigger').forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    if (tabName === 'leaderboard') renderLeaderboard();
    else if (tabName === 'dashboard') updateDashboard();
    else if (tabName === 'calendar') renderCalendar();
}

// ============================================
// Timer Functions
// ============================================

function initializeTimer() {
    document.getElementById('timer-toggle').addEventListener('click', toggleTimer);
    document.getElementById('timer-reset').addEventListener('click', resetTimer);
    document.querySelectorAll('.mode-button').forEach(btn => {
        btn.addEventListener('click', () => switchTimerMode(btn.dataset.mode));
    });
    updateTimerDisplay();
}

function toggleTimer() {
    appState.timerRunning = !appState.timerRunning;
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
        if (appState.timeLeft <= 0) handleTimerComplete();
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
    document.getElementById('timer-toggle-text').textContent = 'Start';
    document.getElementById('play-icon').innerHTML = '<polygon points="6 3 20 12 6 21 6 3"/>';
    document.getElementById('timer-display').classList.remove('running');
}

function switchTimerMode(mode) {
    if (appState.timerRunning) {
        stopTimer();
        appState.timerRunning = false;
    }
    appState.timerMode = mode;
    appState.timeLeft = getDuration(mode);
    document.querySelectorAll('.mode-button').forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
    updateTimerDisplay();
    resetTimer();
}

function getDuration(mode) {
    const durations = { work: appState.settings.workDuration * 60, shortBreak: appState.settings.shortBreak * 60, longBreak: appState.settings.longBreak * 60 };
    return durations[mode] || 1500;
}

function updateTimerDisplay() {
    const minutes = Math.floor(appState.timeLeft / 60);
    const seconds = appState.timeLeft % 60;
    document.getElementById('timer-time').textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    const timerDisplay = document.getElementById('timer-display');
    timerDisplay.className = 'timer-display ' + appState.timerMode;
    if (appState.timerRunning) timerDisplay.classList.add('running');
    
    const modeLabels = { work: 'Focus Time', shortBreak: 'Short Break', longBreak: 'Long Break' };
    document.getElementById('timer-mode-label').textContent = modeLabels[appState.timerMode] || 'Focus Time';
    
    const progress = ((getDuration(appState.timerMode) - appState.timeLeft) / getDuration(appState.timerMode)) * 100;
    document.getElementById('timer-progress').style.width = progress + '%';
    
    const hours = Math.floor(appState.totalStudyTime / 60);
    const mins = appState.totalStudyTime % 60;
    document.getElementById('total-time').textContent = `${hours}h ${mins}m`;
}

async function handleTimerComplete() {
    stopTimer();
    playNotificationSound();
    
    if (appState.timerMode === 'work') {
        showCelebration();
        appState.sessionCount++;
        appState.totalStudyTime += appState.settings.workDuration;
        appState.weeklyData[new Date().getDay()]++;
        
        if (currentUser && db) await logSessionToFirebase(appState.settings.workDuration, 'work');
        updateDashboard();
        
        appState.timerMode = (appState.sessionCount % appState.settings.sessionsBeforeLongBreak === 0) ? 'longBreak' : 'shortBreak';
        appState.timeLeft = getDuration(appState.timerMode);
        
        if (appState.settings.autoStartBreaks) {
            appState.timerRunning = true;
            startTimer();
        } else {
            appState.timerRunning = false;
        }
        showToast('Great job! Time for a break! 🎉', 'success');
    } else {
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
    
    document.querySelectorAll('.mode-button').forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-mode="${appState.timerMode}"]`).classList.add('active');
    updateTimerDisplay();
}

function playNotificationSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 800;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
                } catch (e) {
        if (task.completed) showToast('Task completed! 🎉', 'success');
        renderTasks();
    }
}

async function deleteTask(id) {
    if (currentUser && db) {
        try {
            await db.collection('users').doc(currentUser.uid).collection('tasks').doc(id).delete();
        } catch (e) {}
    }
    appState.tasks = appState.tasks.filter(t => t.id !== id);
    renderTasks();
    showToast('Task deleted', 'success');
}

function filterTasks(filter) {
    appState.taskFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
    renderTasks();
}

// ============================================
// Notes Functions
// ============================================

function renderNotes() {
    document.getElementById('notes-grid').innerHTML = appState.notes.map(n => `
        <div class="note-card" data-id="${n.id}" style="border-color:${n.color}">
            <div class="note-header">
                <div class="note-color" style="background:${n.color}" onclick="changeNoteColor('${n.id}')"></div>
                <button class="note-delete" onclick="deleteNote('${n.id}')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                    </svg>
                </button>
            </div>
            <textarea class="note-title" rows="1" onchange="updateNoteField('${n.id}','title',this.value)">${escapeHtml(n.title)}</textarea>
            <textarea class="note-content" rows="4" onchange="updateNoteField('${n.id}','content',this.value)">${escapeHtml(n.content)}</textarea>
        </div>
    `).join('');
}

async function addNote() {
    const colors = ['#d596ff', '#8eacff', '#FFC857', '#FF4E4E', '#16a34a'];
    const note = {
        title: 'New Note',
        content: 'Start writing...',
        color: colors[Math.floor(Math.random() * colors.length)],
        tags: [],
        createdAt: new Date()
    };
    
    if (currentUser && db) {
        try {
            const ref = await db.collection('users').doc(currentUser.uid).collection('notes').add({
                ...note,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            note.id = ref.id;
        } catch (e) {}
    } else {
        note.id = Date.now().toString();
    }
    
    appState.notes.unshift(note);
    renderNotes();
    showToast('Note created! ✨', 'success');
}

async function updateNoteField(id, field, value) {
    const note = appState.notes.find(n => n.id === id);
    if (note) {
        note[field] = value;
        
        if (appState.noteUpdateTimers[id]) {
            clearTimeout(appState.noteUpdateTimers[id]);
        }
        
        appState.noteUpdateTimers[id] = setTimeout(async () => {
            if (currentUser && db) {
                try {
                    await db.collection('users').doc(currentUser.uid).collection('notes').doc(id).update({
                        [field]: value
                    });
                } catch (e) {
                    console.error('Error updating note:', e);
                }
            }
        }, 1000);
    }
}

async function changeNoteColor(id) {
    const colors = ['#d596ff', '#8eacff', '#FFC857', '#FF4E4E', '#16a34a'];
    const note = appState.notes.find(n => n.id === id);
    if (note) {
        const idx = colors.indexOf(note.color);
        note.color = colors[(idx + 1) % colors.length];
        
        if (currentUser && db) {
            try {
                await db.collection('users').doc(currentUser.uid).collection('notes').doc(id).update({ color: note.color });
            } catch (e) {}
        }
        renderNotes();
    }
}

async function deleteNote(id) {
    if (currentUser && db) {
        try {
            await db.collection('users').doc(currentUser.uid).collection('notes').doc(id).delete();
        } catch (e) {}
    }
    appState.notes = appState.notes.filter(n => n.id !== id);
    renderNotes();
    showToast('Note deleted', 'success');
}

// ============================================
// Calendar Functions
// ============================================

async function addCalendarEvent() {
    const title = prompt('Event title:');
    if (!title) return;

    const dateStr = prompt('Event date (YYYY-MM-DD):', 
        `${appState.currentYear}-${String(appState.currentMonth + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`);
    if (!dateStr) return;

    const startTime = prompt('Start time (HH:MM in 24-hour format):', '09:00');
    if (!startTime) return;

    const endTime = prompt('End time (HH:MM in 24-hour format):', '10:00');
    if (!endTime) return;

    const description = prompt('Event description (optional):') || '';

    const event = {
        title,
        date: dateStr,
        startTime,
        endTime,
        description,
        createdAt: new Date()
    };

    if (currentUser && db) {
        try {
            const ref = await db.collection('users').doc(currentUser.uid).collection('calendarEvents').add({
                ...event,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            event.id = ref.id;
        } catch (e) {
            console.error('Error saving event:', e);
        }
    } else {
        event.id = Date.now().toString();
    }

    appState.calendarEvents.push(event);
    renderCalendar();
    showToast('Event added! 📅', 'success');
}

async function deleteCalendarEvent(eventId) {
    if (!confirm('Are you sure you want to delete this event?')) {
        return;
    }

    if (currentUser && db) {
        try {
            await db.collection('users').doc(currentUser.uid).collection('calendarEvents').doc(eventId).delete();
        } catch (e) {
            console.error('Error deleting event:', e);
        }
    }

    appState.calendarEvents = appState.calendarEvents.filter(e => e.id !== eventId);
    renderCalendar();
    
    if (selectedDate) {
        showEventsForDate(selectedDate);
    }
    
    showToast('Event deleted! 🗑️', 'success');
}

function renderCalendar() {
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    document.getElementById('calendar-title').textContent = `${monthNames[appState.currentMonth]} ${appState.currentYear}`;
    
    const firstDay = new Date(appState.currentYear, appState.currentMonth, 1);
    const lastDay = new Date(appState.currentYear, appState.currentMonth + 1, 0);
    const prevLastDay = new Date(appState.currentYear, appState.currentMonth, 0);
    
    const firstDayOfWeek = firstDay.getDay();
    const lastDateOfMonth = lastDay.getDate();
    const prevLastDate = prevLastDay.getDate();
    
    let html = '';
    const dayHeaders = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    dayHeaders.forEach(d => html += `<div class="calendar-day-header">${d}</div>`);
    
    for (let i = firstDayOfWeek; i > 0; i--) {
        html += `<div class="calendar-day other-month"><span class="calendar-day-number">${prevLastDate-i+1}</span></div>`;
    }
    
    const today = new Date();
    for (let day = 1; day <= lastDateOfMonth; day++) {
        const isToday = day === today.getDate() && appState.currentMonth === today.getMonth() && appState.currentYear === today.getFullYear();
        
        // Check for events on this day
        const dateStr = `${appState.currentYear}-${String(appState.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const eventsOnDay = appState.calendarEvents.filter(event => event.date === dateStr);
        
        const hasEvents = eventsOnDay.length > 0;
        const dots = hasEvents ? `<div class="calendar-day-dots">
            <div class="calendar-dot calendar-event"></div>
            ${eventsOnDay.length > 1 ? `<span style="font-size:10px;color:var(--lavender)">+${eventsOnDay.length - 1}</span>` : ''}
        </div>` : '';
        
        html += `<div class="calendar-day ${isToday?'today':''}" onclick="showEventsForDate('${dateStr}')" style="cursor:pointer;">
            <span class="calendar-day-number">${day}</span>
            ${dots}
        </div>`;
    }
    
    const remaining = 42 - (firstDayOfWeek + lastDateOfMonth);
    for (let i = 1; i <= remaining; i++) {
        html += `<div class="calendar-day other-month"><span class="calendar-day-number">${i}</span></div>`;
    }
    
    document.getElementById('calendar-grid').innerHTML = html;
}

function showEventsForDate(dateStr) {
    selectedDate = dateStr;
    const [year, month, day] = dateStr.split('-').map(Number);
    
    const eventsOnDay = appState.calendarEvents.filter(event => event.date === dateStr);
    
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    document.getElementById('selected-date-title').textContent = `Events on ${monthNames[month - 1]} ${day}, ${year}`;
    
    const panel = document.getElementById('calendar-events-panel');
    const eventsList = document.getElementById('calendar-events-list');
    
    if (eventsOnDay.length === 0) {
        eventsList.innerHTML = '<p style="text-align:center;color:var(--medium-gray);padding:2rem">No events on this day</p>';
    } else {
        eventsList.innerHTML = eventsOnDay.map(event => {
            return `
                <div class="calendar-event-item">
                    <div class="calendar-event-content">
                        <div class="calendar-event-title">${escapeHtml(event.title)}</div>
                        <div class="calendar-event-time">${event.startTime} - ${event.endTime}</div>
                        ${event.description ? `<div class="calendar-event-description">${escapeHtml(event.description)}</div>` : ''}
                    </div>
                    <button class="calendar-event-delete" onclick="deleteCalendarEvent('${event.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                        </svg>
                    </button>
                </div>
            `;
        }).join('');
    }
    
    panel.style.display = 'block';
}

async function changeMonth(delta) {
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
    document.getElementById('resources-list').innerHTML = appState.resources.map(r => `
        <div class="resource-item" data-id="${r.id}">
            <div class="resource-header">
                <a href="${escapeHtml(r.url)}" target="_blank" class="resource-title">${escapeHtml(r.title)}</a>
                <div style="display:flex;gap:0.5rem">
                    <button class="resource-edit" onclick="editResource('${r.id}')" style="color:var(--mint);padding:0.25rem;cursor:pointer;background:none;border:none">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>
                        </svg>
                    </button>
                    <button class="resource-delete" onclick="deleteResource('${r.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                        </svg>
                    </button>
                </div>
            </div>
            <a href="${escapeHtml(r.url)}" target="_blank" class="resource-url">${escapeHtml(r.url)}</a>
            <p class="resource-description">${escapeHtml(r.description)}</p>
        </div>
    `).join('');
}

async function addResource() {
    const title = prompt('Enter resource title:');
    if (!title) return;
    
    const url = prompt('Enter resource URL:');
    if (!url) return;
    
    const description = prompt('Enter resource description:') || '';
    
    const resource = { title, url, description, createdAt: new Date() };
    
    if (currentUser && db) {
        try {
            const ref = await db.collection('users').doc(currentUser.uid).collection('resources').add({
                ...resource,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            resource.id = ref.id;
        } catch (e) {}
    } else {
        resource.id = Date.now().toString();
    }
    
    appState.resources.unshift(resource);
    renderResources();
    showToast('Resource added! 📚', 'success');
}

async function editResource(id) {
    const resource = appState.resources.find(r => r.id === id);
    if (!resource) return;
    
    const title = prompt('Enter resource title:', resource.title);
    if (!title) return;
    
    const url = prompt('Enter resource URL:', resource.url);
    if (!url) return;
    
    const description = prompt('Enter resource description:', resource.description) || '';
    
    resource.title = title;
    resource.url = url;
    resource.description = description;
    
    if (currentUser && db) {
        try {
            await db.collection('users').doc(currentUser.uid).collection('resources').doc(id).update({
                title, url, description
            });
        } catch (e) {}
    }
    
    renderResources();
    showToast('Resource updated! ✨', 'success');
}

async function deleteResource(id) {
    if (currentUser && db) {
        try {
            await db.collection('users').doc(currentUser.uid).collection('resources').doc(id).delete();
        } catch (e) {}
    }
    appState.resources = appState.resources.filter(r => r.id !== id);
    renderResources();
    showToast('Resource deleted', 'success');
}

// ============================================
// Dashboard Functions
// ============================================

function updateDashboard() {
    document.getElementById('total-sessions').textContent = appState.sessionCount;
    
    const hours = Math.floor(appState.totalStudyTime / 60);
    const streak = Math.min(Math.floor(hours / 2), 30);
    document.getElementById('study-streak').textContent = streak + ' days';
    document.getElementById('total-hours').textContent = hours + 'h';
    
    const canvas = document.getElementById('weekly-chart');
    if (canvas && canvas.getContext) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);
        
        const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        const maxValue = Math.max(...appState.weeklyData, 1);
        const barWidth = width / days.length - 20;
        
        appState.weeklyData.forEach((value, index) => {
            const barHeight = (value / maxValue) * (height - 40);
            const x = index * (width / days.length) + 10;
            const y = height - barHeight - 20;
            
            const gradient = ctx.createLinearGradient(0, y, 0, height - 20);
            gradient.addColorStop(0, '#d596ff');
            gradient.addColorStop(1, '#8eacff');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, barWidth, barHeight);
            
            ctx.fillStyle = '#A1A1A1';
            ctx.font = '12px Comfortaa';
            ctx.textAlign = 'center';
            ctx.fillText(days[index], x + barWidth / 2, height - 5);
            
            ctx.fillStyle = '#373737';
            ctx.fillText(value.toString(), x + barWidth / 2, y - 5);
        });
    }
}

// ============================================
// Leaderboard Functions
// ============================================

function formatHoursMinutesFromHoursValue(hoursValue) {
    const hoursFloat = Number(hoursValue) || 0;
    const totalMinutes = Math.round(hoursFloat * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return { hours, minutes, totalMinutes };
}

async function renderLeaderboard() {
    const list = document.getElementById('leaderboard-list');
    list.innerHTML = '<p style="text-align:center;color:var(--medium-gray);padding:2rem">Loading...</p>';

    if (!db) {
        list.innerHTML = '<p style="text-align:center;color:var(--coral-red);padding:2rem">Database not ready.</p>';
        return;
    }

    try {
        const snapshot = await db.collection('users').get();

        if (snapshot.empty) {
            list.innerHTML = '<p style="text-align:center;color:var(--medium-gray);padding:2rem">No users yet. Complete a study session to join!</p>';
            return;
        }

        const users = [];
        snapshot.forEach(doc => {
            const data = doc.data() || {};
            const rawHours = data.hours ?? data.totalHours ?? data.studyHours ?? data.total_time_hours ?? 0;
            const { hours, minutes, totalMinutes } = formatHoursMinutesFromHoursValue(rawHours);

            users.push({
                id: doc.id,
                name: data.name || data.displayName || data.email || 'Anonymous',
                sessions: data.sessions || 0,
                hours,
                minutes,
                totalMinutes,
                isCurrentUser: (currentUser && doc.id === currentUser.uid)
            });
        });

        users.sort((a, b) => b.totalMinutes - a.totalMinutes);
        users.forEach((u, idx) => u.rank = idx + 1);

        const TOP_N = 20;
        const displayUsers = users.slice(0, TOP_N);

        if (currentUser) {
            const currentUserInTop = displayUsers.some(u => u.isCurrentUser);
            if (!currentUserInTop) {
                const me = users.find(u => u.isCurrentUser);
                if (me) displayUsers.push(me);
            }
        }

        list.innerHTML = displayUsers.map(u => `
            <div class="leaderboard-item ${u.rank<=3 ? 'top-3' : ''} ${u.isCurrentUser ? 'current-user' : ''}">
                <div class="leaderboard-rank">${u.rank}</div>
                <div class="leaderboard-info">
                    <div class="leaderboard-name">${escapeHtml(u.name)}${u.isCurrentUser ? ' (You)' : ''}</div>
                    <div class="leaderboard-stats">${u.sessions} sessions • ${u.hours}h ${u.minutes}m total</div>
                </div>
                <div class="leaderboard-score">${u.totalMinutes} min</div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading leaderboard:', error);
        list.innerHTML = '<p style="text-align:center;color:var(--coral-red);padding:2rem">Error loading leaderboard.</p>';
    }
}

// ============================================
// Study Coach Functions
// ============================================

function initializeStudyCoach() {
    const messages = [
        "You're doing amazing! Keep it up! 🌟",
        "Every minute counts toward your goals!",
        "Remember: Progress, not perfection!",
        "Take breaks to recharge! 🧠",
        "Stay hydrated and stretch!"
    ];
    
    setInterval(() => {
        const msg = messages[Math.floor(Math.random() * messages.length)];
        document.getElementById('coach-message').textContent = msg;
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
// Settings Functions
// ============================================

function openSettingsDialog() {
    document.getElementById('settings-dialog').style.display = 'block';
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

async function saveSettings() {
    appState.settings.workDuration = parseInt(document.getElementById('work-duration').value);
    appState.settings.shortBreak = parseInt(document.getElementById('short-break').value);
    appState.settings.longBreak = parseInt(document.getElementById('long-break').value);
    appState.settings.sessionsBeforeLongBreak = parseInt(document.getElementById('sessions-before-long').value);
    appState.settings.autoStartBreaks = document.getElementById('auto-start-breaks').checked;
    appState.settings.autoStartWork = document.getElementById('auto-start-work').checked;
    
    if (currentUser && db) await saveSettingsToFirebase();
    
    if (!appState.timerRunning) {
        appState.timeLeft = getDuration(appState.timerMode);
        updateTimerDisplay();
    }
    
    closeSettingsDialog();
    showToast('Settings saved! ✨', 'success');
}

// ============================================
// Utility Functions
// ============================================

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✓' : '⚠';
    toast.innerHTML = `<div class="toast-icon">${icon}</div><div class="toast-message">${escapeHtml(message)}</div>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => container.removeChild(toast), 300);
    }, 3000);
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ============================================
// Global Function Exports
// ============================================

window.toggleTask = toggleTask;
window.deleteTask = deleteTask;
window.updateNoteField = updateNoteField;
window.changeNoteColor = changeNoteColor;
window.deleteNote = deleteNote;
window.editResource = editResource;
window.deleteResource = deleteResource;
window.showEventsForDate = showEventsForDate;
window.deleteCalendarEvent = deleteCalendarEvent;


function showCelebration() {
    const cel = document.getElementById('celebration');
    cel.innerHTML = '';
    for (let i = 0; i < 12; i++) {
        const spark = document.createElement('div');
        spark.innerHTML = '✨';
        spark.style.cssText = 'position:absolute;font-size:24px;top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none';
        const angle = (i / 12) * Math.PI * 2;
        const x = Math.cos(angle) * 150;
        const y = Math.sin(angle) * 150;
        cel.appendChild(spark);
        spark.animate([
            { transform: 'translate(-50%,-50%) scale(0)', opacity: 1 },
            { transform: `translate(calc(-50% + ${x}px),calc(-50% + ${y}px)) scale(1)`, opacity: 0.5 },
            { transform: `translate(calc(-50% + ${x}px),calc(-50% + ${y}px)) scale(0)`, opacity: 0 }
        ], { duration: 1500, easing: 'ease-out' });
    }
    setTimeout(() => cel.innerHTML = '', 1500);
}

// ============================================
// Tasks Functions
// ============================================

function renderTasks() {
    const filtered = appState.tasks.filter(t => {
        if (appState.taskFilter === 'active') return !t.completed;
        if (appState.taskFilter === 'completed') return t.completed;
        return true;
    });
    
    document.getElementById('tasks-list').innerHTML = filtered.map(t => `
        <div class="task-item ${t.completed?'completed':''}" data-id="${t.id}">
            <input type="checkbox" class="task-checkbox" ${t.completed?'checked':''} onchange="toggleTask('${t.id}')">
            <div class="task-content">
                <div class="task-title">${escapeHtml(t.title)}</div>
                <div class="task-meta">
                    <span class="task-badge ${t.priority}">${t.priority}</span>
                    ${t.dueDate?`<span class="task-badge">Due: ${t.dueDate}</span>`:''}
                    ${t.category?`<span class="task-badge">${escapeHtml(t.category)}</span>`:''}
                </div>
            </div>
            <button class="task-delete" onclick="deleteTask('${t.id}')">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                </svg>
            </button>
        </div>
    `).join('');
}

async function addTask() {
    const input = document.getElementById('new-task-input');
    const priority = document.getElementById('new-task-priority');
    const title = input.value.trim();
    
    if (!title) {
        showToast('Please enter a task title', 'error');
        return;
    }
    
    const task = { title, completed: false, priority: priority.value, createdAt: new Date() };
    
    if (currentUser && db) {
        try {
            const ref = await db.collection('users').doc(currentUser.uid).collection('tasks').add({
                ...task,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            task.id = ref.id;
        } catch (e) {}
    } else {
        task.id = Date.now().toString();
    }
    
    appState.tasks.unshift(task);
    input.value = '';
    priority.value = 'medium';
    renderTasks();
    showToast('Task added! ✨', 'success');
}

async function toggleTask(id) {
    const task = appState.tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        if (currentUser && db) {
            try {
                await db.collection('users').doc(currentUser.uid).collection('tasks').doc(id).update({ completed: task.completed });
            }
            catch(error){}
        }
    }
}
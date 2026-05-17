const API_URL = '/api/tasks';
let useLocalStorage = false; // Flag to fall back to LocalStorage

// DOM Elements
const sectionItems = document.querySelectorAll('.sidebar-menu li[data-section]');
const filterItems = document.querySelectorAll('#filter-list li');
const tasksList = document.getElementById('tasks-list');
const currentSectionTitle = document.getElementById('current-section-title');
const taskCount = document.getElementById('task-count');
const searchInput = document.getElementById('search-input');
const themeToggle = document.getElementById('theme-toggle');

const dashboardView = document.getElementById('dashboard-view');
const tasksView = document.getElementById('tasks-view');

const dashTotal = document.getElementById('dash-total');
const dashCompleted = document.getElementById('dash-completed');
const dashPending = document.getElementById('dash-pending');
const dashProductivity = document.getElementById('dash-productivity');

const dashDailyBar = document.getElementById('dash-daily-bar');
const dashDailyText = document.getElementById('dash-daily-text');
const dashDailyStats = document.getElementById('dash-daily-stats');
const dashWeeklyBar = document.getElementById('dash-weekly-bar');
const dashWeeklyText = document.getElementById('dash-weekly-text');
const dashWeeklyStats = document.getElementById('dash-weekly-stats');
const dashMonthlyBar = document.getElementById('dash-monthly-bar');
const dashMonthlyText = document.getElementById('dash-monthly-text');
const dashMonthlyStats = document.getElementById('dash-monthly-stats');
const dashYearlyBar = document.getElementById('dash-yearly-bar');
const dashYearlyText = document.getElementById('dash-yearly-text');
const dashYearlyStats = document.getElementById('dash-yearly-stats');

const dashUpcomingList = document.getElementById('dash-upcoming-list');

// Modal Elements
const modal = document.getElementById('task-modal');
const addTaskBtn = document.getElementById('add-task-btn');
const closeModal = document.getElementById('close-modal');
const cancelBtn = document.getElementById('cancel-btn');
const taskForm = document.getElementById('task-form');
const modalTitle = document.getElementById('modal-title');

// State
let tasks = [];
let currentSection = 'Dashboard';
let currentFilter = 'All';
let searchQuery = '';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchTasks();
    
    // Check saved theme
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
        themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }
});

// Load Tasks from LocalStorage Fallback
function loadFromLocalStorage() {
    useLocalStorage = true;
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
    }
    renderTasks();
}

// Save to LocalStorage Fallback
function saveToLocalStorage() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Fetch tasks from API
async function fetchTasks() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("API not available");
        const data = await res.json();
        if (data.message === 'success') {
            tasks = data.data;
            renderTasks();
        }
    } catch (err) {
        console.log('Falling back to LocalStorage');
        loadFromLocalStorage();
    }
}

// Render Tasks based on state
function renderTasks() {
    if (currentSection === 'Dashboard') {
        renderDashboard();
        return;
    }
    
    tasksList.innerHTML = '';
    
    // Helper to evaluate completion strictly
    const isTaskCompleted = (task) => task.completed === 1 || task.completed === true || task.completed === "1" || task.completed === "true";

    let filteredTasks = tasks.filter(task => currentSection === 'All' || task.section === currentSection);
    
    if (currentFilter === 'Pending') {
        filteredTasks = filteredTasks.filter(task => !isTaskCompleted(task));
    } else if (currentFilter === 'Completed') {
        filteredTasks = filteredTasks.filter(task => isTaskCompleted(task));
    }
    
    if (searchQuery) {
        filteredTasks = filteredTasks.filter(task => 
            task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
            (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }

    taskCount.textContent = `${filteredTasks.length} tasks`;

    if (filteredTasks.length === 0) {
        tasksList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                <i class="fa-solid fa-clipboard-list" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                <p>No tasks found in this section.</p>
            </div>
        `;
        return;
    }

    filteredTasks.forEach(task => {
        const isCompleted = isTaskCompleted(task);
        const taskEl = document.createElement('div');
        taskEl.className = `task-card ${isCompleted ? 'completed' : ''}`;
        taskEl.innerHTML = `
            <div class="task-checkbox">
                <i class="fa-solid fa-check"></i>
            </div>
            <div class="task-content">
                <div class="task-title">${escapeHTML(task.title)}</div>
                ${task.description ? `<div class="task-desc">${escapeHTML(task.description)}</div>` : ''}
                <div class="task-meta">
                    <span class="tag date"><i class="fa-regular fa-calendar"></i> ${task.date}</span>
                    <span class="tag priority-${task.priority}">${task.priority}</span>
                </div>
            </div>
            <div class="task-actions">
                <button class="icon-btn edit-btn"><i class="fa-solid fa-pen"></i></button>
                <button class="icon-btn delete-btn" style="color: var(--danger-color);"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
        
        // Add event listeners securely
        const checkbox = taskEl.querySelector('.task-checkbox');
        checkbox.addEventListener('click', () => toggleTaskStatus(task.id, !isCompleted));
        
        const editBtn = taskEl.querySelector('.edit-btn');
        editBtn.addEventListener('click', () => openEditModal(task.id));
        
        const deleteBtn = taskEl.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => deleteTask(task.id));

        tasksList.appendChild(taskEl);
    });
}

// Add or Update Task
taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('task-id').value;
    const taskData = {
        title: document.getElementById('task-title').value,
        description: document.getElementById('task-desc').value,
        date: document.getElementById('task-date').value,
        priority: document.getElementById('task-priority').value,
        section: document.getElementById('task-section').value
    };

    if (useLocalStorage) {
        if (id) {
            const index = tasks.findIndex(t => String(t.id) === String(id));
            if (index !== -1) tasks[index] = { ...tasks[index], ...taskData };
        } else {
            const newId = tasks.length > 0 ? Math.max(...tasks.map(t => parseInt(t.id) || 0)) + 1 : 1;
            tasks.push({ id: String(newId), ...taskData, completed: false });
        }
        saveToLocalStorage();
        renderTasks();
        closeModalFunc();
        return;
    }

    try {
        if (id) {
            await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData)
            });
        } else {
            await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData)
            });
        }
        closeModalFunc();
        fetchTasks();
    } catch (err) {
        console.error('Error saving task:', err);
    }
});

// Toggle Task Status
window.toggleTaskStatus = async function(id, completed) {
    if (useLocalStorage) {
        const index = tasks.findIndex(t => String(t.id) === String(id));
        if (index !== -1) {
            tasks[index].completed = completed;
            saveToLocalStorage();
            renderTasks();
        }
        return;
    }

    try {
        await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed: completed ? 1 : 0 })
        });
        fetchTasks();
    } catch (err) {
        console.error('Error updating task status:', err);
    }
};

// Delete Task
window.deleteTask = async function(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        if (useLocalStorage) {
            tasks = tasks.filter(t => String(t.id) !== String(id));
            saveToLocalStorage();
            renderTasks();
            return;
        }

        try {
            await fetch(`${API_URL}/${id}`, {
                method: 'DELETE'
            });
            fetchTasks();
        } catch (err) {
            console.error('Error deleting task:', err);
        }
    }
};

// UI Event Listeners

const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const closeSidebarBtn = document.getElementById('close-sidebar-btn');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');

function toggleSidebar() {
    sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('open');
}

if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', toggleSidebar);
if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', toggleSidebar);
if (sidebarOverlay) sidebarOverlay.addEventListener('click', toggleSidebar);

function closeSidebarOnMobile() {
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('open');
    }
}

// Sections
sectionItems.forEach(item => {
    item.addEventListener('click', () => {
        sectionItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        currentSection = item.dataset.section;
        
        if (currentSection === 'Dashboard') {
            dashboardView.classList.remove('hidden');
            tasksView.classList.add('hidden');
        } else {
            dashboardView.classList.add('hidden');
            tasksView.classList.remove('hidden');
            currentSectionTitle.textContent = currentSection === 'All' ? 'All Tasks' : `${currentSection} Tasks`;
        }
        
        renderTasks();
        closeSidebarOnMobile();
    });
});

// Filters
filterItems.forEach(item => {
    item.addEventListener('click', () => {
        filterItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        currentFilter = item.dataset.filter;
        renderTasks();
        closeSidebarOnMobile();
    });
});

// Search
searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderTasks();
});

// Modal Logic
addTaskBtn.addEventListener('click', () => {
    taskForm.reset();
    document.getElementById('task-id').value = '';
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('task-date').value = today;
    
    // Set default section to current selected section
    const defaultSection = (currentSection === 'Dashboard' || currentSection === 'All') ? 'Daily' : currentSection;
    document.getElementById('task-section').value = defaultSection;

    modalTitle.textContent = 'Add New Task';
    modal.classList.remove('hidden');
});

window.openEditModal = function(id) {
    const task = tasks.find(t => String(t.id) === String(id));
    if (task) {
        document.getElementById('task-id').value = task.id;
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-desc').value = task.description || '';
        document.getElementById('task-date').value = task.date;
        document.getElementById('task-priority').value = task.priority;
        document.getElementById('task-section').value = task.section;
        
        modalTitle.textContent = 'Edit Task';
        modal.classList.remove('hidden');
    }
};

function closeModalFunc() {
    modal.classList.add('hidden');
}

closeModal.addEventListener('click', closeModalFunc);
cancelBtn.addEventListener('click', closeModalFunc);
modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModalFunc();
});

// Theme Toggle
themeToggle.addEventListener('click', () => {
    if (document.body.classList.contains('light-mode')) {
        document.body.classList.replace('light-mode', 'dark-mode');
        themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
        localStorage.setItem('theme', 'dark');
    } else {
        document.body.classList.replace('dark-mode', 'light-mode');
        themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
        localStorage.setItem('theme', 'light');
    }
});

// Utility
function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// Render Dashboard Statistics
function renderDashboard() {
    const isTaskCompleted = (t) => t.completed === 1 || t.completed === true || t.completed === "1" || t.completed === "true";

    const total = tasks.length;
    const completed = tasks.filter(isTaskCompleted).length;
    const pending = total - completed;
    const productivity = total === 0 ? 0 : Math.round((completed / total) * 100);

    dashTotal.textContent = total;
    dashCompleted.textContent = completed;
    dashPending.textContent = pending;
    dashProductivity.textContent = `${productivity}%`;

    // Progress calculations
    const calculateProgress = (sectionName) => {
        const secTasks = tasks.filter(t => t.section === sectionName);
        const secTotal = secTasks.length;
        const secCompleted = secTasks.filter(isTaskCompleted).length;
        const secPending = secTotal - secCompleted;
        const percent = secTotal === 0 ? 0 : Math.round((secCompleted / secTotal) * 100);
        return { total: secTotal, completed: secCompleted, pending: secPending, percent };
    };

    const daily = calculateProgress('Daily');
    dashDailyText.textContent = `${daily.percent}%`;
    dashDailyStats.textContent = `(${daily.completed} completed, ${daily.pending} pending)`;
    dashDailyBar.style.width = `${daily.percent}%`;

    const weekly = calculateProgress('Weekly');
    dashWeeklyText.textContent = `${weekly.percent}%`;
    dashWeeklyStats.textContent = `(${weekly.completed} completed, ${weekly.pending} pending)`;
    dashWeeklyBar.style.width = `${weekly.percent}%`;

    const monthly = calculateProgress('Monthly');
    dashMonthlyText.textContent = `${monthly.percent}%`;
    dashMonthlyStats.textContent = `(${monthly.completed} completed, ${monthly.pending} pending)`;
    dashMonthlyBar.style.width = `${monthly.percent}%`;

    const yearly = calculateProgress('Yearly');
    dashYearlyText.textContent = `${yearly.percent}%`;
    dashYearlyStats.textContent = `(${yearly.completed} completed, ${yearly.pending} pending)`;
    dashYearlyBar.style.width = `${yearly.percent}%`;

    // Upcoming Deadlines
    const pendingTasks = tasks.filter(t => !isTaskCompleted(t) && t.date);
    pendingTasks.sort((a, b) => new Date(a.date) - new Date(b.date));
    const upcoming = pendingTasks.slice(0, 4);

    dashUpcomingList.innerHTML = '';
    if (upcoming.length === 0) {
        dashUpcomingList.innerHTML = '<p style="color: var(--text-secondary); font-size: 14px;">No upcoming deadlines.</p>';
    } else {
        upcoming.forEach(task => {
            const dateStr = new Date(task.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            dashUpcomingList.innerHTML += `
                <div class="upcoming-item">
                    <div class="upcoming-item-left">
                        <div class="upcoming-title">${escapeHTML(task.title)}</div>
                        <div class="upcoming-date"><i class="fa-regular fa-clock"></i> ${dateStr}</div>
                    </div>
                    <span class="tag priority-${task.priority}">${task.priority}</span>
                </div>
            `;
        });
    }
}

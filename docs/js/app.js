const API_URL = '/api/tasks';
let useLocalStorage = false; // Flag to fall back to LocalStorage

// DOM Elements
const sectionItems = document.querySelectorAll('#section-list li');
const filterItems = document.querySelectorAll('#filter-list li');
const tasksList = document.getElementById('tasks-list');
const currentSectionTitle = document.getElementById('current-section-title');
const taskCount = document.getElementById('task-count');
const searchInput = document.getElementById('search-input');
const themeToggle = document.getElementById('theme-toggle');

// Modal Elements
const modal = document.getElementById('task-modal');
const addTaskBtn = document.getElementById('add-task-btn');
const closeModal = document.getElementById('close-modal');
const cancelBtn = document.getElementById('cancel-btn');
const taskForm = document.getElementById('task-form');
const modalTitle = document.getElementById('modal-title');

// State
let tasks = [];
let currentSection = 'Daily';
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
    tasksList.innerHTML = '';
    
    let filteredTasks = tasks.filter(task => task.section === currentSection);
    
    if (currentFilter === 'Pending') {
        filteredTasks = filteredTasks.filter(task => !task.completed);
    } else if (currentFilter === 'Completed') {
        filteredTasks = filteredTasks.filter(task => task.completed);
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
        const taskEl = document.createElement('div');
        taskEl.className = `task-card ${task.completed ? 'completed' : ''}`;
        taskEl.innerHTML = `
            <div class="task-checkbox" onclick="toggleTaskStatus(${task.id}, ${!task.completed})">
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
                <button class="icon-btn" onclick="openEditModal(${task.id})"><i class="fa-solid fa-pen"></i></button>
                <button class="icon-btn" onclick="deleteTask(${task.id})" style="color: var(--danger-color);"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
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
            const taskId = parseInt(id, 10);
            const index = tasks.findIndex(t => t.id === taskId);
            if (index !== -1) tasks[index] = { ...tasks[index], ...taskData };
        } else {
            const newId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
            tasks.push({ id: newId, ...taskData, completed: false });
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
        const index = tasks.findIndex(t => t.id === id);
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
            tasks = tasks.filter(t => t.id !== id);
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

// Sections
sectionItems.forEach(item => {
    item.addEventListener('click', () => {
        sectionItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        currentSection = item.dataset.section;
        currentSectionTitle.textContent = `${currentSection} Tasks`;
        renderTasks();
    });
});

// Filters
filterItems.forEach(item => {
    item.addEventListener('click', () => {
        filterItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        currentFilter = item.dataset.filter;
        renderTasks();
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
    document.getElementById('task-section').value = currentSection;

    modalTitle.textContent = 'Add New Task';
    modal.classList.remove('hidden');
});

window.openEditModal = function(id) {
    const task = tasks.find(t => t.id === id);
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
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

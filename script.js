/**
 * ==============================================================================
 * Task-Drill — Pure Vanilla JavaScript
 * ==============================================================================
 * This script handles all the interactive behavior of Task-Drill:
 * 1. State Management: Keeping an array of task objects in memory.
 * 2. LocalStorage: Automatically saving & restoring tasks on page load.
 * 3. Adding, toggling, and deleting tasks.
 * 4. Filtering tasks (All, Pending, Completed).
 * 5. Dynamic counters and UI updates.
 * ==============================================================================
 */

// ------------------------------------------------------------------------------
// 1. DOM Elements (Connecting HTML to JavaScript)
// ------------------------------------------------------------------------------
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const formError = document.getElementById('form-error');
const taskList = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');
const filterButtons = document.querySelectorAll('.tab-btn');
const progressPill = document.getElementById('progress-pill');
const progressText = document.getElementById('progress-text');
const remainingCount = document.getElementById('remaining-count');
const clearCompletedBtn = document.getElementById('clear-completed-btn');

// Count Badges
const countAll = document.getElementById('count-all');
const countPending = document.getElementById('count-pending');
const countCompleted = document.getElementById('count-completed');

// ------------------------------------------------------------------------------
// 2. State & Storage Key
// ------------------------------------------------------------------------------
const STORAGE_KEY = 'task_drill_items_v1';

// Load existing tasks from localStorage (or start with an empty array if none exist)
let tasks = loadTasksFromStorage();

// Current active filter: 'all' | 'pending' | 'completed'
let currentFilter = 'all';

// ------------------------------------------------------------------------------
// 3. LocalStorage Helpers
// ------------------------------------------------------------------------------
/**
 * Loads tasks array from the browser's localStorage.
 * Uses JSON.parse to convert the stored JSON string back into a JavaScript array.
 */
function loadTasksFromStorage() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (!rawData) return [];
    const parsed = JSON.parse(rawData);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error reading tasks from localStorage:', error);
    return [];
  }
}

/**
 * Saves the current tasks array into localStorage as a JSON string.
 */
function saveTasksToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Error saving tasks to localStorage:', error);
  }
}

// ------------------------------------------------------------------------------
// 4. Core Task Actions
// ------------------------------------------------------------------------------

/**
 * Adds a new task object to the state and re-renders the UI.
 * @param {string} text - The title of the task
 */
function addTask(text) {
  const trimmed = text.trim();
  if (!trimmed) {
    showError('Please enter a task description.');
    return;
  }

  // Clear any existing error message
  clearError();

  // Create task object with unique timestamp ID
  const newTask = {
    id: Date.now().toString(),
    text: trimmed,
    completed: false,
    createdAt: new Date().toISOString()
  };

  // Add to the front of the array (most recent first)
  tasks.unshift(newTask);

  // Persist to localStorage & refresh UI
  saveTasksToStorage();
  render();

  // Reset input field and refocus
  taskInput.value = '';
  taskInput.focus();
}

/**
 * Toggles the completed status of a task by its ID.
 * @param {string} taskId
 */
function toggleTask(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    task.completed = !task.completed;
    saveTasksToStorage();
    render();
  }
}

/**
 * Deletes a single task by its ID.
 * @param {string} taskId
 */
function deleteTask(taskId) {
  tasks = tasks.filter(t => t.id !== taskId);
  saveTasksToStorage();
  render();
}

/**
 * Removes all tasks that are currently marked as completed.
 */
function clearCompletedTasks() {
  const hasCompleted = tasks.some(t => t.completed);
  if (!hasCompleted) return;

  tasks = tasks.filter(t => !t.completed);
  saveTasksToStorage();
  render();
}

// ------------------------------------------------------------------------------
// 5. Rendering & UI Updates
// ------------------------------------------------------------------------------

/**
 * Filters tasks based on the currently selected tab.
 */
function getFilteredTasks() {
  switch (currentFilter) {
    case 'pending':
      return tasks.filter(t => !t.completed);
    case 'completed':
      return tasks.filter(t => t.completed);
    case 'all':
    default:
      return tasks;
  }
}

/**
 * Creates and returns an HTML <li> element for a single task.
 * Uses safe text content assignment to prevent XSS.
 * @param {Object} task
 */
function createTaskElement(task) {
  const li = document.createElement('li');
  li.className = `task-item ${task.completed ? 'completed' : ''}`;
  li.dataset.id = task.id;

  // Left Section (Checkbox + Title)
  const leftDiv = document.createElement('div');
  leftDiv.className = 'task-left';

  // Custom Checkbox Label
  const checkboxLabel = document.createElement('label');
  checkboxLabel.className = 'custom-checkbox';
  checkboxLabel.setAttribute('aria-label', `Mark "${task.text}" as ${task.completed ? 'pending' : 'completed'}`);

  const checkboxInput = document.createElement('input');
  checkboxInput.type = 'checkbox';
  checkboxInput.checked = task.completed;
  checkboxInput.dataset.action = 'toggle';

  const checkboxMark = document.createElement('span');
  checkboxMark.className = 'checkbox-mark';
  checkboxMark.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  `;

  checkboxLabel.appendChild(checkboxInput);
  checkboxLabel.appendChild(checkboxMark);

  // Task text span
  const textSpan = document.createElement('span');
  textSpan.className = 'task-text';
  textSpan.textContent = task.text;

  leftDiv.appendChild(checkboxLabel);
  leftDiv.appendChild(textSpan);

  // Delete Button
  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'delete-btn';
  deleteBtn.dataset.action = 'delete';
  deleteBtn.setAttribute('aria-label', `Delete task: ${task.text}`);
  deleteBtn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      <line x1="10" y1="11" x2="10" y2="17"></line>
      <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
  `;

  li.appendChild(leftDiv);
  li.appendChild(deleteBtn);

  return li;
}

/**
 * Main render function. Updates the list, counters, empty states, and badges.
 */
function render() {
  const totalCount = tasks.length;
  const completedTasks = tasks.filter(t => t.completed);
  const pendingTasks = tasks.filter(t => !t.completed);

  // 1. Update filter counts
  countAll.textContent = totalCount;
  countPending.textContent = pendingTasks.length;
  countCompleted.textContent = completedTasks.length;

  // 2. Update remaining counter & progress text
  remainingCount.textContent = `${pendingTasks.length} ${pendingTasks.length === 1 ? 'task' : 'tasks'} remaining`;
  progressText.textContent = `${completedTasks.length}/${totalCount} completed`;

  // 3. Render filtered task items
  const filtered = getFilteredTasks();
  taskList.innerHTML = ''; // Clear previous items

  if (filtered.length === 0) {
    emptyState.classList.add('visible');
    // Adjust empty state message according to filter
    const emptyTitle = emptyState.querySelector('.empty-title');
    const emptyDesc = emptyState.querySelector('.empty-desc');
    if (currentFilter === 'completed') {
      emptyTitle.textContent = 'No completed tasks yet';
      emptyDesc.textContent = 'Finish some tasks to see them here!';
    } else if (currentFilter === 'pending') {
      emptyTitle.textContent = 'All caught up!';
      emptyDesc.textContent = 'No pending tasks left to do.';
    } else {
      emptyTitle.textContent = 'No tasks found';
      emptyDesc.textContent = 'Type a task above and press "Add" or hit Enter!';
    }
  } else {
    emptyState.classList.remove('visible');
    const fragment = document.createDocumentFragment();
    filtered.forEach(task => {
      fragment.appendChild(createTaskElement(task));
    });
    taskList.appendChild(fragment);
  }
}

// ------------------------------------------------------------------------------
// 6. Error Feedback Helpers
// ------------------------------------------------------------------------------
function showError(message) {
  formError.textContent = message;
  formError.classList.add('active');
  taskInput.focus();
}

function clearError() {
  formError.textContent = '';
  formError.classList.remove('active');
}

// ------------------------------------------------------------------------------
// 7. Event Listeners
// ------------------------------------------------------------------------------

// Form Submission (Add Task)
taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  addTask(taskInput.value);
});

// Clear error message when user starts typing again
taskInput.addEventListener('input', () => {
  if (formError.classList.contains('active')) {
    clearError();
  }
});

// Event Delegation on Task List (Handles both Checkbox toggling and Delete click)
taskList.addEventListener('click', (e) => {
  const target = e.target;
  const taskItem = target.closest('.task-item');
  if (!taskItem) return;

  const taskId = taskItem.dataset.id;

  // If clicked on or inside delete button
  if (target.closest('[data-action="delete"]')) {
    deleteTask(taskId);
    return;
  }
});

// Handle Checkbox Change (separate change event for accessibility)
taskList.addEventListener('change', (e) => {
  if (e.target.dataset.action === 'toggle') {
    const taskItem = e.target.closest('.task-item');
    if (taskItem) {
      toggleTask(taskItem.dataset.id);
    }
  }
});

// Filter Tab Buttons Click
filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    filterButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    currentFilter = button.dataset.filter;
    render();
  });
});

// Clear Completed Tasks Button
clearCompletedBtn.addEventListener('click', () => {
  clearCompletedTasks();
});

// ------------------------------------------------------------------------------
// 8. Initial App Launch
// ------------------------------------------------------------------------------
render();

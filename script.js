/**
 * ==============================================================================
 * STUDENT PRODUCTIVITY DASHBOARD - JAVASCRIPT (script.js)
 * ==============================================================================
 * This script controls all the interactive behavior of our dashboard:
 * 1. Managing application state (list of tasks & active filter).
 * 2. Saving and loading tasks from the browser's localStorage.
 * 3. Adding, toggling completion, and deleting tasks.
 * 4. Filtering tasks (All, Pending, Completed).
 * 5. Calculating and updating dashboard statistics and progress bar.
 * 6. Rendering the task list dynamically into the HTML DOM.
 * ==============================================================================
 */

// ------------------------------------------------------------------------------
// 1. CONSTANTS & DOM ELEMENT SELECTIONS
// ------------------------------------------------------------------------------
// The key used to store our tasks JSON string inside browser localStorage
const STORAGE_KEY = "student_dashboard_tasks_v1";

// Cache references to HTML elements we need to interact with
const taskForm = document.getElementById("taskForm");
const taskTitleInput = document.getElementById("taskTitle");
const taskDescriptionInput = document.getElementById("taskDescription");
const titleError = document.getElementById("titleError");

const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const emptyStateTitle = document.getElementById("emptyStateTitle");
const emptyStateSubtitle = document.getElementById("emptyStateSubtitle");

// Stats elements
const totalTasksCount = document.getElementById("totalTasksCount");
const pendingTasksCount = document.getElementById("pendingTasksCount");
const completedTasksCount = document.getElementById("completedTasksCount");
const progressPercentage = document.getElementById("progressPercentage");
const progressBarFill = document.getElementById("progressBarFill");

// Filter badge count elements
const filterCountAll = document.getElementById("filterCountAll");
const filterCountPending = document.getElementById("filterCountPending");
const filterCountCompleted = document.getElementById("filterCountCompleted");
const filterButtons = document.querySelectorAll(".filter-btn");

// Header date element
const currentDateDisplay = document.getElementById("currentDateDisplay");

// ------------------------------------------------------------------------------
// 2. APPLICATION STATE
// ------------------------------------------------------------------------------
// 'tasks' will hold our array of task objects in memory.
// Each task object looks like:
// {
//   id: 1730812345678,
//   title: "Read Biology Chapter 3",
//   description: "Pages 45-60, take summary notes",
//   completed: false,
//   createdAt: "Nov 5, 2026"
// }
let tasks = [];

// 'currentFilter' tracks which tab the user is viewing: 'all' | 'pending' | 'completed'
let currentFilter = "all";

// ------------------------------------------------------------------------------
// 3. INITIALIZATION
// ------------------------------------------------------------------------------
// Runs when the web page finishes loading
function init() {
    displayCurrentDate();
    loadTasks();
    setupEventListeners();
    render();
}

/**
 * Formats and displays the current date in the header
 * Example output: "Thursday, Nov 5, 2026"
 */
function displayCurrentDate() {
    const today = new Date();
    const options = { 
        weekday: "long", 
        year: "numeric", 
        month: "short", 
        day: "numeric" 
    };
    currentDateDisplay.textContent = today.toLocaleDateString("en-US", options);
}

// ------------------------------------------------------------------------------
// 4. LOCALSTORAGE MANAGEMENT
// ------------------------------------------------------------------------------
/**
 * Loads tasks from the browser's localStorage.
 * If the user is visiting for the very first time (no saved tasks found),
 * we provide a couple of starter tasks so the interface doesn't feel empty.
 */
function loadTasks() {
    try {
        const storedTasks = localStorage.getItem(STORAGE_KEY);
        
        if (storedTasks !== null) {
            // Parse the stored JSON string back into a JavaScript array
            tasks = JSON.parse(storedTasks);
        } else {
            // First-time visit: populate with sample student tasks
            tasks = [
                {
                    id: Date.now() - 2000,
                    title: "Welcome to your Student Dashboard! 🎓",
                    description: "Click the circle button on the left to mark tasks completed, or the trash icon on the right to delete.",
                    completed: false,
                    createdAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })
                },
                {
                    id: Date.now() - 1000,
                    title: "Review Mathematics Chapter 2 Notes",
                    description: "Practice problems 1 to 10 on quadratic equations.",
                    completed: true,
                    createdAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })
                }
            ];
            saveTasks();
        }
    } catch (error) {
        console.error("Error reading tasks from localStorage:", error);
        tasks = [];
    }
}

/**
 * Serializes the tasks array into a JSON string and saves it into localStorage.
 */
function saveTasks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
        console.error("Error saving tasks to localStorage:", error);
    }
}

// ------------------------------------------------------------------------------
// 5. CORE TASK ACTIONS (ADD, TOGGLE, DELETE, FILTER)
// ------------------------------------------------------------------------------
/**
 * Adds a new task from the form inputs
 */
function handleAddTask(event) {
    // Prevent the default browser behavior of submitting a form (which reloads the page)
    event.preventDefault();

    const title = taskTitleInput.value.trim();
    const description = taskDescriptionInput.value.trim();

    // Validation: Title is required
    if (title === "") {
        taskTitleInput.classList.add("input-error");
        titleError.classList.add("show");
        taskTitleInput.focus();
        return;
    }

    // Reset validation errors
    taskTitleInput.classList.remove("input-error");
    titleError.classList.remove("show");

    // Format creation date: e.g. "Nov 5"
    const creationDate = new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
    });

    // Create a new task object
    const newTask = {
        id: Date.now(), // Unique ID generated from current timestamp in milliseconds
        title: title,
        description: description,
        completed: false,
        createdAt: creationDate
    };

    // Add new task to the beginning of the array (most recent first)
    tasks.unshift(newTask);

    // Save changes to localStorage
    saveTasks();

    // Reset form inputs
    taskForm.reset();
    taskTitleInput.focus();

    // Re-render the UI
    render();
}

/**
 * Toggles a task between completed and pending
 * @param {number} taskId - The unique ID of the task
 */
function toggleTaskCompletion(taskId) {
    tasks = tasks.map((task) => {
        if (task.id === taskId) {
            return { ...task, completed: !task.completed };
        }
        return task;
    });

    saveTasks();
    render();
}

/**
 * Deletes a task by its ID
 * @param {number} taskId - The unique ID of the task to delete
 */
function deleteTask(taskId) {
    // Filter out the task with matching id
    tasks = tasks.filter((task) => task.id !== taskId);

    saveTasks();
    render();
}

/**
 * Sets the active filter ('all', 'pending', or 'completed')
 * @param {string} filterName
 */
function setFilter(filterName) {
    currentFilter = filterName;

    // Update active class on filter buttons
    filterButtons.forEach((btn) => {
        const isActive = btn.dataset.filter === filterName;
        btn.classList.toggle("active", isActive);
        btn.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    render();
}

// ------------------------------------------------------------------------------
// 6. STATS & PROGRESS CALCULATION
// ------------------------------------------------------------------------------
/**
 * Computes counts for total, pending, and completed tasks,
 * and updates the stats cards and progress bar.
 */
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const pending = total - completed;

    // Update numbers on stats cards
    totalTasksCount.textContent = total;
    pendingTasksCount.textContent = pending;
    completedTasksCount.textContent = completed;

    // Update numbers inside the filter tabs
    filterCountAll.textContent = `(${total})`;
    filterCountPending.textContent = `(${pending})`;
    filterCountCompleted.textContent = `(${completed})`;

    // Calculate percentage (avoid division by 0)
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    progressPercentage.textContent = `${percentage}%`;
    progressBarFill.style.width = `${percentage}%`;
}

// ------------------------------------------------------------------------------
// 7. RENDERING (UPDATING THE DOM)
// ------------------------------------------------------------------------------
/**
 * Main render function: updates stats and builds the list of task HTML elements.
 */
function render() {
    // 1. Update statistics
    updateStats();

    // 2. Filter tasks according to currently active filter
    let filteredTasks = tasks;
    if (currentFilter === "pending") {
        filteredTasks = tasks.filter((t) => !t.completed);
    } else if (currentFilter === "completed") {
        filteredTasks = tasks.filter((t) => t.completed);
    }

    // 3. Clear existing list items in the DOM
    taskList.innerHTML = "";

    // 4. Check if empty in this view
    if (filteredTasks.length === 0) {
        showEmptyState();
        return;
    }

    // Hide empty state if there are tasks to display
    emptyState.classList.remove("show");

    // 5. Render each task item
    filteredTasks.forEach((task) => {
        const taskItem = createTaskElement(task);
        taskList.appendChild(taskItem);
    });
}

/**
 * Creates and returns an `<li>` element representing a single task
 * Uses safe DOM methods (createElement, textContent) to prevent XSS issues.
 * @param {Object} task
 * @returns {HTMLLIElement}
 */
function createTaskElement(task) {
    const li = document.createElement("li");
    li.className = `task-item ${task.completed ? "completed" : ""}`;
    li.setAttribute("data-id", task.id);

    // 1. Checkbox / toggle button
    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = "task-checkbox-btn";
    toggleBtn.setAttribute("aria-label", task.completed ? "Mark task as pending" : "Mark task as completed");
    toggleBtn.innerHTML = task.completed ? "✓" : "";
    toggleBtn.addEventListener("click", () => toggleTaskCompletion(task.id));

    // 2. Task content wrapper
    const contentDiv = document.createElement("div");
    contentDiv.className = "task-content";

    // Title
    const titleH3 = document.createElement("h3");
    titleH3.className = "task-title";
    titleH3.textContent = task.title;
    contentDiv.appendChild(titleH3);

    // Description (only rendered if user provided one)
    if (task.description && task.description.trim() !== "") {
        const descP = document.createElement("p");
        descP.className = "task-description";
        descP.textContent = task.description;
        contentDiv.appendChild(descP);
    }

    // Metadata row (status badge and creation date)
    const metaDiv = document.createElement("div");
    metaDiv.className = "task-meta";

    const statusBadge = document.createElement("span");
    statusBadge.className = `task-status-badge ${task.completed ? "completed" : "pending"}`;
    statusBadge.textContent = task.completed ? "Completed" : "Pending";

    const dateSpan = document.createElement("span");
    dateSpan.className = "task-date";
    dateSpan.textContent = `• Added ${task.createdAt}`;

    metaDiv.appendChild(statusBadge);
    metaDiv.appendChild(dateSpan);
    contentDiv.appendChild(metaDiv);

    // 3. Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "task-delete-btn";
    deleteBtn.setAttribute("aria-label", `Delete task: ${task.title}`);
    deleteBtn.title = "Delete task";
    deleteBtn.innerHTML = "🗑️";
    deleteBtn.addEventListener("click", () => deleteTask(task.id));

    // Assemble the list item
    li.appendChild(toggleBtn);
    li.appendChild(contentDiv);
    li.appendChild(deleteBtn);

    return li;
}

/**
 * Customizes and shows the empty state based on current filter
 */
function showEmptyState() {
    emptyState.classList.add("show");

    if (tasks.length === 0) {
        emptyStateTitle.textContent = "No tasks yet! 📚";
        emptyStateSubtitle.textContent = "Use the form on the left to add your first study task or assignment.";
    } else if (currentFilter === "pending") {
        emptyStateTitle.textContent = "All caught up! 🎉";
        emptyStateSubtitle.textContent = "You don't have any pending tasks right now. Great job!";
    } else if (currentFilter === "completed") {
        emptyStateTitle.textContent = "No completed tasks yet";
        emptyStateSubtitle.textContent = "Check off tasks as you finish them to track your productivity.";
    }
}

// ------------------------------------------------------------------------------
// 8. EVENT LISTENERS
// ------------------------------------------------------------------------------
function setupEventListeners() {
    // Form submission
    taskForm.addEventListener("submit", handleAddTask);

    // Clear validation error dynamically when user starts typing in title input
    taskTitleInput.addEventListener("input", () => {
        if (taskTitleInput.value.trim() !== "") {
            taskTitleInput.classList.remove("input-error");
            titleError.classList.remove("show");
        }
    });

    // Filter tab button clicks
    filterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const selectedFilter = button.dataset.filter;
            setFilter(selectedFilter);
        });
    });
}

// ------------------------------------------------------------------------------
// 9. START THE APPLICATION
// ------------------------------------------------------------------------------
// Wait until the DOM content is fully loaded before initializing
document.addEventListener("DOMContentLoaded", init);

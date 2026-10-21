const STORAGE_KEY = "taskly-tasks-v1";

const taskForm = document.querySelector("#task-form");
const taskInput = document.querySelector("#task-input");
const taskList = document.querySelector("#task-list");
const emptyState = document.querySelector("#empty-state");
const emptyTitle = document.querySelector("#empty-title");
const emptyDescription = document.querySelector("#empty-description");
const formMessage = document.querySelector("#form-message");
const totalCount = document.querySelector("#total-count");
const activeCount = document.querySelector("#active-count");
const completedCount = document.querySelector("#completed-count");
const remainingLabel = document.querySelector("#remaining-label");
const clearCompletedButton = document.querySelector("#clear-completed");
const filterButtons = document.querySelectorAll("[data-filter]");
const editDialog = document.querySelector("#edit-dialog");
const editForm = document.querySelector("#edit-form");
const editInput = document.querySelector("#edit-input");
const cancelEditButton = document.querySelector("#cancel-edit");

let tasks = loadTasks();
let currentFilter = "all";
let editingTaskId = null;

document.querySelector("#today-date").textContent = new Intl.DateTimeFormat(
  "en", { weekday: "short", month: "short", day: "numeric" }
).format(new Date());

function loadTasks() {
  try {
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    if (!savedTasks) return [];
    const parsedTasks = JSON.parse(savedTasks);
    if (!Array.isArray(parsedTasks)) return [];
    return parsedTasks.filter(task =>
      task &&
      typeof task.id === "string" &&
      typeof task.text === "string" &&
      typeof task.completed === "boolean"
    );
  } catch (error) {
    console.warn("Could not load saved tasks:", error);
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    return true;
  } catch (error) {
    console.warn("Could not save tasks:", error);
    showMessage("Your browser couldn't save changes. Check your storage settings.");
    return false;
  }
}

function showMessage(message = "") {
  formMessage.textContent = message;
}

function createTask(text) {
  return {
    id: (window.crypto && crypto.randomUUID)
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    text,
    completed: false,
    createdAt: new Date().toISOString()
  };
}

function addTask(text) {
  tasks.unshift(createTask(text));
  saveTasks();
  renderTasks();
}

function toggleTask(id) {
  tasks = tasks.map(task =>
    task.id === id ? { ...task, completed: !task.completed } : task
  );
  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter(task => task.id !== id);
  saveTasks();
  renderTasks();
}

function updateTask(id, newText) {
  tasks = tasks.map(task =>
    task.id === id ? { ...task, text: newText } : task
  );
  saveTasks();
  renderTasks();
}

function getVisibleTasks() {
  if (currentFilter === "active") return tasks.filter(task => !task.completed);
  if (currentFilter === "completed") return tasks.filter(task => task.completed);
  return tasks;
}

function makeActionButton(label, symbol, className, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `icon-btn ${className || ""}`.trim();
  button.textContent = symbol;
  button.setAttribute("aria-label", label);
  button.title = label;
  button.addEventListener("click", onClick);
  return button;
}

function renderTasks() {
  taskList.replaceChildren();
  const visibleTasks = getVisibleTasks();

  visibleTasks.forEach(task => {
    const item = document.createElement("li");
    item.className = `task-item${task.completed ? " completed" : ""}`;

    const checkButton = document.createElement("button");
    checkButton.type = "button";
    checkButton.className = "check-btn";
    checkButton.textContent = task.completed ? "✓" : "";
    checkButton.setAttribute("aria-label", task.completed ? `Mark "${task.text}" as active` : `Complete "${task.text}"`);
    checkButton.setAttribute("aria-pressed", String(task.completed));
    checkButton.addEventListener("click", () => toggleTask(task.id));

    const text = document.createElement("span");
    text.className = "task-text";
    text.textContent = task.text;

    const actions = document.createElement("div");
    actions.className = "task-actions";
    actions.append(
      makeActionButton("Edit task", "✎", "", () => openEditDialog(task)),
      makeActionButton("Delete task", "×", "delete", () => deleteTask(task.id))
    );

    item.append(checkButton, text, actions);
    taskList.append(item);
  });

  const activeTasks = tasks.filter(task => !task.completed).length;
  const doneTasks = tasks.length - activeTasks;

  totalCount.textContent = tasks.length;
  activeCount.textContent = activeTasks;
  completedCount.textContent = doneTasks;
  remainingLabel.textContent = activeTasks === 0
    ? (tasks.length ? "Everything is complete. Nice work!" : "You're all caught up.")
    : `${activeTasks} task${activeTasks === 1 ? "" : "s"} left to do`;

  clearCompletedButton.disabled = doneTasks === 0;
  clearCompletedButton.style.opacity = doneTasks === 0 ? ".45" : "1";
  clearCompletedButton.style.cursor = doneTasks === 0 ? "not-allowed" : "pointer";

  emptyState.hidden = visibleTasks.length > 0;
  if (visibleTasks.length === 0) {
    if (currentFilter === "active" && tasks.length > 0) {
      emptyTitle.textContent = "No active tasks";
      emptyDescription.textContent = "Everything left to do is cleared. Enjoy the progress!";
    } else if (currentFilter === "completed" && tasks.length > 0) {
      emptyTitle.textContent = "Nothing completed yet";
      emptyDescription.textContent = "Finish a task and it will show up here.";
    } else {
      emptyTitle.textContent = "A fresh start";
      emptyDescription.textContent = "Add your first task above and take it one step at a time.";
    }
  }
}

function setFilter(filter) {
  currentFilter = filter;
  filterButtons.forEach(button => {
    const isActive = button.dataset.filter === filter;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  renderTasks();
}

function openEditDialog(task) {
  editingTaskId = task.id;
  editInput.value = task.text;
  if (typeof editDialog.showModal === "function") {
    editDialog.showModal();
  } else {
    const newText = window.prompt("Edit task", task.text);
    if (newText !== null && newText.trim()) updateTask(task.id, newText.trim());
  }
  editInput.focus();
  editInput.select();
}

taskForm.addEventListener("submit", event => {
  event.preventDefault();
  const text = taskInput.value.trim();
  if (!text) {
    showMessage("Please enter a task before adding it.");
    taskInput.focus();
    return;
  }
  addTask(text);
  taskInput.value = "";
  showMessage("");
  taskInput.focus();
});

filterButtons.forEach(button => {
  button.addEventListener("click", () => setFilter(button.dataset.filter));
});

clearCompletedButton.addEventListener("click", () => {
  const completedTasks = tasks.filter(task => task.completed).length;
  if (completedTasks === 0) return;
  tasks = tasks.filter(task => !task.completed);
  saveTasks();
  renderTasks();
});

editForm.addEventListener("submit", event => {
  event.preventDefault();
  const newText = editInput.value.trim();
  if (!newText || !editingTaskId) return;
  updateTask(editingTaskId, newText);
  editingTaskId = null;
  editDialog.close();
});

cancelEditButton.addEventListener("click", () => {
  editingTaskId = null;
  editDialog.close();
});

editDialog.addEventListener("close", () => {
  editingTaskId = null;
});

renderTasks();

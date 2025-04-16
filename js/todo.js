// API Base URL
const API_BASE_URL = 'https://api-todo-list-pbw.vercel.app';


// DOM Elements
const addTaskForm = document.getElementById('addTaskForm');
const newTaskInput = document.getElementById('newTask');
const taskList = document.getElementById('taskList');
const editModal = document.getElementById('editModal');
const editTaskForm = document.getElementById('editTaskForm');
const editTaskText = document.getElementById('editTaskText');
const editTaskId = document.getElementById('editTaskId');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userFullName = document.getElementById('userFullName');
const pendingTasksCount = document.getElementById('pendingTasks');
const completedTasksCount = document.getElementById('completedTasks');
const alertBox = document.getElementById('alertBox');

// Authentication Check
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    console.log('Token used:', token); // ✅ tambahkan di sini
if (!token) {
    throw new Error('No authentication token found');
}

    const userId = localStorage.getItem('userId');
    const fullName = localStorage.getItem('fullName');
    
    if (!token || !userId) {
        console.error('Not authenticated, redirecting to login');
        localStorage.clear(); // Clear potentially corrupted auth data
        window.location.href = 'index.html';
        return;
    }
    
    // Display user's name
    if (userFullName) {
        userFullName.textContent = fullName || 'User';
    }
    
    // Load tasks
    loadTasks();
});

// Handle authentication errors
function handleAuthError(error) {
    console.error('Authentication error:', error);
    showAlert('Your session has expired. Please login again.', 'error');
    
    // Clear storage and redirect
    setTimeout(() => {
        localStorage.clear();
        window.location.href = 'index.html';
    }, 2000);
}

// Handle logout
if (logoutBtn) {
    logoutBtn.addEventListener('click', async function() {
        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('token');
        
        if (!userId || !token) {
            localStorage.clear();
            window.location.href = 'index.html';
            return;
        }
        
        try {
            // Show loading
            showAlert('Logging out...', 'info');
            
            const response = await fetch(`${API_BASE_URL}/auth/logout/${userId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            // Clear local storage regardless of response
            localStorage.clear();
            
            // Redirect to login page
            window.location.href = 'index.html';
            
        } catch (error) {
            console.error('Logout error:', error);
            
            // Still clear local storage and redirect even if there's an error
            localStorage.clear();
            window.location.href = 'index.html';
        }
    });
}

// Load all tasks
async function loadTasks() {
    taskList.innerHTML = '<div class="flex justify-center items-center p-4"><p class="text-gray-500 italic">Loading tasks...</p></div>';
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }
        
        const response = await fetch(`${API_BASE_URL}/todo/getAllTodos`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 401 || response.status === 403) {
            handleAuthError('Unauthorized access');
            return;
        }
        
        if (!response.ok) {
            throw new Error('Failed to load tasks');
        }
        
        const data = await response.json();
        // Tambahkan console.log di sini untuk memeriksa struktur data
        console.log('Data yang diterima dari API:', JSON.stringify(data, null, 2));
        
        // Clear the loading message
        taskList.innerHTML = '';
        
        // Periksa apakah data.data ada dan memiliki panjang
        if (!data.data || data.data.length === 0) {
            taskList.innerHTML = '<div class="flex justify-center items-center p-4"><p class="text-gray-500 italic">No tasks yet. Add one above!</p></div>';
            updateTaskCounters(0, 0);
            return;
        }
        
        // Count completed and pending tasks
        let completedCount = 0;
        let pendingCount = 0;
        
        // Display tasks
        data.data.forEach(todo => {  // Ganti dari data.todos ke data.data
            if (todo.onCheckList) {
                completedCount++;
            } else {
                pendingCount++;
            }
            
            const taskElement = createTaskElement(todo);
            taskList.appendChild(taskElement);
        });
        
        updateTaskCounters(pendingCount, completedCount);
        
    } catch (error) {
        console.error('Error loading tasks:', error);
        
        if (error.message.includes('authentication') || error.message.includes('Unauthorized')) {
            handleAuthError(error);
        } else {
            taskList.innerHTML = '<div class="flex justify-center items-center p-4"><p class="text-red-500">Failed to load tasks. Please try again.</p></div>';
            showAlert('Failed to load tasks. Please refresh the page.', 'error');
        }
    }
}

// Create a task element
function createTaskElement(todo) {
    console.log('Membuat elemen untuk task:', todo);  // Cek data task yang diterima
    const taskItem = document.createElement('div');
    taskItem.className = 'flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200';
    taskItem.dataset.id = todo._id;
    
    // Left side with checkbox and task text
    const leftSide = document.createElement('div');
    leftSide.className = 'flex items-center';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'w-5 h-5 text-indigo-600 mr-3 cursor-pointer';
    checkbox.checked = todo.onCheckList;
    checkbox.addEventListener('change', () => toggleTaskStatus(todo._id, checkbox.checked));
    
    const taskText = document.createElement('span');
    taskText.className = todo.onCheckList ? 'task-done' : '';
    taskText.textContent = todo.text;
    
    leftSide.appendChild(checkbox);
    leftSide.appendChild(taskText);
    
    // Right side with edit and delete buttons
    const rightSide = document.createElement('div');
    rightSide.className = 'flex space-x-2';
    
    const editButton = document.createElement('button');
    editButton.className = 'p-2 text-indigo-600 hover:text-indigo-800';
    editButton.innerHTML = '<i class="fas fa-edit"></i>';
    editButton.addEventListener('click', () => openEditModal(todo));
    
    const deleteButton = document.createElement('button');
    deleteButton.className = 'p-2 text-red-600 hover:text-red-800';
    deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
    deleteButton.addEventListener('click', () => deleteTask(todo._id));
    
    rightSide.appendChild(editButton);
    rightSide.appendChild(deleteButton);
    
    // Assemble task item
    taskItem.appendChild(leftSide);
    taskItem.appendChild(rightSide);
    
    return taskItem;
}

// Update task counters
function updateTaskCounters(pending, completed) {
    if (pendingTasksCount) {
        pendingTasksCount.textContent = `${pending} task${pending !== 1 ? 's' : ''} pending`;
    }
    if (completedTasksCount) {
        completedTasksCount.textContent = `${completed} task${completed !== 1 ? 's' : ''} completed`;
    }
}

// Add a new task
if (addTaskForm) {
    addTaskForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const taskText = newTaskInput.value.trim();
        
        if (!taskText) return;
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }
            
            // Show loading
            showAlert('Adding task...', 'info');
            
            const response = await fetch(`${API_BASE_URL}/todo/createTodo`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ text: taskText })
            });
            
            if (response.status === 401 || response.status === 403) {
                handleAuthError('Unauthorized access');
                return;
            }
            
            if (!response.ok) {
                throw new Error('Failed to add task');
            }
            
            // Clear input
            newTaskInput.value = '';
            
            // Tampilkan data response
            const result = await response.json();
            console.log('Hasil tambah task:', result);

            // Reload tasks to show the new one
            loadTasks();

            showAlert('Task added successfully!', 'success');
            
        } catch (error) {
            console.error('Error adding task:', error);
            
            if (error.message.includes('authentication') || error.message.includes('Unauthorized')) {
                handleAuthError(error);
            } else {
                showAlert('Failed to add task. Please try again.', 'error');
            }
        }
    });
}

// Toggle task status (complete/incomplete)
async function toggleTaskStatus(taskId, isCompleted = true) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }
        
        const response = await fetch(`${API_BASE_URL}/todo/updateTodo/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                onCheckList: isCompleted 
            })
        });

        // Tambahkan ini setelah request:
        const resData = await response.json();
        console.log('Response dari updateTodo:', resData);
        
        if (response.status === 401 || response.status === 403) {
            handleAuthError('Unauthorized access');
            return;
        }
        
        if (!response.ok) {
            throw new Error('Failed to update task status');
        }
        
        // Update UI
        const taskItem = document.querySelector(`[data-id="${taskId}"]`);
        const taskText = taskItem.querySelector('span');
        
        if (isCompleted) {
            taskText.classList.add('task-done');
        } else {
            taskText.classList.remove('task-done');
        }
        
        // Update counters
        const completedTasks = document.querySelectorAll('input[type="checkbox"]:checked').length;
        const totalTasks = document.querySelectorAll('[data-id]').length;
        updateTaskCounters(totalTasks - completedTasks, completedTasks);
        
    } catch (error) {
        console.error('Error updating task status:', error);
        
        if (error.message.includes('authentication') || error.message.includes('Unauthorized')) {
            handleAuthError(error);
        } else {
            showAlert('Failed to update task status. Please try again.', 'error');
            // Reset UI to previous state
            loadTasks();
        }
    }
}

// Delete a task
async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }
        
        const response = await fetch(`${API_BASE_URL}/todo/deleteTodo/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 401 || response.status === 403) {
            handleAuthError('Unauthorized access');
            return;
        }
        
        if (!response.ok) {
            throw new Error('Failed to delete task');
        }
        
        // Remove task from UI
        const taskItem = document.querySelector(`[data-id="${taskId}"]`);
        taskItem.remove();
        
        // Update task counters
        const completedTasks = document.querySelectorAll('input[type="checkbox"]:checked').length;
        const totalTasks = document.querySelectorAll('[data-id]').length;
        
        if (totalTasks === 0) {
            taskList.innerHTML = '<div class="flex justify-center items-center p-4"><p class="text-gray-500 italic">No tasks yet. Add one above!</p></div>';
        }
        
        updateTaskCounters(totalTasks - completedTasks, completedTasks);
        
        showAlert('Task deleted successfully!', 'success');
        
    } catch (error) {
        console.error('Error deleting task:', error);
        
        if (error.message.includes('authentication') || error.message.includes('Unauthorized')) {
            handleAuthError(error);
        } else {
            showAlert('Failed to delete task. Please try again.', 'error');
        }
    }
}

// Open edit modal
function openEditModal(todo) {
    editTaskId.value = todo._id;
    editTaskText.value = todo.text;
    editModal.classList.remove('hidden');
    editModal.classList.add('flex');
    editTaskText.focus();
}

// Close edit modal
function closeEditModal() {
    editModal.classList.remove('flex');
    editModal.classList.add('hidden');
}

// Cancel edit button
if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', closeEditModal);
}

// Close modal when clicking outside
if (editModal) {
    editModal.addEventListener('click', function(e) {
        if (e.target === editModal) {
            closeEditModal();
        }
    });
}

// Handle edit form submission
if (editTaskForm) {
    editTaskForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const taskId = editTaskId.value;
        const newText = editTaskText.value.trim();

        // Validasi text kosong
        if (!newText) {
            showAlert("Task text cannot be empty.", "error");
            console.warn("⚠️ newText kosong!");
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            // Ambil status checkbox
            const taskElement = document.querySelector(`[data-id="${taskId}"]`);
            const checkbox = taskElement.querySelector('input[type="checkbox"]');
            const isChecked = checkbox.checked;

            // Log nilai akhir sebelum kirim
            console.log("Final payload:", {
                text: newText,
                onCheckList: isChecked
            });

            const response = await fetch(`${API_BASE_URL}/todo/updateTodo/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    text: newText,
                    onCheckList: true
                })
            });

            // Cek otorisasi
            if (response.status === 401 || response.status === 403) {
                handleAuthError('Unauthorized access');
                return;
            }

            // Cek jika gagal
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Failed response:', errorText);
                throw new Error(`Failed to update task: ${errorText}`);
            }

            // Update UI
            const taskText = taskElement.querySelector('span');
            taskText.textContent = newText;

            // Tutup modal dan refresh task list
            closeEditModal();
            loadTasks();

            showAlert('Task updated successfully!', 'success');
            
        } catch (error) {
            console.error('Error updating task:', error);

            if (error.message.includes('authentication') || error.message.includes('Unauthorized')) {
                handleAuthError(error);
            } else {
                showAlert('Failed to update task. Please try again.', 'error');
            }
        }
    });
}


// Show alert message
function showAlert(message, type) {
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `px-4 py-3 rounded-lg shadow-md transition-all ${
        type === 'success' ? 'bg-green-100 text-green-800 border-l-4 border-green-500' : 
        type === 'info' ? 'bg-blue-100 text-blue-800 border-l-4 border-blue-500' :
        'bg-red-100 text-red-800 border-l-4 border-red-500'
    }`;
    alert.textContent = message;
    
    // Clear existing alerts
    if (alertBox) {
        alertBox.innerHTML = '';
        alertBox.appendChild(alert);
        
        // Show alert
        alertBox.classList.remove('translate-x-full');
        
        // Hide alert after 3 seconds (except for loading messages)
        if (type !== 'info') {
            setTimeout(() => {
                alertBox.classList.add('translate-x-full');
            }, 3000);
        }
    }
}
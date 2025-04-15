// API Base URL
const API_BASE_URL = 'https://api-todo-list-pbw.vercel.app';

// DOM Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const togglePasswordBtn = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');
const alertBox = document.getElementById('alertBox');

// Check if user is already authenticated
document.addEventListener('DOMContentLoaded', function() {
    // If user has a token stored and we're not on the todo page, redirect to todo page
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const fullName = localStorage.getItem('fullName');
    
    if (token && userId && fullName) {
        const currentPath = window.location.pathname;
        if (!currentPath.includes('todo.html')) {
            window.location.href = 'todo.html';
        }
    }
});

// Toggle password visibility
if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // Toggle eye icon
        const icon = togglePasswordBtn.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    });
}

// Handle login form submission
if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }
            
            // Store authentication data
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.user._id);
            localStorage.setItem('fullName', data.user.fullName);
            
            // Show success message
            showAlert('Login successful! Redirecting...', 'success');
            
            // Redirect to todo page
            setTimeout(() => {
                window.location.href = 'todo.html';
            }, 1000);
            
        } catch (error) {
            showAlert(error.message, 'error');
        }
    });
}

// Handle registration form submission
if (registerForm) {
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fullName, email, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }
            
            // Show success message
            showAlert('Registration successful! Redirecting to login...', 'success');
            
            // Redirect to login page
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
            
        } catch (error) {
            showAlert(error.message, 'error');
        }
    });
}

// Show alert message
function showAlert(message, type) {
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `px-4 py-3 rounded-lg shadow-md transition-all ${
        type === 'success' ? 'bg-green-100 text-green-800 border-l-4 border-green-500' : 
        'bg-red-100 text-red-800 border-l-4 border-red-500'
    }`;
    alert.textContent = message;
    
    // Clear existing alerts
    alertBox.innerHTML = '';
    alertBox.appendChild(alert);
    
    // Show alert
    alertBox.classList.remove('translate-x-full');
    
    // Hide alert after 3 seconds
    setTimeout(() => {
        alertBox.classList.add('translate-x-full');
    }, 3000);
}

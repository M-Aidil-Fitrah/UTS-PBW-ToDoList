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
    
    if (token && userId) {
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
            // Display loading message
            showAlert('Logging in...', 'info');
            
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            // Get the response text first to inspect it
            const responseText = await response.text();
            console.log('Raw API Response:', responseText);
            
            // Try to parse as JSON if possible
            let data;
            try {
                data = JSON.parse(responseText);
                console.log('Parsed API Response:', data);
            } catch (parseError) {
                console.error('Error parsing JSON response:', parseError);
                throw new Error('Unable to parse server response');
            }
            
            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }
            
            // Check and handle different response structures
            // Some APIs return token directly in the root, others nested in data or user object
            let token = null;
            let userId = null;
            let fullName = 'User';
            
            if (data.token) {
                // Structure: { token: "...", user: { _id: "...", fullName: "..." } }
                token = data.token;
                if (data.user) {
                    userId = data.user._id || data.user.id;
                    fullName = data.user.fullName || data.user.name || 'User';
                } else if (data.userId || data._id) {
                    // Structure: { token: "...", userId: "...", fullName: "..." }
                    userId = data.userId || data._id || data.id;
                    fullName = data.fullName || data.name || 'User';
                }
            } else if (data.data && data.data.token) {
                // Structure: { data: { token: "...", user: {...} } }
                token = data.data.token;
                if (data.data.user) {
                    userId = data.data.user._id || data.data.user.id;
                    fullName = data.data.user.fullName || data.data.user.name || 'User';
                } else {
                    userId = data.data.userId || data.data._id || data.data.id;
                    fullName = data.data.fullName || data.data.name || 'User';
                }
            } else if (data.user && data.user.token) {
                // Structure: { user: { token: "...", _id: "..." } }
                token = data.user.token;
                userId = data.user._id || data.user.id;
                fullName = data.user.fullName || data.user.name || 'User';
            }
            
            // Validate we found a token
            if (!token) {
                console.error('Missing token in response:', data);
                throw new Error('Invalid response: Missing authentication token');
            }
            
            if (!userId) {
                console.error('Missing user ID in response:', data);
                throw new Error('Invalid response: Missing user ID');
            }
            
            // Store authentication data
            localStorage.setItem('token', token);
            localStorage.setItem('userId', userId);
            localStorage.setItem('fullName', fullName);
            
            console.log('Stored auth data:', { token, userId, fullName });
            
            // Show success message
            showAlert('Login successful! Redirecting...', 'success');
            
            // Redirect to todo page
            setTimeout(() => {
                window.location.href = 'todo.html';
            }, 1000);
            
        } catch (error) {
            console.error('Login error:', error);
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
        
        if (password.length < 8) {
            showAlert('Password must be at least 8 characters long', 'error');
            return;
        }
        
        try {
            // Display loading message
            showAlert('Creating account...', 'info');
            
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fullName, email, password })
            });
            
            // Get the response text first to inspect it
            const responseText = await response.text();
            console.log('Raw API Response:', responseText);
            
            // Try to parse as JSON if possible
            let data;
            try {
                data = JSON.parse(responseText);
                console.log('Parsed API Response:', data);
            } catch (parseError) {
                console.error('Error parsing JSON response:', parseError);
                if (response.ok) {
                    // If the response was OK but not valid JSON, still consider it a success
                    showAlert('Registration successful! Redirecting to login...', 'success');
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1500);
                    return;
                }
                throw new Error('Unable to parse server response');
            }
            
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
            console.error('Registration error:', error);
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
        type === 'info' ? 'bg-blue-100 text-blue-800 border-l-4 border-blue-500' :
        'bg-red-100 text-red-800 border-l-4 border-red-500'
    }`;
    alert.textContent = message;
    
    // Clear existing alerts
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
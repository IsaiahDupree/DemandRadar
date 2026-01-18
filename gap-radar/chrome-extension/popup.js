// GapRadar Chrome Extension - Popup Script
// Handles user authentication and actions

const API_BASE_URL = 'http://localhost:3945';

// DOM elements
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const signupLink = document.getElementById('signup-link');
const logoutBtn = document.getElementById('logout-btn');
const userEmailEl = document.getElementById('user-email');
const errorEl = document.getElementById('error');
const successEl = document.getElementById('success');

// Action buttons
const analyzePageBtn = document.getElementById('analyze-page-btn');
const saveGapBtn = document.getElementById('save-gap-btn');
const openDashboardBtn = document.getElementById('open-dashboard-btn');

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
});

// Check authentication status
async function checkAuth() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'get_auth' });

    if (response.success && response.token) {
      // User is authenticated
      showDashboard(response.token);
    } else {
      // User is not authenticated
      showLogin();
    }
  } catch (error) {
    console.error('Auth check error:', error);
    showLogin();
  }
}

// Show login section
function showLogin() {
  loginSection.classList.add('active');
  dashboardSection.classList.remove('active');
}

// Show dashboard section
function showDashboard(token) {
  loginSection.classList.remove('active');
  dashboardSection.classList.add('active');

  // Get user info from token (simplified - in production, decode JWT or fetch user)
  // For now, we'll just show a placeholder
  userEmailEl.textContent = 'Authenticated';
}

// Handle login form submission
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    hideMessages();

    // Call Supabase auth via API
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();

    // Store auth token
    await chrome.runtime.sendMessage({
      action: 'set_auth',
      token: data.token,
      userId: data.userId
    });

    showSuccess('Login successful!');
    setTimeout(() => {
      showDashboard(data.token);
    }, 500);

  } catch (error) {
    console.error('Login error:', error);
    showError(error.message);
  }
});

// Handle signup link
signupLink.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: `${API_BASE_URL}/auth/signup` });
});

// Handle logout
logoutBtn.addEventListener('click', async () => {
  try {
    await chrome.runtime.sendMessage({ action: 'logout' });
    showSuccess('Logged out successfully');
    setTimeout(() => {
      showLogin();
    }, 500);
  } catch (error) {
    console.error('Logout error:', error);
    showError('Logout failed');
  }
});

// Handle analyze page button
analyzePageBtn.addEventListener('click', async () => {
  try {
    hideMessages();

    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Send message to background to perform analysis
    const response = await chrome.runtime.sendMessage({
      action: 'quick_analysis',
      url: tab.url,
      selectedText: null
    });

    if (response.success) {
      showSuccess('Analysis started! Check your dashboard.');
    } else {
      throw new Error(response.error || 'Analysis failed');
    }
  } catch (error) {
    console.error('Analysis error:', error);
    showError(error.message);
  }
});

// Handle save gap button
saveGapBtn.addEventListener('click', async () => {
  showSuccess('Select text on the page and use the context menu to save a gap.');
  setTimeout(() => {
    window.close();
  }, 1500);
});

// Handle open dashboard button
openDashboardBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: `${API_BASE_URL}/dashboard` });
});

// Utility functions
function showError(message) {
  errorEl.textContent = message;
  errorEl.classList.add('active');
  successEl.classList.remove('active');
}

function showSuccess(message) {
  successEl.textContent = message;
  successEl.classList.add('active');
  errorEl.classList.remove('active');
}

function hideMessages() {
  errorEl.classList.remove('active');
  successEl.classList.remove('active');
}

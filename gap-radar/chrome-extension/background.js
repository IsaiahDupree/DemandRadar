// GapRadar Chrome Extension - Background Service Worker
// Handles authentication, context menus, and communication with the API

const API_BASE_URL = 'http://localhost:3945';
const STORAGE_KEYS = {
  AUTH_TOKEN: 'gapradar_auth_token',
  USER_ID: 'gapradar_user_id',
  API_URL: 'gapradar_api_url'
};

// Initialize extension on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('GapRadar extension installed');

  // Create context menu for quick analysis
  chrome.contextMenus.create({
    id: 'analyze-page',
    title: 'Analyze with GapRadar',
    contexts: ['page', 'selection']
  });

  chrome.contextMenus.create({
    id: 'save-gap',
    title: 'Save as Market Gap',
    contexts: ['selection']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'analyze-page') {
    handleQuickAnalysis(tab, info.selectionText);
  } else if (info.menuItemId === 'save-gap') {
    handleSaveGap(tab, info.selectionText);
  }
});

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);

  if (request.action === 'save_gap') {
    saveGap(request.data)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }

  if (request.action === 'get_auth') {
    getAuthToken()
      .then(token => sendResponse({ success: true, token }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'set_auth') {
    setAuthToken(request.token, request.userId)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'logout') {
    logout()
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'quick_analysis') {
    performQuickAnalysis(request.url, request.selectedText)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

// Quick analysis handler
async function handleQuickAnalysis(tab, selectionText) {
  try {
    const token = await getAuthToken();
    if (!token) {
      chrome.action.openPopup();
      return;
    }

    // Send message to content script to extract page data
    chrome.tabs.sendMessage(tab.id, {
      action: 'extract_page_data',
      selectedText: selectionText
    }, (response) => {
      if (response && response.success) {
        performQuickAnalysis(tab.url, response.data);
      }
    });
  } catch (error) {
    console.error('Quick analysis error:', error);
  }
}

// Save gap handler
async function handleSaveGap(tab, selectionText) {
  try {
    const token = await getAuthToken();
    if (!token) {
      chrome.action.openPopup();
      return;
    }

    const gapData = {
      url: tab.url,
      title: tab.title,
      selectedText: selectionText,
      timestamp: new Date().toISOString()
    };

    await saveGap(gapData);

    // Show success notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Gap Saved',
      message: 'Market gap saved to GapRadar'
    });
  } catch (error) {
    console.error('Save gap error:', error);
  }
}

// Perform quick analysis via API
async function performQuickAnalysis(url, data) {
  const token = await getAuthToken();
  const apiUrl = await getApiUrl();

  const response = await fetch(`${apiUrl}/api/niches/extract`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      url,
      data,
      source: 'chrome_extension'
    })
  });

  if (!response.ok) {
    throw new Error(`Analysis failed: ${response.statusText}`);
  }

  return await response.json();
}

// Save gap via API
async function saveGap(gapData) {
  const token = await getAuthToken();
  const apiUrl = await getApiUrl();

  const response = await fetch(`${apiUrl}/api/gaps`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(gapData)
  });

  if (!response.ok) {
    throw new Error(`Save failed: ${response.statusText}`);
  }

  return await response.json();
}

// Auth token management
async function getAuthToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.AUTH_TOKEN], (result) => {
      resolve(result[STORAGE_KEYS.AUTH_TOKEN] || null);
    });
  });
}

async function setAuthToken(token, userId) {
  return new Promise((resolve) => {
    chrome.storage.local.set({
      [STORAGE_KEYS.AUTH_TOKEN]: token,
      [STORAGE_KEYS.USER_ID]: userId
    }, resolve);
  });
}

async function logout() {
  return new Promise((resolve) => {
    chrome.storage.local.remove([STORAGE_KEYS.AUTH_TOKEN, STORAGE_KEYS.USER_ID], resolve);
  });
}

async function getApiUrl() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.API_URL], (result) => {
      resolve(result[STORAGE_KEYS.API_URL] || API_BASE_URL);
    });
  });
}

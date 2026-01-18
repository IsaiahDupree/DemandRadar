// GapRadar Chrome Extension - Content Script
// Runs on all pages to extract data and detect market gaps

console.log('GapRadar content script loaded');

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extract_page_data') {
    const data = extractGapData(request.selectedText);
    sendResponse({ success: true, data });
    return true;
  }
});

// Extract gap data from the current page
function extractGapData(selectedText = null) {
  const pageData = {
    url: window.location.href,
    title: document.title,
    selectedText: selectedText || window.getSelection().toString(),
    timestamp: new Date().toISOString(),
    metadata: {}
  };

  // Extract meta tags
  pageData.metadata.description = getMetaContent('description');
  pageData.metadata.keywords = getMetaContent('keywords');
  pageData.metadata.ogTitle = getMetaContent('og:title');
  pageData.metadata.ogDescription = getMetaContent('og:description');

  // Extract headings
  pageData.headings = extractHeadings();

  // Extract visible text (limited to first 2000 chars)
  pageData.visibleText = extractVisibleText().substring(0, 2000);

  // Detect page type
  pageData.pageType = detectPageType();

  // Extract structured data if available
  pageData.structuredData = extractStructuredData();

  return pageData;
}

// Get meta tag content
function getMetaContent(name) {
  const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
  return meta ? meta.getAttribute('content') : null;
}

// Extract all headings
function extractHeadings() {
  const headings = [];
  const headingElements = document.querySelectorAll('h1, h2, h3');

  headingElements.forEach((heading, index) => {
    if (index < 10) { // Limit to first 10 headings
      headings.push({
        level: heading.tagName,
        text: heading.textContent.trim()
      });
    }
  });

  return headings;
}

// Extract visible text from page
function extractVisibleText() {
  // Get text from main content area if possible
  const main = document.querySelector('main, article, [role="main"]');
  const textSource = main || document.body;

  // Clone the element to avoid modifying the DOM
  const clone = textSource.cloneNode(true);

  // Remove script and style elements
  const scripts = clone.querySelectorAll('script, style, noscript');
  scripts.forEach(el => el.remove());

  return clone.textContent.trim().replace(/\s+/g, ' ');
}

// Detect page type
function detectPageType() {
  const url = window.location.href.toLowerCase();
  const title = document.title.toLowerCase();

  // Check for common page types
  if (url.includes('/product/') || url.includes('/p/') || title.includes('product')) {
    return 'product';
  }

  if (url.includes('/pricing') || title.includes('pricing')) {
    return 'pricing';
  }

  if (url.includes('/blog/') || url.includes('/post/') || title.includes('blog')) {
    return 'blog';
  }

  if (url.includes('/about') || title.includes('about')) {
    return 'about';
  }

  if (url.includes('/contact') || title.includes('contact')) {
    return 'contact';
  }

  // Check for SaaS landing page indicators
  const hasSignup = document.querySelector('[href*="signup"], [href*="register"], button:contains("Get Started")');
  const hasPricing = document.querySelector('[href*="pricing"]');

  if (hasSignup && hasPricing) {
    return 'saas_landing';
  }

  return 'general';
}

// Extract structured data (JSON-LD)
function extractStructuredData() {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  const structuredData = [];

  scripts.forEach(script => {
    try {
      const data = JSON.parse(script.textContent);
      structuredData.push(data);
    } catch (e) {
      // Invalid JSON, skip
    }
  });

  return structuredData.length > 0 ? structuredData : null;
}

// Highlight text utility (can be used for visual feedback)
function highlightText(text) {
  if (!text) return;

  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.style.backgroundColor = '#fef3c7';
    span.style.padding = '2px 4px';
    span.style.borderRadius = '3px';

    try {
      range.surroundContents(span);

      // Remove highlight after 2 seconds
      setTimeout(() => {
        const parent = span.parentNode;
        while (span.firstChild) {
          parent.insertBefore(span.firstChild, span);
        }
        parent.removeChild(span);
      }, 2000);
    } catch (e) {
      // Selection spans multiple elements, can't highlight
      console.log('Cannot highlight selection');
    }
  }
}

// Show toast notification (injected into page)
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#10b981' : '#ef4444'};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { extractGapData };
}

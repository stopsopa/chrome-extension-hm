// This script runs in the context of web pages

// Import any dependencies (to be added if needed)
// import { someFunction } from './utils.js';

// All notification code has been removed
// No visual notifications will be shown on web pages when headers are applied

// Content script to log when headers are added to requests (invisible to users)
const observer = new PerformanceObserver((entries) => {
  entries.getEntries().forEach(entry => {
    if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') {
      console.log(`===== Header-enhanced request to: ${entry.name}`);
    }
  });
});

// Start observing resource timing entries
observer.observe({ entryTypes: ['resource'] });

// Send a message to the background script to get the current header rules
// This just keeps the message channel open without expecting a response
chrome.runtime.sendMessage({ action: 'getHeaderRules' });

// Export any functions that might be needed by other modules
// export { someFunction };
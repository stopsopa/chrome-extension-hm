// This content script runs in the ISOLATED world and handles communication with the extension

// Setup a listener for header updates from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "updateHeaders" && message.headers) {
    // Send only headers with first: false to the main world content script
    const filteredHeaders = {};

    Object.keys(message.headers).forEach((headerName) => {
      const headerConfig = message.headers[headerName];
      // Only pass headers with first: false
      if (headerConfig.first === false) {
        filteredHeaders[headerName] = headerConfig;
      }
    });

    // Send the filtered headers to the main world content script via custom event

    window.dispatchEvent(
      new CustomEvent("__extensionHeadersUpdate", {
        detail: filteredHeaders,
      })
    );

    sendResponse({ status: "Headers updated in main world", count: Object.keys(filteredHeaders).length });
  }

  if (message.action === 'forIsolated_enabled') {

    window.dispatchEvent(
      new CustomEvent("forContentScript_enabled", {
        detail: {
          enabled: message.enabled,
        },
      })
    );
  }

  return true; // Keep the message channel open for async responses
});

console.log("content-script-isolated.js loaded ");

// Send a message to the background script to get the current header rules
// This requests the current headers configuration
chrome.runtime.sendMessage({ action: "getHeaderRules" });

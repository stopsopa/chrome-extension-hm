// This content script runs in the ISOLATED world and handles communication with the extension

let loggingEnabled = true;
loggingEnabled = false;
function log(...args) {
  if (loggingEnabled) {
    window.dispatchEvent(
      new CustomEvent("log_content-script-isolated-js", {
        detail: args,
      })
    );
  }
}

// Log when the isolated script loads
log("start loading");

// Setup a listener for header updates from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Log all received messages
  log("Received message:", message);

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

  if (message.action === "forIsolated_enabled") {
    log("Received forIsolated_enabled event, enabled:", message.enabled);
    window.dispatchEvent(
      new CustomEvent("forContentScript_enabled", {
        detail: {
          enabled: message.enabled,
        },
      })
    );
    log("Dispatched forContentScript_enabled event to main world");
  }

  // Handle extension enabled state response from background
  if (message.action === "extensionEnabledState") {
    log("Received extensionEnabledState from background, enabled:", message.enabled);
    window.dispatchEvent(
      new CustomEvent("extensionEnabledState", {
        detail: {
          enabled: message.enabled,
        },
      })
    );
    log("Dispatched extensionEnabledState event to main world");
  }

  return true; // Keep the message channel open for async responses
});

// Listen for request from main world to get extension enabled state
window.addEventListener("getExtensionEnabled", function () {
  log("Received getExtensionEnabled request from content-script.js");
  chrome.runtime.sendMessage({ action: "getExtensionEnabled" });
});

// Send a message to the background script to get the current header rules
// This requests the current headers configuration
chrome.runtime.sendMessage({ action: "getHeaderRules" });

log("emitting content_script_isolated_js_ready event for content-script.js");

window.dispatchEvent(new CustomEvent("content_script_isolated_js_ready"));

log("fully loaded");

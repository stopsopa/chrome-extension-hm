// background.js - Handles dynamic rule updates and extension lifecycle

// Check extension status on startup and after browser restart
chrome.runtime.onStartup.addListener(() => {
  checkExtensionState();
});

// Also check when extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  checkExtensionState();
});

// Function to check extension state and act accordingly
function checkExtensionState() {
  chrome.storage.local.get("extensionEnabled", (data) => {
    const enabled = data.extensionEnabled !== false;

    if (!enabled) {
      // Extension is disabled, make sure all rules are cleared
      clearAllRules();
    } else {
      // Extension is enabled, load and apply rules
      chrome.storage.local.get("customHeaders", (headerData) => {
        const headers = headerData.customHeaders || [];
        const activeHeaders = headers.filter((h) => h.active !== false);
        if (activeHeaders.length > 0) {
          updateRules(activeHeaders);
        }
      });
    }

    // Update the extension icon based on the enabled state
    updateExtensionIcon(enabled);
  });
}

// Add listener for when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
  // Initialize storage with empty headers array if needed
  chrome.storage.local.get("customHeaders", (data) => {
    if (!data.customHeaders) {
      chrome.storage.local.set({ customHeaders: [] });
    } else {
      // If we have headers saved, update the rules
      updateRules(data.customHeaders);
    }
  });
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "setExtensionState") {
    const enabled = message.enabled;

    if (!enabled) {
      // If disabled, clear all rules
      clearAllRules();
    } else {
      // If re-enabled, reload headers and apply rules
      chrome.storage.local.get("customHeaders", (data) => {
        const headers = data.customHeaders || [];
        const activeHeaders = headers.filter((h) => h.active !== false);
        if (activeHeaders.length > 0) {
          updateRules(activeHeaders);
        }
      });
    }

    // Update the extension icon based on the new enabled state
    updateExtensionIcon(enabled);
  } else if (message.action === "updateRules") {
    // Check if extension is enabled before updating rules
    chrome.storage.local.get("extensionEnabled", (data) => {
      const enabled = data.extensionEnabled !== false;
      if (enabled) {
        updateRules(message.headers);
      } else {
        // Extension disabled, don't apply any rules
        clearAllRules();
      }
    });
    return;
  } else if (message.action === "getHeaderRules") {
    // Return the current headers for content script logging (no notification content)
    chrome.storage.local.get(["customHeaders", "dictionary"], (data) => {
      const headers = data.customHeaders || [];
      const dictionary = data.dictionary || [];

      // Create dictionary map
      const dictionaryMap = {};
      dictionary.forEach((entry) => {
        dictionaryMap[entry.key] = entry.value;
      });

      // Resolve dictionary values
      const processedHeaders = headers.map((header) => {
        const processedHeader = { ...header };

        if (header.valueSource === "dictionary") {
          if (dictionaryMap[header.value]) {
            processedHeader.resolvedValue = dictionaryMap[header.value];
          } else {
            processedHeader.resolvedValue = header.value;
            console.warn(
              `Dictionary key "${header.value}" not found for header "${header.name}"`
            );
          }
        } else {
          processedHeader.resolvedValue = header.value;
        }

        return processedHeader;
      });

      // Just return headers for logging purposes, no notification data
      sendResponse({ headers: processedHeaders });
    });

    // Keep the message channel open for the async response
    return true;
  } else if (message.action === "exportCustomHeaders") {
    // Export customHeaders as JSON, sorted by label
    chrome.storage.local.get(["customHeaders"], (data) => {
      let headers = data.customHeaders || [];
      headers = headers.slice().sort((a, b) => {
        const labelA = (a.label || '').toLowerCase();
        const labelB = (b.label || '').toLowerCase();
        if (labelA < labelB) return -1;
        if (labelA > labelB) return 1;
        return 0;
      });
      sendResponse({
        json: JSON.stringify(headers, null, 2)
      });
    });
    return true;
  } else if (message.action === "importCustomHeaders") {
    // Import customHeaders from provided JSON string
    try {
      const imported = JSON.parse(message.json);
      if (Array.isArray(imported)) {
        chrome.storage.local.set({ customHeaders: imported }, () => {
          updateRules(imported);
          sendResponse({ success: true });
        });
      } else {
        sendResponse({ success: false, error: "Invalid format" });
      }
    } catch (e) {
      sendResponse({ success: false, error: e.message });
    }
    return true;
  }
});

// Function to update the declarativeNetRequest rules
function updateRules(headers) {
  // First, get the current dictionary values
  chrome.storage.local.get("dictionary", (dictionaryData) => {
    const dictionary = dictionaryData.dictionary || [];

    // Create a dictionary map for quick lookups
    const dictionaryMap = {};
    dictionary.forEach((entry) => {
      dictionaryMap[entry.key] = entry.value;
    });

    // Clear existing dynamic rules
    chrome.declarativeNetRequest.updateDynamicRules(
      {
        removeRuleIds: [], // We'll get and remove all existing rule IDs
        addRules: [],
      },
      () => {
        // Get existing rule IDs to remove them
        chrome.declarativeNetRequest.getDynamicRules((existingRules) => {
          const ruleIdsToRemove = existingRules.map((rule) => rule.id);

          // Generate new rules from headers
          const newRules = headers.map((header, index) => {
            // Determine the actual value to use
            let headerValue = header.value;

            // If this header uses a dictionary value, look up the fresh value
            if (header.valueSource === "dictionary") {
              if (dictionaryMap[header.value]) {
                headerValue = dictionaryMap[header.value];
              }
            }

            return {
              id: index + 1, // Rule IDs must be positive integers
              priority: 1,
              action: {
                type: "modifyHeaders",
                requestHeaders: [
                  {
                    header: header.name,
                    operation: "set",
                    value: headerValue,
                  },
                ],
              },
              condition: {
                urlFilter: header.urlPattern,
                resourceTypes: [
                  "main_frame",
                  "sub_frame",
                  "stylesheet",
                  "script",
                  "image",
                  "font",
                  "object",
                  "xmlhttprequest",
                  "ping",
                  "csp_report",
                  "media",
                  "websocket",
                  "other",
                ],
              },
            };
          });

          // Update the rules
          chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: ruleIdsToRemove,
            addRules: newRules,
          });
        });
      }
    );
  });
}

// Function to clear all dynamic rules
function clearAllRules() {
  chrome.declarativeNetRequest.getDynamicRules((existingRules) => {
    const ruleIdsToRemove = existingRules.map((rule) => rule.id);

    chrome.declarativeNetRequest.updateDynamicRules(
      {
        removeRuleIds: ruleIdsToRemove,
        addRules: [],
      },
      () => {
        console.log("All header rules cleared - extension disabled");
      }
    );
  });
}

// Update extension icon based on enabled state
function updateExtensionIcon(enabled) {
  const iconPath = enabled
    ? "icons/icon128.png" // Normal icon when enabled
    : "images/icon128_disabled.png"; // Grayscale icon when disabled

  chrome.action.setIcon({ path: iconPath });

  // Also update the tooltip
  const title = enabled
    ? "Request Header Modifier (Enabled)"
    : "Request Header Modifier (Disabled)";
  chrome.action.setTitle({ title: title });
}

// You need to create a grayscale version of your icon and place it at images/icon128_disabled.png
// Here's how you can create it:
// 1. Take a copy of your existing icon128.png
// 2. Convert it to grayscale and reduce opacity to about 50-60%
// 3. Save it as icon128_disabled.png in the images folder

// // log what url will be modified
// chrome.webRequest.onBeforeSendHeaders.addListener(
//   (details) => {
//     console.log(`===== URL: ${details.method} ${details.url}`);

//     // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/BlockingResponse
//     return {};
//   },
//   { urls: ["<all_urls>"] },
//   ["requestHeaders"]
// );

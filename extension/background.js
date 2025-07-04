// background.js - Handles dynamic rule updates and extension lifecycle

// Import format conversion utilities
import { toList } from "./formats.js";

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

    if (enabled) {
      chrome.storage.local.get("customHeaders", (headerData) => {
        const headers = headerData.customHeaders || [];
        const activeHeaders = headers.filter((h) => h.active !== false);
        if (activeHeaders.length > 0) {
          updateRules(activeHeaders);
        }
      });
    } else {
      clearAllRules();
    }

    // Update the extension icon based on the enabled state
    updateExtensionIcon(enabled);
  });
}

// Add listener for when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
  // Initialize storage with empty headers array if needed
  chrome.storage.local.get("customHeaders", (data) => {
    if (data.customHeaders) {
      // If we have headers saved, update the rules
      updateRules(data.customHeaders);
    } else {
      chrome.storage.local.set({ customHeaders: [] });
    }
  });
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Log all incoming messages for debugging

  if (message.action === "forBackground_enabled") {
    const enabled = message.enabled;

    // Send message to all tabs
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, {
          action: "forIsolated_enabled",
          enabled,
        });
      });
    });

    if (enabled) {
      chrome.storage.local.get("customHeaders", (data) => {
        const headers = data.customHeaders || [];
        const activeHeaders = headers.filter((h) => h.active !== false);
        if (activeHeaders.length > 0) {
          updateRules(activeHeaders);
        }

        sendResponse({ success: true });
      });
      // Update the extension icon based on the new enabled state
      updateExtensionIcon(enabled);

      return true;
    } else {
      clearAllRules();
      sendResponse({ success: true });
      // Update the extension icon based on the new enabled state
      updateExtensionIcon(enabled);

      sendResponse({ success: true });

      return false;
    }
  } else if (message.action === "getExtensionEnabled") {
    chrome.storage.local.get("extensionEnabled", (data) => {
      const enabled = data.extensionEnabled !== false;

      chrome.tabs.sendMessage(sender.tab.id, {
        action: "extensionEnabledState",
        enabled: enabled,
      });

      sendResponse({ success: true });
    });

    return true;
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
      sendResponse({ success: true });
    });

    return true;
  } else if (message.action === "getHeaderRules") {
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

        processedHeader.resolvedHeaders = {};

        for (const [headerName, headerConfig] of Object.entries(header.headers)) {
          if (headerConfig.source === "dictionary") {
            const dictValue = dictionaryMap[headerConfig.value];
            processedHeader.resolvedHeaders[headerName] = dictValue !== undefined ? dictValue : headerConfig.value;
          } else {
            processedHeader.resolvedHeaders[headerName] = headerConfig.value;
          }
        }

        return processedHeader;
      });

      const ajaxHeadersMap = {};

      // Prepare headers for the Ajax overrider - ONLY for headers with first: false
      processedHeaders.forEach((header) => {
        if (header.active && header.resolvedHeaders) {
          // Check if this rule matches the current URL (simplified matching)
          for (const [headerName, value] of Object.entries(header.resolvedHeaders)) {
            // Include ONLY headers with first: false for Ajax overriding
            const headerConfig = header.headers[headerName];
            if (headerConfig.first === false) {
              ajaxHeadersMap[headerName] = {
                value: value,
                urlPattern: header.urlPattern, // Include URL pattern for matching
                first: false,
                regex: headerConfig.regex,
              };
            }
          }
        }
      });

      if (sender.tab) {
        chrome.tabs.sendMessage(sender.tab.id, {
          action: "updateHeaders",
          headers: ajaxHeadersMap,
        });
      }
      sendResponse({ success: true });
    });

    return true;
  } else if (message.action === "exportCustomHeaders") {
    // Export customHeaders as JSON, sorted by label
    chrome.storage.local.get(["customHeaders"], (data) => {
      let headers = data.customHeaders || [];
      headers = headers.slice().sort((a, b) => {
        const labelA = (a.label || "").toLowerCase();
        const labelB = (b.label || "").toLowerCase();
        if (labelA < labelB) return -1;
        if (labelA > labelB) return 1;
        return 0;
      });
      // Convert to list format before exporting
      const listFormatHeaders = toList(headers);
      sendResponse({
        json: JSON.stringify(listFormatHeaders, null, 2),
      });
    });

    return true;
  } else if (message.action === "importCustomHeaders") {
    // Import customHeaders from provided JSON string
    try {
      const imported = JSON.parse(message.json);
      if (Array.isArray(imported)) {
        // Convert to flat format for storage
        const flatFormat = toList(imported);
        chrome.storage.local.set({ customHeaders: flatFormat }, () => {
          updateRules(flatFormat);
          sendResponse({ success: true });
        });

        return true;
      } else {
        sendResponse({ success: false, error: "Invalid format" });

        return false;
      }
    } catch (e) {
      sendResponse({ success: false, error: e.message });

      return false;
    }
  }

  sendResponse({ success: true });

  return false;
}); // Function to update the declarativeNetRequest rules
function updateRules(headers) {
  // Convert headers to the list format for rule processing if needed
  const listFormatHeaders = toList(headers);
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

          // Generate new rules from headers - ONLY for headers with first: true
          let newRules = [];

          // Reset mapping and counter
          labelToRuleId = {};
          nextRuleId = 1;

          // Process each header rule - using the list format
          listFormatHeaders.forEach((rule) => {
            // Handle the new format (headers object)
            if (rule.headers && Object.keys(rule.headers).length > 0) {
              const requestHeaders = [];

              // Process each header in the rule
              for (const [headerName, headerConfig] of Object.entries(rule.headers)) {
                // ONLY process headers with first: true (or undefined/true by default)
                if (headerConfig.first === false) {
                  continue; // Skip headers with first: false - these will be handled by Ajax override
                }

                // Validate header name - skip if empty or invalid
                if (!headerName || headerName.trim() === "") {
                  continue;
                }

                // Determine the actual value to use
                let headerValue = headerConfig.value;

                // If this header uses a dictionary value, look up the fresh value
                if (headerConfig.source === "dictionary") {
                  if (dictionaryMap[headerConfig.value]) {
                    headerValue = dictionaryMap[headerConfig.value];
                  }
                }

                // Validate header value - use empty string if undefined/null
                if (headerValue === undefined || headerValue === null) {
                  headerValue = "";
                }

                // Add this header to the request headers array
                requestHeaders.push({
                  header: headerName.trim(),
                  operation: "set",
                  value: String(headerValue), // Ensure value is a string
                });
              }

              // Only create a rule if we have headers to add
              if (requestHeaders.length > 0) {
                newRules.push({
                  id: getRuleIdForLabel(rule.label), // Use integer id for DNR
                  priority: 1,
                  action: {
                    type: "modifyHeaders",
                    requestHeaders: requestHeaders,
                  },
                  condition: {
                    urlFilter: rule.urlPattern || "*",
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
                });
              }
            }
            // Handle the legacy format
            else if (rule.name) {
              // Validate header name - skip if empty
              if (!rule.name || rule.name.trim() === "") {
                return;
              }

              // Determine the actual value to use
              let headerValue = rule.value;

              // If this header uses a dictionary value, look up the fresh value
              if (rule.valueSource === "dictionary") {
                if (dictionaryMap[rule.value]) {
                  headerValue = dictionaryMap[rule.value];
                }
              }

              // Validate header value - use empty string if undefined/null
              if (headerValue === undefined || headerValue === null) {
                headerValue = "";
              }

              newRules.push({
                id: getRuleIdForLabel(rule.label), // Use integer id for DNR
                priority: 1,
                action: {
                  type: "modifyHeaders",
                  requestHeaders: [
                    {
                      header: rule.name.trim(),
                      operation: "set",
                      value: String(headerValue), // Ensure value is a string
                    },
                  ],
                },
                condition: {
                  urlFilter: rule.urlPattern || "*",
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
              });
            }
          });

          // Before updating rules, add extra validation step
          let validRules = [];
          for (let i = 0; i < newRules.length; i++) {
            const rule = newRules[i];
            let isValid = true;

            // Validate each header in requestHeaders
            if (rule.action && rule.action.requestHeaders) {
              for (let j = 0; j < rule.action.requestHeaders.length; j++) {
                const headerObj = rule.action.requestHeaders[j];

                // Check for missing or invalid header name
                if (!headerObj.header || typeof headerObj.header !== "string" || headerObj.header.trim() === "") {
                  isValid = false;
                  break;
                }

                // Fix header names containing spaces (take only the first part)
                if (headerObj.header.includes(" ")) {
                  // Get the first part of the header name (before the space)
                  const fixedHeaderName = headerObj.header.split(" ")[0];
                  headerObj.header = fixedHeaderName;
                }

                // Ensure value is a valid string
                if (headerObj.value === undefined || headerObj.value === null) {
                  headerObj.value = "";
                }

                // Force convert value to string (Chrome API requires string values)
                headerObj.value = String(headerObj.value);
              }
            } else {
              isValid = false;
            }

            if (isValid) {
              validRules.push(rule);
            }
          }

          // Replace newRules with only the valid ones
          newRules = validRules;

          // Safety check - don't proceed if we have no valid rules
          if (newRules.length === 0) {
            return;
          }

          try {
            // Update the rules
            chrome.declarativeNetRequest.updateDynamicRules(
              {
                removeRuleIds: ruleIdsToRemove,
                addRules: newRules,
              },
              (result) => {
                if (chrome.runtime.lastError) {
                  const errorInfo = {
                    message: chrome.runtime.lastError.message,
                    error: chrome.runtime.lastError,
                  };

                  // Extract rule ID from error message if possible
                  const idMatch = errorInfo.message.match(/Rule with id (\d+)/);
                  if (idMatch && idMatch[1]) {
                    const problemRuleId = parseInt(idMatch[1]);
                    const problemRule = newRules.find((r) => r.id === problemRuleId);

                    if (problemRule) {
                      // Try to fix the problem in storage
                      chrome.storage.local.get("customHeaders", (data) => {
                        if (data.customHeaders && Array.isArray(data.customHeaders)) {
                          let fixedAny = false;

                          // Fix any headers with spaces in the stored data
                          const fixedHeaders = data.customHeaders.map((rule) => {
                            if (rule.headers) {
                              const fixedHeadersObj = {};
                              let madeChanges = false;

                              // Check each header name for spaces
                              for (const [headerName, headerConfig] of Object.entries(rule.headers)) {
                                if (headerName.includes(" ")) {
                                  // Use only the part before the space
                                  const fixedName = headerName.split(" ")[0];
                                  fixedHeadersObj[fixedName] = headerConfig;
                                  madeChanges = true;
                                  fixedAny = true;
                                } else {
                                  fixedHeadersObj[headerName] = headerConfig;
                                }
                              }

                              if (madeChanges) {
                                return { ...rule, headers: fixedHeadersObj };
                              }
                            } else if (rule.name && rule.name.includes(" ")) {
                              // Fix legacy format headers with spaces
                              const fixedName = rule.name.split(" ")[0];
                              fixedAny = true;
                              return { ...rule, name: fixedName };
                            }
                            return rule;
                          });

                          // Save the fixed headers back to storage
                          if (fixedAny) {
                            // Convert to flat format before saving
                            chrome.storage.local.set({
                              customHeaders: toList(fixedHeaders),
                            });
                          }
                        }
                      });
                    }
                  }
                }
              },
            );
          } catch (err) {
            // Emergency cleanup
            chrome.declarativeNetRequest.getDynamicRules((existingRules) => {
              const cleanupRuleIds = existingRules.map((rule) => rule.id);
              chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: cleanupRuleIds,
                addRules: [],
              });
            });
          }
        });
      },
    );
  });
}

// Function to clear all dynamic rules
function clearAllRules() {
  chrome.declarativeNetRequest.getDynamicRules((existingRules) => {
    const ruleIdsToRemove = existingRules.map((rule) => rule.id);

    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: ruleIdsToRemove,
      addRules: [],
    });
  });
}

// Update extension icon based on enabled state
function updateExtensionIcon(enabled) {
  const iconPath = enabled
    ? "images/icon128.png" // Normal icon when enabled
    : "images/icon128_disabled.png"; // Grayscale icon when disabled

  chrome.action.setIcon({ path: iconPath });

  // Also update the tooltip
  const title = enabled ? "Request Header Modifier (Enabled)" : "Request Header Modifier (Disabled)";
  chrome.action.setTitle({ title: title });
}

// You need to create a grayscale version of your icon and place it at images/icon128_disabled.png
// Here's how you can create it:
// 1. Take a copy of your existing icon128.png
// 2. Convert it to grayscale and reduce opacity to about 50-60%
// 3. Save it as icon128_disabled.png in the images folder

// Module-level mapping from label to integer id for DNR rules
let labelToRuleId = {};
let nextRuleId = 1;

function getRuleIdForLabel(label) {
  if (!labelToRuleId[label]) {
    labelToRuleId[label] = nextRuleId++;
  }
  return labelToRuleId[label];
}

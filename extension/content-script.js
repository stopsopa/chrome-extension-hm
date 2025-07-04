// This script runs in the MAIN world context at document_start

// Global variables to store headers and original XMLHttpRequest
let customHeaders = {};
let originalXMLHttpRequestOpen = null;

let loggingEnabled = true;
loggingEnabled = false;
function log(...args) {
  if (loggingEnabled) {
    console.log("[content-script.js]", ...args);
  }
}

log("start loading");

/**
 * Simple trick to wait for content-script-isolated.js to be ready
 * Because it is loaded after content-script.js
 * And in order to get any information from content-script from anywhere I have to wait for
 * content-script-isolated.js to be ready to accept events
 */
const contentScriptIsolatedReady = (function () {
  let contentScriptIsolatedResolve, reject;
  const contentScriptIsolatedReady = new Promise((resolve, rej) => {
    contentScriptIsolatedResolve = resolve;
    reject = rej;
  });

  window.addEventListener("content_script_isolated_js_ready", function (event) {
    log("content_script_isolated_js_ready arrived");

    contentScriptIsolatedResolve();
  });
  return contentScriptIsolatedReady;
})();

// Simplified matching version for urlFilter
// https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest#url_filter_syntax
function urlMatches(url, pattern) {
  return url.toLowerCase().includes(pattern.toLowerCase());
}

function createAjaxOverrider() {
  const th = (msg) => new Error(`createAjaxOverrider error: ${msg}`);
  function isObject(o) {
    return Object.prototype.toString.call(o) === "[object Object]";
  }
  let headers = {};
  let originalOpen = null;
  return {
    override: function () {
      if (typeof XMLHttpRequest !== "undefined") {
        if (XMLHttpRequest.prototype.originalOpen) {
          return;
        }
        originalOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function (method, url) {
          originalOpen.apply(this, arguments);

          // Apply headers that match the URL regex or have no regex
          Object.keys(headers).forEach((key) => {
            const headerConfig = headers[key];
            let shouldApply = true;

            // Check if there's a regex to test against
            if (headerConfig.regex) {
              try {
                shouldApply = headerConfig.regex.test(`${method}:${url}`);
              } catch (err) {
                console.error(`Error testing regex for header "${key}":`, err);
                shouldApply = false;
              }
            }

            if (shouldApply) {
              log(`Request Add Headers: Ajax: Injecting header '${key}' into url '${method}:${url}'`);
              this.setRequestHeader(key, headerConfig.value);
            } else {
              log(
                `Request Add Headers: Ajax: Not injecting header '${key}' into url '${method}:${url}' due to regex ${
                  headerConfig.regex
                }, typeof regex: ${typeof headerConfig.regex}`,
              );
            }
          });
        };
        XMLHttpRequest.prototype.originalOpen = originalOpen;
      }
    },
    setHeaders: function (newHeaders) {
      if (!isObject(newHeaders)) {
        throw th("Headers must be an object");
      }
      headers = newHeaders;
    },
    restore: function () {
      if (XMLHttpRequest.prototype.originalOpen) {
        XMLHttpRequest.prototype.open = XMLHttpRequest.prototype.originalOpen;
        delete XMLHttpRequest.prototype.originalOpen;
        originalOpen = null;
      }
    },
  };
}

function createFetchOverrider() {
  const th = (msg) => new Error(`createFetchOverrider error: ${msg}`);
  function isObject(o) {
    return Object.prototype.toString.call(o) === "[object Object]";
  }
  let headers = {};
  let originalFetch = null;
  return {
    override: function () {
      if (typeof fetch !== "undefined") {
        if (window.fetch.originalFetch) {
          return;
        }
        originalFetch = window.fetch;
        window.fetch = function (url, options = {}) {
          if (url instanceof Request) {
            return originalFetch.call(this, url);

            /**
             * There seems to be a problem with cloning request in some cases.
             * I will try to determine if swagger uses fetch with regular notation not with Request object
             *
             */
            // const cloned = new Request(url, {
            //   headers: {
            //     ...Object.fromEntries(url.headers.entries()),
            //     ...applicableHeaders,
            //   },
            // });
            // // debugger;
            // return originalFetch.call(this, cloned);
          }

          const urlString = typeof url === "string" ? url : url.url || "";

          // Start with empty custom headers that we'll fill based on regex matching
          const applicableHeaders = {};

          // Get the method from options, default to "GET"
          const method = options?.method || "GET";

          // Check each header against URL to see if it should be applied
          Object.keys(headers).forEach((key) => {
            const headerConfig = headers[key];
            let shouldApply = true;

            // Check if there's a regex to test against
            if (headerConfig.regex) {
              try {
                shouldApply = headerConfig.regex.test(`${method}:${urlString}`);
              } catch (err) {
                console.error(`Error testing regex for header "${key}":`, err);
                shouldApply = false;
              }
            }

            if (shouldApply) {
              console.log(`Request Add Headers: Fetch: Injecting header '${key}' into url '${method}:${urlString}'`);
              applicableHeaders[key] = headerConfig.value;
            } else {
              log(
                `Request Add Headers: Fetch: Not injecting header '${key}' into url '${method}:${urlString}' due to regex ${
                  headerConfig.regex
                }, typeof regex: ${typeof headerConfig.regex}`,
              );
            }
          });

          options.headers = {
            ...options.headers,
            ...applicableHeaders,
          };
          // debugger;
          return originalFetch.call(this, url, options);
        };
        window.fetch.originalFetch = originalFetch;
      }
    },
    setHeaders: function (newHeaders) {
      if (!isObject(newHeaders)) {
        throw th("Headers must be an object");
      }
      headers = newHeaders;
    },
    restore: function () {
      if (window.fetch.originalFetch) {
        window.fetch = window.fetch.originalFetch;
        delete window.fetch.originalFetch;
        originalFetch = null;
      }
    },
  };
}

window.createAjaxOverrider = createAjaxOverrider;
window.overrideAjax = createAjaxOverrider();
window.createFetchOverrider = createFetchOverrider;
window.overrideFetch = createFetchOverrider();

// --- Extension enabled/disabled toggle support ---
function setExtensionEnabled(enabled) {
  log("setExtensionEnabled received");
  if (enabled) {
    overrideAjax.override();
    overrideFetch.override();
  } else {
    overrideAjax.restore();
    overrideFetch.restore();
  }
}

// Listen for enable/disable via custom event from isolated world
window.addEventListener("log_content-script-isolated-js", function (event) {
  log("[log_content-script-isolated.js]", ...event.detail);
  // log("[log_content-script-isolated.js]", ...event?.args);
});

// Listen for enable/disable via custom event from isolated world
window.addEventListener("forContentScript_enabled", function (event) {
  log("forContentScript_enabled", event);
  setExtensionEnabled(event.detail && event.detail.enabled !== false);
});

// Request extension enabled state from background via isolated world
async function requestExtensionEnabledState() {
  await contentScriptIsolatedReady;

  log("Requesting extension enabled state");

  window.dispatchEvent(new CustomEvent("getExtensionEnabled"));
}

// Listen for the response from isolated world with the extension state
window.addEventListener("extensionEnabledState", function (event) {
  log("Received extensionEnabledState", event.detail.enabled);
  setExtensionEnabled(event.detail && event.detail.enabled !== false);
});

// On initial load, request extension state instead of assuming enabled
requestExtensionEnabledState();

// Function to update headers
function updateCustomHeaders(newHeaders) {
  customHeaders = newHeaders || {};
}

// Listen for messages from the extension context via custom events
window.addEventListener("__extensionHeadersUpdate", function (event) {
  log(
    "__extensionHeadersUpdate details: ",
    JSON.stringify(event.detail, null, 2),
    "location",
    JSON.stringify(window.location, null, 2),
  );

  const list = {};

  Object.keys(event.detail).forEach((key) => {
    const href = window.location.href;
    const urlPattern = event.detail[key].urlPattern || "";

    if (urlMatches(href, urlPattern)) {
      list[key] = {
        value: event.detail[key].value,
      };

      // If regex is provided, try to convert it
      if (event.detail[key].regex) {
        try {
          list[key].regex = stringToRegex(event.detail[key].regex);
        } catch (err) {
          console.error(`Failed to parse regex for header "${key}":`, err);
          // Continue without the regex
        }
      }
      var k = "test";
    }
  });

  // Apply the transformed headers
  overrideAjax.setHeaders(list);
  overrideFetch.setHeaders(list);

  // log("Custom headers updated:", event.detail, "list", list);
});

// // Simple logging for XMLHttpRequest activity
// const observer = new PerformanceObserver((entries) => {
//   entries.getEntries().forEach((entry) => {
//     if (entry.initiatorType === "fetch" || entry.initiatorType === "xmlhttprequest") {
//       log(`===== Header-enhanced request to: ${entry.name}`);
//     }
//   });
// });

// // Start observing resource timing entries
// try {
//   observer.observe({ entryTypes: ["resource"] });
// } catch (e) {
//   log("Performance observer not available");
// }

var stringToRegex = (function () {
  /**
   * @param {string} msg
   * @returns {Error}
   */
  function th(msg) {
    return new Error("stringToRegex error: " + msg);
  }

  /**
   * @param {string} v
   */
  return (v) => {
    try {
      const vv = v.match(/(\\.|[^/])+/g);

      if (!vv || vv.length > 2) {
        throw new Error(`param '${v}' should split to one or two segments`);
      }

      return new RegExp(vv[0], vv[1]);
    } catch (e) {
      throw th(`general error: string '${v}' error: ${e}`);
    }
  };
})();

log("fully loaded");

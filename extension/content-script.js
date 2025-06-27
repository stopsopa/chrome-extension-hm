// This script runs in the MAIN world context at document_start

// Global variables to store headers and original XMLHttpRequest
let customHeaders = {};
let originalXMLHttpRequestOpen = null;

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
          throw th("XMLHttpRequest is already overriden");
        }
        originalOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function (method, url) {
          originalOpen.apply(this, arguments);
          Object.keys(headers).forEach((key) => {
            this.setRequestHeader(key, headers[key]);
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

window.createAjaxOverrider = createAjaxOverrider;
window.overrideAjax = createAjaxOverrider();
overrideAjax.override();

console.log("content-script.js loaded");

// Function to update headers
function updateCustomHeaders(newHeaders) {
  customHeaders = newHeaders || {};
}

// Listen for messages from the extension context via custom events
window.addEventListener("__extensionHeadersUpdate", function (event) {
  console.log(
    "__extensionHeadersUpdate details: ",
    JSON.stringify(event.detail, null, 2),
    "location",
    JSON.stringify(window.location, null, 2)
  );

  const list = {};

  Object.keys(event.detail).forEach((key) => {
    if (urlMatches(window.location.href, event.detail[key].urlPattern)) {
      list[key] = event.detail[key].value;
    }
  });

  // {
  //   "X-other": {
  //     "value": "testplain",
  //     "urlPattern": "catalog-offers-ext.cp.api.dp.godaddy.com",
  //     "first": false
  //   },
  //   "X-ajax": {
  //     "value": "value",
  //     "urlPattern": "example.net",
  //     "first": false
  //   }
  // }

  overrideAjax.setHeaders(list);
  // console.log("Custom headers updated:", event.detail, "list", list);
});

// Simple logging for XMLHttpRequest activity
const observer = new PerformanceObserver((entries) => {
  entries.getEntries().forEach((entry) => {
    if (
      entry.initiatorType === "fetch" ||
      entry.initiatorType === "xmlhttprequest"
    ) {
      console.log(`===== Header-enhanced request to: ${entry.name}`);
    }
  });
});

// Start observing resource timing entries
try {
  observer.observe({ entryTypes: ["resource"] });
} catch (e) {
  console.log("Performance observer not available");
}

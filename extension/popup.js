// popup.js - Handles the popup UI and user interactions

document.addEventListener("DOMContentLoaded", () => {
  // Tab handling
  const tabs = document.querySelectorAll(".tab");
  const tabContents = document.querySelectorAll(".tab-content");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      // Remove active class from all tabs and tab contents
      tabs.forEach((t) => t.classList.remove("active"));
      tabContents.forEach((c) => c.classList.remove("active"));

      // Add active class to clicked tab and corresponding content
      tab.classList.add("active");
      const tabId = tab.getAttribute("data-tab");
      document.getElementById(`${tabId}-tab`).classList.add("active");
    });
  });

  // Handle value source switching with radio buttons
  const valueSourceRadios = document.querySelectorAll(
    'input[name="value-source"]'
  );
  const manualInputGroup = document.querySelector(".value-source-manual");
  const dictionaryInputGroup = document.querySelector(
    ".value-source-dictionary"
  );

  valueSourceRadios.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      if (e.target.value === "manual") {
        manualInputGroup.style.display = "block";
        dictionaryInputGroup.style.display = "none";
        document.getElementById("header-value").required = true;
        document.getElementById("header-value-key").required = false;
      } else {
        manualInputGroup.style.display = "none";
        dictionaryInputGroup.style.display = "block";
        document.getElementById("header-value").required = false;
        document.getElementById("header-value-key").required = true;
      }
    });
  });

  // Get form and list elements
  const headerForm = document.getElementById("header-form");
  const headerList = document.getElementById("header-list");
  const dictionaryForm = document.getElementById("dictionary-form");
  const dictionaryList = document.getElementById("dictionary-list");
  const headerValueKeySelect = document.getElementById("header-value-key");

  // Track if we're editing an existing header or dictionary entry
  let editingHeaderId = null;
  let editingDictId = null;

  // Load and display saved headers and dictionary entries
  loadHeaders();
  loadDictionary();

  // Add event listener for form submission
  headerForm.addEventListener("submit", (e) => {
    e.preventDefault();

    // Get input values
    const headerLabel = document.getElementById("header-label").value.trim();
    const headerName = document.getElementById("header-name").value.trim();
    const urlPattern =
      document.getElementById("url-pattern").value.trim() || "*";

    const valueSource = document.querySelector(
      'input[name="value-source"]:checked'
    ).value;
    let headerValue;

    if (valueSource === "manual") {
      headerValue = document.getElementById("header-value").value.trim();
    } else {
      headerValue = document.getElementById("header-value-key").value;
    }

    // Check if inputs are valid
    if (
      !headerName ||
      !headerValue ||
      (valueSource === "dictionary" && !headerValue)
    ) {
      return;
    }

    if (editingHeaderId) {
      // Update existing header
      updateHeader(
        editingHeaderId,
        headerLabel,
        headerName,
        headerValue,
        urlPattern,
        valueSource
      );
      // Reset editing state
      editingHeaderId = null;
      document.querySelector('button[type="submit"]').textContent =
        "Add Header";
    } else {
      // Add new header
      addHeader(headerLabel, headerName, headerValue, urlPattern, valueSource);
    }

    // Clear the form
    headerForm.reset();

    // Reset to manual mode
    document.querySelector(
      'input[name="value-source"][value="manual"]'
    ).checked = true;
    // Trigger the change event
    document
      .querySelector('input[name="value-source"]:checked')
      .dispatchEvent(new Event("change"));
  });

  // Add dictionary form event listener
  dictionaryForm.addEventListener("submit", (e) => {
    e.preventDefault();

    // Get input values
    const dictKey = document.getElementById("dict-key").value.trim();
    const dictValue = document.getElementById("dict-value").value.trim();

    // Check if inputs are valid
    if (!dictKey || !dictValue) {
      return;
    }

    if (editingDictId) {
      // Update existing dictionary entry
      updateDictionaryEntry(editingDictId, dictKey, dictValue);
      // Reset editing state
      editingDictId = null;
      dictionaryForm.querySelector('button[type="submit"]').textContent =
        "Add Dictionary Entry";
    } else {
      // Add new dictionary entry
      addDictionaryEntry(dictKey, dictValue);
    }

    // Clear the form
    dictionaryForm.reset();
  });

  // Add cancel button event listener
  const cancelButton = document.createElement("button");
  cancelButton.textContent = "Cancel";
  cancelButton.type = "button";
  cancelButton.id = "cancel-edit";
  cancelButton.style.backgroundColor = "#999";
  cancelButton.style.marginLeft = "10px";
  cancelButton.style.display = "none";

  cancelButton.addEventListener("click", () => {
    // Reset form and editing state
    headerForm.reset();
    editingHeaderId = null;
    document.querySelector('button[type="submit"]').textContent = "Add Header";
    cancelButton.style.display = "none";
    createNewButton.style.display = "none";
    createNewButton.textContent = "Create New";

    // Reset to manual mode
    document.querySelector(
      'input[name="value-source"][value="manual"]'
    ).checked = true;
    document
      .querySelector('input[name="value-source"]:checked')
      .dispatchEvent(new Event("change"));
  });

  // Append cancel button after the submit button
  document.querySelector('button[type="submit"]').after(cancelButton);

  // Add create new button
  const createNewButton = document.createElement("button");
  createNewButton.textContent = "Create New";
  createNewButton.type = "button";
  createNewButton.id = "create-new";
  createNewButton.style.backgroundColor = "#FF9800";
  createNewButton.style.marginLeft = "10px";
  createNewButton.style.display = "none";

  createNewButton.addEventListener("click", () => {
    // If button says "Create New", change it to "Click again to confirm"
    if (createNewButton.textContent === "Create New") {
      createNewButton.textContent = "Click again to confirm";
      return;
    }

    // If button already says "Click again to confirm", create the header
    createNewButton.textContent = "Create New";

    // Get current form values
    const headerLabel = document.getElementById("header-label").value.trim();
    const headerName = document.getElementById("header-name").value.trim();
    const urlPattern =
      document.getElementById("url-pattern").value.trim() || "*";

    const valueSource = document.querySelector(
      'input[name="value-source"]:checked'
    ).value;
    let headerValue;

    if (valueSource === "manual") {
      headerValue = document.getElementById("header-value").value.trim();
    } else {
      headerValue = document.getElementById("header-value-key").value;
    }

    // Check if inputs are valid
    if (
      !headerName ||
      !headerValue ||
      (valueSource === "dictionary" && !headerValue)
    ) {
      alert("Please fill in all required fields");
      return;
    }

    // Add new header based on current values
    chrome.storage.local.get("customHeaders", (data) => {
      const headers = data.customHeaders || [];

      // Generate a unique ID for the header
      const id = Date.now().toString();

      // Add the new header
      headers.push({
        id,
        label: headerLabel,
        name: headerName,
        value: headerValue,
        urlPattern: urlPattern,
        valueSource: valueSource,
        active: true
      });

      // Save to storage
      chrome.storage.local.set({ customHeaders: headers }, () => {
        // Display the new header
        displayHeader({
          id,
          label: headerLabel,
          name: headerName,
          value: headerValue,
          urlPattern: urlPattern,
          valueSource: valueSource,
          active: true
        });

        // Update the rules
        updateRules(headers);

        // Reset editing state but keep form values
        editingHeaderId = null;
        document.querySelector('button[type="submit"]').textContent =
          "Add Header";
        document.getElementById("cancel-edit").style.display = "none";
        createNewButton.style.display = "none";
      });
    });
  });

  // Append create new button after the cancel button
  cancelButton.after(createNewButton);

  function addHeader(label, name, value, urlPattern, valueSource = "manual") {
    // Get existing headers from storage
    chrome.storage.local.get("customHeaders", (data) => {
      const headers = data.customHeaders || [];

      // Generate a unique ID for the header
      const id = Date.now().toString();

      // Add the new header (active by default)
      headers.push({ 
        id, 
        label, 
        name, 
        value, 
        urlPattern, 
        valueSource,
        active: true 
      });

      // Save to storage
      chrome.storage.local.set({ customHeaders: headers }, () => {
        // Display the new header
        displayHeader({ 
          id, 
          label, 
          name, 
          value, 
          urlPattern, 
          valueSource,
          active: true 
        });

        // Update the rules
        updateRules(headers);
      });
    });
  }

  function loadHeaders() {
    chrome.storage.local.get("customHeaders", (data) => {
      const headers = data.customHeaders || [];

      // Clear the list
      headerList.innerHTML = "";

      // Display each header
      headers.forEach(displayHeader);

      // Update rules if needed
      if (headers.length > 0) {
        updateRules(headers);
      }
    });
  }

  function displayHeader(header) {
    const headerItem = document.createElement("div");
    headerItem.className = "header-item";
    
    // Add disabled class if header is not active
    if (header.active === false) {
      headerItem.classList.add("header-disabled");
    }
    
    headerItem.dataset.id = header.id;

    const labelDisplay = header.label
      ? `<div class="header-label">${escapeHtml(header.label)}</div>`
      : "";

    let valueDisplay;
    if (header.valueSource === "dictionary") {
      valueDisplay = `<div class="header-value">Value (from dictionary): <span class="dict-reference">${escapeHtml(
        header.value
      )}</span> <span class="dynamic-indicator" title="The actual value is always pulled dynamically from the dictionary">↻</span></div>`;
    } else {
      valueDisplay = `<div class="header-value">${escapeHtml(
        header.value
      )}</div>`;
    }

    headerItem.innerHTML = `
      <input type="checkbox" class="header-checkbox" title="Enable/Disable this header" ${header.active !== false ? 'checked' : ''}>
      <button class="delete-btn" title="Delete this header">&#9851;&#65039;</button>
      <button class="edit-btn" title="Edit this header">&#9999;&#65039;</button>
      ${labelDisplay}
      <div class="header-name">${escapeHtml(header.name)}</div>
      ${valueDisplay}
      <div class="url-pattern">URL pattern (wildcard): ${escapeHtml(
        header.urlPattern
      )}</div>
    `;

    // Add delete button event listener
    headerItem.querySelector(".delete-btn").addEventListener("click", (e) => {
      const deleteBtn = e.target;

      // If button shows the recycling emoji, change it to "Confirm"
      if (deleteBtn.textContent === "♻️") {
        deleteBtn.textContent = "Confirm";
        deleteBtn.style.backgroundColor = "#ff0000";
        deleteBtn.style.fontSize = "10px";
        deleteBtn.style.padding = "2px 5px";
        return;
      }

      // If button already says "Confirm", delete the header
      deleteHeader(header.id);
    });

    // Add edit button event listener
    headerItem.querySelector(".edit-btn").addEventListener("click", () => {
      startEditing(header.id);
    });
    
    // Add checkbox event listener to toggle active state
    headerItem.querySelector(".header-checkbox").addEventListener("change", (e) => {
      const isActive = e.target.checked;
      toggleHeaderActive(header.id, isActive);
    });

    headerList.appendChild(headerItem);
  }

  function startEditing(id) {
    chrome.storage.local.get("customHeaders", (data) => {
      const headers = data.customHeaders || [];
      const headerToEdit = headers.find((h) => h.id === id);

      if (headerToEdit) {
        // Populate the form with the header data
        document.getElementById("header-label").value =
          headerToEdit.label || "";
        document.getElementById("header-name").value = headerToEdit.name;
        document.getElementById("url-pattern").value =
          headerToEdit.urlPattern || "*";

        // Set value source
        const valueSource = headerToEdit.valueSource || "manual";
        document.querySelector(
          `input[name="value-source"][value="${valueSource}"]`
        ).checked = true;

        if (valueSource === "manual") {
          document.getElementById("header-value").value = headerToEdit.value;
          manualInputGroup.style.display = "block";
          dictionaryInputGroup.style.display = "none";
        } else {
          document.getElementById("header-value-key").value =
            headerToEdit.value;
          manualInputGroup.style.display = "none";
          dictionaryInputGroup.style.display = "block";
        }

        // Trigger change event to update UI
        document
          .querySelector('input[name="value-source"]:checked')
          .dispatchEvent(new Event("change"));

        // Set editing state
        editingHeaderId = id;
        document.querySelector('button[type="submit"]').textContent =
          "Update Header";
        document.getElementById("cancel-edit").style.display = "inline-block";
        document.getElementById("create-new").style.display = "inline-block";

        // Scroll to top of the page to show the form
        window.scrollTo(0, 0);

        // Focus on the first form field
        document.getElementById("header-label").focus();
      }
    });
  }

  function updateHeader(id, label, name, value, urlPattern, valueSource) {
    chrome.storage.local.get("customHeaders", (data) => {
      const headers = data.customHeaders || [];

      // Find and update the header
      const updatedHeaders = headers.map((h) => {
        if (h.id === id) {
          return { ...h, label, name, value, urlPattern, valueSource };
        }
        return h;
      });

      // Save to storage
      chrome.storage.local.set({ customHeaders: updatedHeaders }, () => {
        // Refresh the list
        headerList.innerHTML = "";
        updatedHeaders.forEach(displayHeader);

        // Update the rules
        updateRules(updatedHeaders);

        // Hide buttons
        document.getElementById("cancel-edit").style.display = "none";
        document.getElementById("create-new").style.display = "none";
        createNewButton.textContent = "Create New";
      });
    });
  }

  function deleteHeader(id) {
    chrome.storage.local.get("customHeaders", (data) => {
      const headers = data.customHeaders || [];

      // Filter out the header to delete
      const updatedHeaders = headers.filter((h) => h.id !== id);

      // Update storage
      chrome.storage.local.set({ customHeaders: updatedHeaders }, () => {
        // Remove from UI
        document.querySelector(`.header-item[data-id="${id}"]`).remove();

        // Update the rules
        updateRules(updatedHeaders);
      });
    });
  }

  // Dictionary functions
  function addDictionaryEntry(key, value) {
    chrome.storage.local.get("dictionary", (data) => {
      const dictionary = data.dictionary || [];

      // Generate a unique ID for the dictionary entry
      const id = Date.now().toString();

      // Add the new entry
      dictionary.push({ id, key, value });

      // Save to storage
      chrome.storage.local.set({ dictionary: dictionary }, () => {
        // Display the new entry
        displayDictionaryEntry({ id, key, value });

        // Update the dropdown options
        updateDictionaryDropdown();
      });
    });
  }

  function loadDictionary() {
    chrome.storage.local.get("dictionary", (data) => {
      const dictionary = data.dictionary || [];

      // Clear the list
      dictionaryList.innerHTML = "";

      // Display each entry
      dictionary.forEach(displayDictionaryEntry);

      // Update the dropdown
      updateDictionaryDropdown();
    });
  }

  function displayDictionaryEntry(entry) {
    const dictionaryItem = document.createElement("div");
    dictionaryItem.className = "dictionary-item";
    dictionaryItem.dataset.id = entry.id;

    dictionaryItem.innerHTML = `
      <button class="delete-btn" title="Delete this entry">&#9851;&#65039;</button>
      <button class="edit-btn" title="Edit this entry">&#9999;&#65039;</button>
      <div class="dict-key">${escapeHtml(entry.key)}</div>
      <div class="dict-value">${escapeHtml(entry.value)}</div>
    `;

    // Add delete button event listener
    dictionaryItem
      .querySelector(".delete-btn")
      .addEventListener("click", (e) => {
        const deleteBtn = e.target;

        // If button shows the recycling emoji, change it to "Confirm"
        if (deleteBtn.textContent === "♻️") {
          deleteBtn.textContent = "Confirm";
          deleteBtn.style.backgroundColor = "#ff0000";
          deleteBtn.style.fontSize = "10px";
          deleteBtn.style.padding = "2px 5px";
          return;
        }

        // If button already says "Confirm", delete the dictionary entry
        deleteDictionaryEntry(entry.id);
      });

    // Add edit button event listener
    dictionaryItem.querySelector(".edit-btn").addEventListener("click", () => {
      startEditingDictionary(entry.id);
    });

    dictionaryList.appendChild(dictionaryItem);
  }

  function startEditingDictionary(id) {
    chrome.storage.local.get("dictionary", (data) => {
      const dictionary = data.dictionary || [];
      const entryToEdit = dictionary.find((d) => d.id === id);

      if (entryToEdit) {
        // Populate the form with the entry data
        document.getElementById("dict-key").value = entryToEdit.key;
        document.getElementById("dict-value").value = entryToEdit.value;

        // Set editing state
        editingDictId = id;
        dictionaryForm.querySelector('button[type="submit"]').textContent =
          "Update Dictionary Entry";

        // Scroll to top of the page to show the form
        window.scrollTo(0, 0);

        // Focus on the first form field
        document.getElementById("dict-key").focus();
      }
    });
  }

  function updateDictionaryEntry(id, key, value) {
    chrome.storage.local.get(["dictionary", "customHeaders"], (data) => {
      const dictionary = data.dictionary || [];
      const headers = data.customHeaders || [];

      // Find original entry for logging
      const originalEntry = dictionary.find((d) => d.id === id);
      const oldKey = originalEntry ? originalEntry.key : null;
      const oldValue = originalEntry ? originalEntry.value : null;

      // Check if any headers are using this dictionary entry before making changes
      const headersUsingThisEntry = headers.filter(
        (h) => h.valueSource === "dictionary" && h.value === oldKey
      );

      // Find and update the entry
      const updatedDictionary = dictionary.map((d) => {
        if (d.id === id) {
          return { ...d, key, value };
        }
        return d;
      });

      // Save to storage
      chrome.storage.local.set({ dictionary: updatedDictionary }, () => {
        // Refresh the list
        dictionaryList.innerHTML = "";
        updatedDictionary.forEach(displayDictionaryEntry);

        // Update the dropdown
        updateDictionaryDropdown();

        // Only update rules if the key changed or if headers are using this entry
        // Value changes automatically reflect in rules without needing to update them
        const keyChanged = oldKey !== key;
        const valueChanged = oldValue !== value;

        if (keyChanged) {
          // If key changed, update headers referencing the old key
          updateHeadersUsingDictionary(id, key);
        } else if (valueChanged && headersUsingThisEntry.length > 0) {
          // If only value changed and headers are using this entry, update rules
          updateRules(headers);
        }
      });
    });
  }

  function deleteDictionaryEntry(id) {
    chrome.storage.local.get(["dictionary", "customHeaders"], (data) => {
      const dictionary = data.dictionary || [];
      const headers = data.customHeaders || [];

      // Get the key of the entry being deleted
      const entryToDelete = dictionary.find((d) => d.id === id);

      if (!entryToDelete) return;

      // Check if any headers are using this dictionary entry
      const headersUsingEntry = headers.filter(
        (h) => h.valueSource === "dictionary" && h.value === entryToDelete.key
      );

      if (headersUsingEntry.length > 0) {
        if (
          !confirm(
            `This dictionary entry is used by ${headersUsingEntry.length} header(s). Deleting it may break those headers. Continue?`
          )
        ) {
          return; // User cancelled
        }
      }

      // Filter out the entry to delete
      const updatedDictionary = dictionary.filter((d) => d.id !== id);

      // Update storage
      chrome.storage.local.set({ dictionary: updatedDictionary }, () => {
        // Remove from UI
        document.querySelector(`.dictionary-item[data-id="${id}"]`).remove();

        // Update the dropdown
        updateDictionaryDropdown();
      });
    });
  }

  function updateDictionaryDropdown() {
    chrome.storage.local.get("dictionary", (data) => {
      const dictionary = data.dictionary || [];

      // Clear existing options except the first one
      while (headerValueKeySelect.options.length > 1) {
        headerValueKeySelect.remove(1);
      }

      // Add dictionary entries as options
      dictionary.forEach((entry) => {
        const option = document.createElement("option");
        option.value = entry.key;
        option.textContent = `${entry.key}`;
        headerValueKeySelect.appendChild(option);
      });
    });
  }

  function updateHeadersUsingDictionary(dictId, newKey) {
    chrome.storage.local.get(["customHeaders", "dictionary"], (data) => {
      const headers = data.customHeaders || [];
      const dictionary = data.dictionary || [];

      // Find the old key
      const oldEntry = dictionary.find((d) => d.id === dictId);
      if (!oldEntry || oldEntry.key === newKey) return; // No change needed

      const oldKey = oldEntry.key;

      // Update headers that use the old key
      const updatedHeaders = headers.map((header) => {
        if (header.valueSource === "dictionary" && header.value === oldKey) {
          return { ...header, value: newKey };
        }
        return header;
      });

      // Save updated headers
      chrome.storage.local.set({ customHeaders: updatedHeaders }, () => {
        // Refresh header list if we're on that tab
        if (
          document
            .querySelector('.tab[data-tab="headers"]')
            .classList.contains("active")
        ) {
          headerList.innerHTML = "";
          updatedHeaders.forEach(displayHeader);
        }

        // Update rules
        updateRules(updatedHeaders);
      });
    });
  }

  function updateRules(headers) {
    // First check if extension is enabled globally
    chrome.storage.local.get('extensionEnabled', (enabledData) => {
      // If extension is disabled, send empty rules
      if (enabledData.extensionEnabled === false) {
        chrome.runtime.sendMessage({
          action: 'updateRules',
          headers: [],
        });
        return;
      }
      
      // Extension is enabled, proceed normally
      // Filter out inactive headers
      const activeHeaders = headers.filter(h => h.active !== false);
      
      // Always fetch the latest dictionary values
      chrome.storage.local.get("dictionary", (data) => {
        const dictionary = data.dictionary || [];

        // Create a map for quick lookup
        const dictionaryMap = {};
        dictionary.forEach((entry) => {
          dictionaryMap[entry.key] = entry.value;
        });

        // Process headers
        const processedHeaders = activeHeaders.map((header) => {
          const processedHeader = { ...header };

          // If using dictionary, resolve the actual header value from the CURRENT dictionary
          if (
            header.valueSource === "dictionary" &&
            dictionaryMap[header.value]
          ) {
            processedHeader.resolvedValue = dictionaryMap[header.value];
          } else {
            processedHeader.resolvedValue = header.value;
          }

          return processedHeader;
        });

        // Send message to background script
        chrome.runtime.sendMessage({
          action: 'updateRules',
          headers: processedHeaders,
        });
      });
    });
  }

  function toggleHeaderActive(id, isActive) {
    chrome.storage.local.get("customHeaders", (data) => {
      const headers = data.customHeaders || [];
      
      // Find and update the header
      const updatedHeaders = headers.map(h => {
        if (h.id === id) {
          return { ...h, active: isActive };
        }
        return h;
      });
      
      // Save to storage
      chrome.storage.local.set({ customHeaders: updatedHeaders }, () => {
        // Update the UI
        const headerItem = document.querySelector(`.header-item[data-id="${id}"]`);
        if (isActive) {
          headerItem.classList.remove('header-disabled');
        } else {
          headerItem.classList.add('header-disabled');
        }
        
        // Update the rules (only include active headers)
        updateRules(updatedHeaders);
      });
    });
  }

  // Handle global extension toggle
  const extensionToggle = document.getElementById('extension-toggle');
  const toggleLabel = document.querySelector('.toggle-label');
  
  // Load saved extension state
  chrome.storage.local.get('extensionEnabled', (data) => {
    // Default to enabled if not set
    const enabled = data.extensionEnabled !== false;
    extensionToggle.checked = enabled;
    toggleLabel.textContent = enabled ? 'Extension Enabled' : 'Extension Disabled';
    
    // Update UI based on state
    if (!enabled) {
      document.querySelectorAll('form, .header-list, .dictionary-list').forEach(el => {
        el.style.opacity = '0.5';
        el.style.pointerEvents = 'none';
      });
    }
  });
  
  // Handle toggle changes
  extensionToggle.addEventListener('change', () => {
    const enabled = extensionToggle.checked;
    toggleLabel.textContent = enabled ? 'Extension Enabled' : 'Extension Disabled';
    
    // Save state
    chrome.storage.local.set({ extensionEnabled: enabled }, () => {
      // Update UI
      document.querySelectorAll('form, .header-list, .dictionary-list').forEach(el => {
        el.style.opacity = enabled ? '1' : '0.5';
        el.style.pointerEvents = enabled ? 'auto' : 'none';
      });
      
      // Notify background script about the state change
      chrome.runtime.sendMessage({ 
        action: 'setExtensionState', 
        enabled: enabled 
      });
    });
  });

  // Helper function to escape HTML
  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});

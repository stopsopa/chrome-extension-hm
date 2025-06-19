// popup.js - Handles the popup UI and user interactions

// Import any dependencies (to be added if needed)
// import { someFunction } from './utils.js';

import { toFlat } from "./formats.js";

document.addEventListener("DOMContentLoaded", () => {
  // Initialize filter variables globally at the top
  let filterValue = "";
  let filterField = "label";

  // Load saved filter state
  chrome.storage.local.get(["headerFilterValue", "headerFilterField"], (data) => {
    if (data.headerFilterValue) {
      filterValue = data.headerFilterValue;
      document.getElementById("header-filter-input").value = filterValue;
    }

    if (data.headerFilterField) {
      filterField = data.headerFilterField;
      document.querySelector(`input[name="header-filter-criteria"][value="${filterField}"]`).checked = true;
    }

    // If we have a saved filter, apply it immediately
    if (filterValue) {
      renderFilteredHeaders();
    }
  });

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

  // Initialize header entry counter
  let headerEntryCounter = 1;

  // Add Header Entry button
  const addHeaderBtn = document.getElementById("add-header-btn");
  addHeaderBtn.addEventListener("click", () => {
    addHeaderEntry();
  });

  // Function to add a new header entry
  function addHeaderEntry(headerName = "", headerValue = "", valueSource = "manual") {
    const container = document.getElementById("header-entries-container");
    const index = headerEntryCounter++;

    const headerEntry = document.createElement("div");
    headerEntry.className = "header-entry";
    headerEntry.dataset.index = index;

    headerEntry.innerHTML = `
      <button type="button" class="remove-header-btn" title="Remove this header">&#9851;&#65039;</button>
      
      <div class="form-group">
        <label for="header-name-${index}">Header Name:</label>
        <input type="text" id="header-name-${index}" class="header-name" placeholder="X-Custom-Header" required value="${escapeHtml(
      headerName
    )}" />
      </div>

      <div class="form-group value-source-group">
        <label style="display: inline-block; margin-right: 10px">Value Source:</label>
        <label class="radio-label">
          <input type="radio" name="value-source-${index}" value="manual" class="value-source" ${
      valueSource === "manual" ? "checked" : ""
    } /> Manual
        </label>
        <label class="radio-label">
          <input type="radio" name="value-source-${index}" value="dictionary" class="value-source" ${
      valueSource === "dictionary" ? "checked" : ""
    } /> Dictionary
        </label>
      </div>

      <div class="form-group value-source-manual" ${valueSource === "dictionary" ? 'style="display: none"' : ""}>
        <label for="header-value-${index}">Header Value:</label>
        <input type="text" id="header-value-${index}" class="header-value" placeholder="CustomValue" ${
      valueSource === "manual" ? "required" : ""
    } value="${valueSource === "manual" ? escapeHtml(headerValue) : ""}" />
      </div>

      <div class="form-group value-source-dictionary" ${valueSource === "manual" ? 'style="display: none"' : ""}>
        <label for="header-value-key-${index}">Select Value:</label>
        <select id="header-value-key-${index}" class="header-value-key" ${
      valueSource === "dictionary" ? "required" : ""
    }>
          <option value="">-- Select from dictionary --</option>
        </select>
      </div>
    `;

    container.appendChild(headerEntry);

    // Add event listener for remove button
    headerEntry.querySelector(".remove-header-btn").addEventListener("click", function () {
      headerEntry.remove();
    });

    // Add event listeners for value source radio buttons
    const valueSourceRadios = headerEntry.querySelectorAll(".value-source");
    const manualInputGroup = headerEntry.querySelector(".value-source-manual");
    const dictionaryInputGroup = headerEntry.querySelector(".value-source-dictionary");

    valueSourceRadios.forEach((radio) => {
      radio.addEventListener("change", function () {
        if (this.value === "manual") {
          manualInputGroup.style.display = "block";
          dictionaryInputGroup.style.display = "none";
          // Set required attributes correctly
          headerEntry.querySelector(".header-value").required = true;
          headerEntry.querySelector(".header-value-key").required = false;
        } else {
          manualInputGroup.style.display = "none";
          dictionaryInputGroup.style.display = "block";
          // Set required attributes correctly
          headerEntry.querySelector(".header-value").required = false;
          headerEntry.querySelector(".header-value-key").required = true;
        }
      });
    });

    // Update the dictionary dropdown
    updateDictionaryDropdownInEntry(headerEntry.querySelector(".header-value-key"));

    // If it's from the dictionary, select the right value
    if (valueSource === "dictionary") {
      setTimeout(() => {
        const select = headerEntry.querySelector(".header-value-key");
        if (select && headerValue) {
          select.value = headerValue;
        }
      }, 100);
    }

    return headerEntry;
  }

  // Handle value source switching with radio buttons (for the first/default entry)
  setupInitialHeaderEntry();

  function setupInitialHeaderEntry() {
    const initialEntry = document.querySelector('.header-entry[data-index="0"]');
    if (!initialEntry) return;

    const valueSourceRadios = initialEntry.querySelectorAll(".value-source");
    const manualInputGroup = initialEntry.querySelector(".value-source-manual");
    const dictionaryInputGroup = initialEntry.querySelector(".value-source-dictionary");

    // Make sure required attributes are set correctly on initial load
    initialEntry.querySelector(".header-value").required = true;
    initialEntry.querySelector(".header-value-key").required = false;

    valueSourceRadios.forEach((radio) => {
      radio.addEventListener("change", (e) => {
        if (e.target.value === "manual") {
          manualInputGroup.style.display = "block";
          dictionaryInputGroup.style.display = "none";
          // Set required attributes correctly
          initialEntry.querySelector(".header-value").required = true;
          initialEntry.querySelector(".header-value-key").required = false;
        } else {
          manualInputGroup.style.display = "none";
          dictionaryInputGroup.style.display = "block";
          // Set required attributes correctly
          initialEntry.querySelector(".header-value").required = false;
          initialEntry.querySelector(".header-value-key").required = true;
        }
      });
    });

    // Add remove button handler
    initialEntry.querySelector(".remove-header-btn").addEventListener("click", function () {
      // Don't allow removing the last header entry
      const entries = document.querySelectorAll(".header-entry");
      if (entries.length <= 1) {
        alert("You need at least one header entry.");
        return;
      }
      initialEntry.remove();
    });
  }

  // Get form and list elements
  const headerForm = document.getElementById("header-form");
  const headerList = document.getElementById("header-list");
  const dictionaryForm = document.getElementById("dictionary-form");
  const dictionaryList = document.getElementById("dictionary-list");

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
    const urlPattern = document.getElementById("url-pattern").value.trim() || "*";

    // Get all header entries
    const headerEntries = document.querySelectorAll(".header-entry");
    const headers = {};

    // Validate that we have at least one header
    if (headerEntries.length === 0) {
      alert("Please add at least one header.");
      return;
    }

    // Process each header entry
    for (const entry of headerEntries) {
      const index = entry.dataset.index;
      const headerName = entry.querySelector(".header-name").value.trim();

      // Skip empty header names
      if (!headerName) continue;

      const valueSource = entry.querySelector(".value-source:checked").value;
      let headerValue;

      if (valueSource === "manual") {
        headerValue = entry.querySelector(".header-value").value.trim();
      } else {
        headerValue = entry.querySelector(".header-value-key").value;
      }

      // Validate required fields
      if ((valueSource === "manual" && !headerValue) || (valueSource === "dictionary" && !headerValue)) {
        alert(`Please fill in all required fields for header "${headerName}".`);
        return;
      }

      // Add to headers object
      headers[headerName] = {
        value: headerValue,
        source: valueSource,
      };
    }

    if (editingHeaderId) {
      // Update existing header
      updateHeader(editingHeaderId, headerLabel, urlPattern, headers);
      // Reset editing state
      editingHeaderId = null;
      document.querySelector('button[type="submit"]').textContent = "Add Rule";
    } else {
      // Add new header
      addHeader(headerLabel, urlPattern, headers);
    }

    // Clear the form
    headerForm.reset();

    // Reset header entries to just one
    document.getElementById("header-entries-container").innerHTML = "";
    const newEntry = addHeaderEntry();
    headerEntryCounter = 1;

    // Reset to manual mode for first entry (using the newly created entry)
    // No need to query for elements that might not exist yet
    const manualRadio = newEntry.querySelector('.value-source[value="manual"]');
    if (manualRadio) {
      manualRadio.checked = true;
      // Trigger the change event
      manualRadio.dispatchEvent(new Event("change"));
    }
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
      dictionaryForm.querySelector('button[type="submit"]').textContent = "Add Dictionary Entry";
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
  cancelButton.className = "cancel-edit-btn";

  cancelButton.addEventListener("click", () => {
    // Reset form and editing state
    headerForm.reset();
    editingHeaderId = null;
    document.querySelector('button[type="submit"]').textContent = "Add Rule";
    cancelButton.style.display = "none";
    createNewButton.style.display = "none";
    createNewButton.textContent = "Create New";

    // Reset header entries to just one
    document.getElementById("header-entries-container").innerHTML = "";
    const newEntry = addHeaderEntry();
    headerEntryCounter = 1;

    // Reset to manual mode for first entry (using the newly created entry)
    const manualRadio = newEntry.querySelector('.value-source[value="manual"]');
    if (manualRadio) {
      manualRadio.checked = true;
      // Trigger the change event
      manualRadio.dispatchEvent(new Event("change"));
    }
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
    const urlPattern = document.getElementById("url-pattern").value.trim() || "*";

    // Get all header entries
    const headerEntries = document.querySelectorAll(".header-entry");
    const headers = {};

    // Process each header entry
    for (const entry of headerEntries) {
      const index = entry.dataset.index;
      const headerName = entry.querySelector(".header-name").value.trim();

      // Skip empty header names
      if (!headerName) continue;

      const valueSource = entry.querySelector(".value-source:checked").value;
      let headerValue;

      if (valueSource === "manual") {
        headerValue = entry.querySelector(".header-value").value.trim();
      } else {
        headerValue = entry.querySelector(".header-value-key").value;
      }

      // Validate required fields
      if ((valueSource === "manual" && !headerValue) || (valueSource === "dictionary" && !headerValue)) {
        alert(`Please fill in all required fields for header "${headerName}".`);
        return;
      }

      // Add to headers object
      headers[headerName] = {
        value: headerValue,
        source: valueSource,
      };
    }

    // Check if inputs are valid
    if (!headerLabel || Object.keys(headers).length === 0) {
      alert("Please fill in all required fields");
      return;
    }

    // Add new header based on current values
    chrome.storage.local.get("customHeaders", (data) => {
      const headersArray = data.customHeaders || [];

      // Generate a unique ID for the header
      const id = Date.now().toString();

      // Add the new header
      headersArray.push({
        id,
        label: headerLabel,
        urlPattern: urlPattern,
        headers: headers,
        active: true,
      });

      // Save to storage - convert to flat format before saving
      chrome.storage.local.set({ customHeaders: toFlat(headersArray) }, () => {
        // Display the new header with respect to filtering
        if (filterValue) {
          renderFilteredHeaders();
        } else {
          displayHeader({
            id,
            label: headerLabel,
            urlPattern: urlPattern,
            headers: headers,
            active: true,
          });
        }

        // Update the rules
        updateRules(headersArray);

        // Reset editing state but keep form values
        editingHeaderId = null;
        document.querySelector('button[type="submit"]').textContent = "Add Rule";
        document.querySelector(".cancel-edit-btn").style.display = "none";
        createNewButton.style.display = "none";
      });
    });
  });

  // Append create new button after the cancel button
  cancelButton.after(createNewButton);

  function addHeader(label, urlPattern, headers) {
    // Get existing headers from storage
    chrome.storage.local.get("customHeaders", (data) => {
      const headersArray = data.customHeaders || [];

      // Generate a unique ID for the header
      const id = Date.now().toString();

      // Add the new header (active by default)
      headersArray.push({
        id,
        label,
        urlPattern,
        headers,
        active: true,
      });

      // Save to storage - convert to flat format before saving
      chrome.storage.local.set({ customHeaders: toFlat(headersArray) }, () => {
        // If filtering is active, re-render the filtered list
        if (filterValue) {
          renderFilteredHeaders();
        } else {
          // Otherwise just display the new header
          displayHeader({
            id,
            label,
            urlPattern,
            headers,
            active: true,
          });
        }

        // Update the rules
        updateRules(headersArray);
      });
    });
  }

  function loadHeaders() {
    chrome.storage.local.get("customHeaders", (data) => {
      const headers = data.customHeaders || [];

      // Check if we need to migrate the data structure
      const needsMigration = headers.length > 0 && headers[0].name !== undefined;

      if (needsMigration) {
        // Migrate old format to new format
        const migratedHeaders = headers.map((h) => {
          return {
            id: h.id,
            label: h.label || "",
            urlPattern: h.urlPattern || "*",
            active: h.active !== false,
            headers: {
              [h.name]: {
                value: h.value || "",
                source: h.valueSource || "manual",
              },
            },
          };
        });

        // Save migrated data - convert to flat format before saving
        chrome.storage.local.set({ customHeaders: toFlat(migratedHeaders) }, () => {
          // Clear the list
          headerList.innerHTML = "";

          // Display each header
          migratedHeaders.forEach(displayHeader);

          // Update rules
          updateRules(migratedHeaders);
        });
      } else {
        // Clear the list
        headerList.innerHTML = "";

        // Display each header
        headers.forEach(displayHeader);

        // Update rules if needed
        if (headers.length > 0) {
          updateRules(headers);
        }
      }
    });
  }

  // === Header Filtering ===
  const headerFilterInput = document.getElementById("header-filter-input");
  const headerFilterRadios = document.getElementsByName("header-filter-criteria");
  const clearFilterBtn = document.getElementById("clear-filter-btn");

  // Show/hide clear button based on input value
  function updateClearButtonVisibility() {
    clearFilterBtn.style.display = headerFilterInput.value ? "block" : "none";
  }

  // Update clear button on initial load
  if (headerFilterInput.value) {
    updateClearButtonVisibility();
  }

  headerFilterInput.addEventListener("input", () => {
    filterValue = headerFilterInput.value.trim().toLowerCase();
    // Save filter value to storage
    chrome.storage.local.set({ headerFilterValue: filterValue });
    updateClearButtonVisibility();
    renderFilteredHeaders();
  });

  // Clear filter when clear button is clicked
  clearFilterBtn.addEventListener("click", () => {
    headerFilterInput.value = "";
    filterValue = "";
    chrome.storage.local.set({ headerFilterValue: "" });
    updateClearButtonVisibility();
    renderFilteredHeaders();
  });

  headerFilterRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      if (radio.checked) {
        filterField = radio.value;
        // Save filter field to storage
        chrome.storage.local.set({ headerFilterField: filterField });
        renderFilteredHeaders();
      }
    });
  });

  function renderFilteredHeaders() {
    chrome.storage.local.get("customHeaders", (data) => {
      const headers = data.customHeaders || [];
      let filtered = headers;

      if (filterValue) {
        filtered = headers.filter((h) => {
          // Special case for headers object - search through header names and values
          if (filterField === "headers") {
            return Object.keys(h.headers || {}).some((headerName) => {
              return (
                headerName.toLowerCase().includes(filterValue) ||
                (h.headers[headerName].value || "").toLowerCase().includes(filterValue)
              );
            });
          }

          // For normal fields
          if (filterField === "label" || filterField === "urlPattern") {
            const val = (h[filterField] || "").toLowerCase();
            return val.includes(filterValue);
          }

          return false;
        });
      }

      headerList.innerHTML = "";

      if (filtered.length === 0) {
        // Show a nice notification if nothing matches
        const criteriaLabel =
          {
            label: "label",
            urlPattern: "URL pattern",
            headers: "headers",
          }[filterField] || filterField;

        const note = document.createElement("div");
        note.style.padding = "24px 8px";
        note.style.textAlign = "center";
        note.style.color = "#888";
        note.style.background = "#f8f8f8";
        note.style.borderRadius = "6px";
        note.style.fontSize = "15px";
        note.innerHTML = `Nothing found when filtering with <b>${criteriaLabel}</b> including <b>${escapeHtml(
          filterValue
        )}</b>.`;
        headerList.appendChild(note);
        return;
      }

      filtered.forEach(displayHeader);
    });
  }

  // Clear filter when input is cleared
  headerFilterInput.addEventListener("search", () => {
    if (!headerFilterInput.value.trim()) {
      filterValue = "";
      chrome.storage.local.set({ headerFilterValue: "" });
      renderFilteredHeaders();
    }
  });

  // Patch loadHeaders to use filtering if filter is active
  const origLoadHeaders = loadHeaders;
  loadHeaders = function () {
    if (filterValue) {
      renderFilteredHeaders();
    } else {
      origLoadHeaders();
    }
  };

  function displayHeader(header) {
    const headerItem = document.createElement("div");
    headerItem.className = "header-item";

    // Add disabled class if header is not active
    if (header.active === false) {
      headerItem.classList.add("header-disabled");
    }

    headerItem.dataset.id = header.id;

    const labelDisplay = header.label ? `<div class="header-label">${escapeHtml(header.label)}</div>` : "";

    // Create the headers list display
    let headersListHtml = "";

    if (header.headers && Object.keys(header.headers).length > 0) {
      headersListHtml = '<div class="headers-list">';

      for (const [headerName, headerConfig] of Object.entries(header.headers)) {
        const valueSource = headerConfig.source || "manual";
        const value = headerConfig.value || "";

        const valueDisplay =
          valueSource === "dictionary" ? `(from dictionary) ${escapeHtml(value)}` : escapeHtml(value);

        headersListHtml += `
          <div class="header-entry-display">
            <span class="header-detail"><b>${escapeHtml(headerName)}:</b> ${valueDisplay}</span>
          </div>
        `;
      }

      headersListHtml += "</div>";
    }

    headerItem.innerHTML = `
      <input type="checkbox" class="header-checkbox" title="Enable/Disable this rule" ${
        header.active !== false ? "checked" : ""
      }>
      <button class="delete-btn" title="Delete this rule">&#9851;&#65039;</button>
      <button class="edit-btn" title="Edit this rule">&#9999;&#65039;</button>
      ${labelDisplay}
      <div class="header-detail"><b>Pattern:</b> ${escapeHtml(header.urlPattern)}</div>
      ${headersListHtml}
    `;

    // Add delete button event listener
    headerItem.querySelector(".delete-btn").addEventListener("click", (e) => {
      const deleteBtn = e.target;

      // Create a confirmation popup if it doesn't exist
      let confirmationPopup = headerItem.querySelector(".delete-confirmation");

      if (!confirmationPopup) {
        // Hide the delete button temporarily
        deleteBtn.style.display = "none";

        // Create a confirmation popup
        confirmationPopup = document.createElement("div");
        confirmationPopup.className = "delete-confirmation";

        // Create "Cancel" button
        const cancelBtn = document.createElement("button");
        cancelBtn.textContent = "Cancel";
        cancelBtn.className = "cancel-btn";
        cancelBtn.addEventListener("click", () => {
          // Remove the confirmation popup and show the delete button again
          confirmationPopup.remove();
          deleteBtn.style.display = "block";
        });

        // Create "Proceed" button
        const proceedBtn = document.createElement("button");
        proceedBtn.textContent = "Proceed";
        proceedBtn.className = "proceed-btn";
        proceedBtn.addEventListener("click", () => {
          deleteHeader(header.id);
        });

        // Add buttons to the popup - Cancel first, then Proceed
        confirmationPopup.appendChild(cancelBtn);
        confirmationPopup.appendChild(proceedBtn);

        // Add the popup to the header item
        headerItem.appendChild(confirmationPopup);
      }
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
        // Clear existing header entries
        document.getElementById("header-entries-container").innerHTML = "";
        headerEntryCounter = 0;

        // Populate the form with the header data
        document.getElementById("header-label").value = headerToEdit.label || "";
        document.getElementById("url-pattern").value = headerToEdit.urlPattern || "*";

        // Create header entries for each header
        if (headerToEdit.headers && Object.keys(headerToEdit.headers).length > 0) {
          for (const [headerName, headerConfig] of Object.entries(headerToEdit.headers)) {
            const valueSource = headerConfig.source || "manual";
            const value = headerConfig.value || "";

            addHeaderEntry(headerName, value, valueSource);
          }
        } else {
          // Add a default empty header entry if none exists
          addHeaderEntry();
        }

        // Set editing state
        editingHeaderId = id;
        document.querySelector('button[type="submit"]').textContent = "Update Rule";
        document.querySelector(".cancel-edit-btn").style.display = "inline-block";
        document.getElementById("create-new").style.display = "inline-block";

        // Scroll to top of the page to show the form
        window.scrollTo(0, 0);

        // Focus on the first form field
        document.getElementById("header-label").focus();
      }
    });
  }

  function updateHeader(id, label, urlPattern, headers) {
    chrome.storage.local.get("customHeaders", (data) => {
      const headersArray = data.customHeaders || [];

      // Find and update the header
      const updatedHeaders = headersArray.map((h) => {
        if (h.id === id) {
          return { ...h, label, urlPattern, headers };
        }
        return h;
      });

      // Save to storage - convert to flat format before saving
      chrome.storage.local.set({ customHeaders: toFlat(updatedHeaders) }, () => {
        // Refresh the list with filtering if active
        headerList.innerHTML = "";
        if (filterValue) {
          renderFilteredHeaders();
        } else {
          updatedHeaders.forEach(displayHeader);
        }

        // Update the rules
        updateRules(updatedHeaders);

        // Hide buttons
        document.querySelector(".cancel-edit-btn").style.display = "none";
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

      // Update storage - convert to flat format before saving
      chrome.storage.local.set({ customHeaders: toFlat(updatedHeaders) }, () => {
        // Either remove the item from UI or rerender the filtered list
        if (filterValue) {
          // If filtering is active, re-render the entire filtered list
          renderFilteredHeaders();
        } else {
          // If no filtering, just remove the deleted item from DOM
          document.querySelector(`.header-item[data-id="${id}"]`).remove();
        }

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
    dictionaryItem.querySelector(".delete-btn").addEventListener("click", (e) => {
      const deleteBtn = e.target;

      // Create a confirmation popup if it doesn't exist
      let confirmationPopup = dictionaryItem.querySelector(".delete-confirmation");

      if (!confirmationPopup) {
        // Hide the delete button temporarily
        deleteBtn.style.display = "none";

        // Create a confirmation popup
        confirmationPopup = document.createElement("div");
        confirmationPopup.className = "delete-confirmation";

        // Create "Cancel" button
        const cancelBtn = document.createElement("button");
        cancelBtn.textContent = "Cancel";
        cancelBtn.className = "cancel-btn";
        cancelBtn.addEventListener("click", () => {
          // Remove the confirmation popup and show the delete button again
          confirmationPopup.remove();
          deleteBtn.style.display = "block";
        });

        // Create "Proceed" button
        const proceedBtn = document.createElement("button");
        proceedBtn.textContent = "Proceed";
        proceedBtn.className = "proceed-btn";
        proceedBtn.addEventListener("click", () => {
          deleteDictionaryEntry(entry.id);
        });

        // Add buttons to the popup
        confirmationPopup.appendChild(cancelBtn);
        confirmationPopup.appendChild(proceedBtn);

        // Add the popup to the dictionary item
        dictionaryItem.appendChild(confirmationPopup);
      }
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
        dictionaryForm.querySelector('button[type="submit"]').textContent = "Update Dictionary Entry";

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
      const headersUsingThisEntry = headers.filter((h) => {
        if (!h.headers) return false;

        return Object.values(h.headers).some(
          (headerConfig) => headerConfig.source === "dictionary" && headerConfig.value === oldKey
        );
      });

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
      const headersUsingEntry = headers.filter((h) => {
        if (!h.headers) return false;

        return Object.values(h.headers).some(
          (headerConfig) => headerConfig.source === "dictionary" && headerConfig.value === entryToDelete.key
        );
      });

      if (headersUsingEntry.length > 0) {
        if (
          !confirm(
            `This dictionary entry is used by ${headersUsingEntry.length} rule(s). Deleting it may break those rules. Continue?`
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

      // Update all header value key dropdowns
      const dropdowns = document.querySelectorAll(".header-value-key");

      dropdowns.forEach((dropdown) => {
        // Clear existing options except the first one
        while (dropdown.options.length > 1) {
          dropdown.remove(1);
        }

        // Add dictionary entries as options
        dictionary.forEach((entry) => {
          const option = document.createElement("option");
          option.value = entry.key;
          option.textContent = `${entry.key}`;
          dropdown.appendChild(option);
        });
      });
    });
  }

  function updateDictionaryDropdownInEntry(dropdown) {
    chrome.storage.local.get("dictionary", (data) => {
      const dictionary = data.dictionary || [];

      // Clear existing options except the first one
      while (dropdown.options.length > 1) {
        dropdown.remove(1);
      }

      // Add dictionary entries as options
      dictionary.forEach((entry) => {
        const option = document.createElement("option");
        option.value = entry.key;
        option.textContent = `${entry.key}`;
        dropdown.appendChild(option);
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
      const updatedHeaders = headers.map((rule) => {
        if (!rule.headers) return rule;

        const updatedHeaders = {};
        let changed = false;

        // Check each header in the rule
        for (const [headerName, headerConfig] of Object.entries(rule.headers)) {
          if (headerConfig.source === "dictionary" && headerConfig.value === oldKey) {
            updatedHeaders[headerName] = { ...headerConfig, value: newKey };
            changed = true;
          } else {
            updatedHeaders[headerName] = headerConfig;
          }
        }

        return changed ? { ...rule, headers: updatedHeaders } : rule;
      });

      // Save updated headers - convert to flat format before saving
      chrome.storage.local.set({ customHeaders: toFlat(updatedHeaders) }, () => {
        // Refresh header list if we're on that tab
        if (document.querySelector('.tab[data-tab="headers"]').classList.contains("active")) {
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
    chrome.storage.local.get("extensionEnabled", (enabledData) => {
      // If extension is disabled, send empty rules
      if (enabledData.extensionEnabled === false) {
        chrome.runtime.sendMessage({
          action: "updateRules",
          headers: [],
        });
        return;
      }

      // Extension is enabled, proceed normally
      // Filter out inactive headers
      const activeHeaders = headers.filter((h) => h.active !== false);

      // Always fetch the latest dictionary values
      chrome.storage.local.get("dictionary", (data) => {
        const dictionary = data.dictionary || [];

        // Create a map for quick lookup
        const dictionaryMap = {};
        dictionary.forEach((entry) => {
          dictionaryMap[entry.key] = entry.value;
        });

        // Process headers
        const processedHeaders = activeHeaders.map((rule) => {
          // Clone the rule to avoid modifying the original
          const processedRule = { ...rule };

          // Process headers object if it exists
          if (processedRule.headers) {
            // Create resolved headers for the background script
            processedRule.resolvedHeaders = {};

            for (const [headerName, headerConfig] of Object.entries(processedRule.headers)) {
              if (headerConfig.source === "dictionary") {
                const dictValue = dictionaryMap[headerConfig.value];
                processedRule.resolvedHeaders[headerName] = dictValue !== undefined ? dictValue : headerConfig.value;
              } else {
                processedRule.resolvedHeaders[headerName] = headerConfig.value;
              }
            }
          } else if (rule.name) {
            // Legacy format compatibility
            processedRule.resolvedHeaders = {
              [rule.name]:
                rule.valueSource === "dictionary" && dictionaryMap[rule.value] ? dictionaryMap[rule.value] : rule.value,
            };
          }

          return processedRule;
        });

        // Send message to background script
        chrome.runtime.sendMessage({
          action: "updateRules",
          headers: processedHeaders,
        });
      });
    });
  }

  function toggleHeaderActive(id, isActive) {
    chrome.storage.local.get("customHeaders", (data) => {
      const headers = data.customHeaders || [];

      // Find and update the header
      const updatedHeaders = headers.map((h) => {
        if (h.id === id) {
          return { ...h, active: isActive };
        }
        return h;
      });

      // Save to storage - convert to flat format before saving
      chrome.storage.local.set({ customHeaders: toFlat(updatedHeaders) }, () => {
        // Update the UI based on whether filtering is active
        if (filterValue) {
          // If filtering is active, re-render the entire filtered list
          renderFilteredHeaders();
        } else {
          // If no filtering, just update the class on the specific item
          const headerItem = document.querySelector(`.header-item[data-id="${id}"]`);
          if (headerItem) {
            if (isActive) {
              headerItem.classList.remove("header-disabled");
            } else {
              headerItem.classList.add("header-disabled");
            }
          }
        }

        // Update the rules (only include active headers)
        updateRules(updatedHeaders);
      });
    });
  }

  // Handle global extension toggle
  const extensionToggle = document.getElementById("extension-toggle");
  const toggleLabel = document.querySelector(".toggle-label");

  // Load saved extension state
  chrome.storage.local.get("extensionEnabled", (data) => {
    // Default to enabled if not set
    const enabled = data.extensionEnabled !== false;
    extensionToggle.checked = enabled;
    toggleLabel.textContent = enabled ? "Extension Enabled" : "Extension Disabled";

    // Update UI based on state
    if (!enabled) {
      document.querySelectorAll("form, .header-list, .dictionary-list").forEach((el) => {
        el.style.opacity = "0.5";
        el.style.pointerEvents = "none";
      });
    }
  });

  // Handle toggle changes
  extensionToggle.addEventListener("change", () => {
    const enabled = extensionToggle.checked;
    toggleLabel.textContent = enabled ? "Extension Enabled" : "Extension Disabled";

    // Save state
    chrome.storage.local.set({ extensionEnabled: enabled }, () => {
      // Update UI
      document.querySelectorAll("form, .header-list, .dictionary-list").forEach((el) => {
        el.style.opacity = enabled ? "1" : "0.5";
        el.style.pointerEvents = enabled ? "auto" : "none";
      });

      // Notify background script about the state change
      chrome.runtime.sendMessage({
        action: "setExtensionState",
        enabled: enabled,
      });
    });
  });

  // === Export/Import Custom Headers ===
  const exportBtn = document.getElementById("export-headers-btn");
  const clearBtn = document.getElementById("clear-headers-btn");
  const importAddBtn = document.getElementById("import-headers-add-btn");
  const importAddFile = document.getElementById("import-headers-add-file");

  exportBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "exportCustomHeaders" }, (response) => {
      if (response && response.json) {
        const blob = new Blob([response.json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download =
          new Date().toISOString().substring(0, 19).replace("T", "_").replace(/:/g, "-") + "_customHeaders.json";
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
      }
    });
  });

  clearBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to remove all headers?")) {
      chrome.storage.local.set({ customHeaders: [] }, () => {
        // Update the UI
        headerList.innerHTML = "";
        // Notify background script to clear rules
        chrome.runtime.sendMessage({ action: "updateRules", headers: [] });
        alert("All headers have been cleared.");
      });
    }
  });

  importAddBtn.addEventListener("click", () => {
    importAddFile.value = "";
    importAddFile.click();
  });

  importAddFile.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      let imported = [];
      try {
        imported = JSON.parse(event.target.result);
      } catch (err) {
        alert("Import failed: Invalid JSON");
        return;
      }
      if (!Array.isArray(imported)) {
        alert("Import failed: JSON must be an array");
        return;
      }

      // Check for old format and migrate if needed
      if (imported.length > 0 && imported[0].name !== undefined) {
        // Migrate old format to new format
        imported = imported.map((h) => ({
          id: h.id,
          label: h.label || "",
          urlPattern: h.urlPattern || "*",
          active: h.active !== false,
          headers: {
            [h.name]: {
              value: h.value || "",
              source: h.valueSource || "manual",
            },
          },
        }));
      }

      // Add to existing headers
      chrome.storage.local.get("customHeaders", (data) => {
        const existing = data.customHeaders || [];
        // Avoid duplicate IDs, generate new ones for imported
        const now = Date.now();
        const importedWithIds = imported.map((h, i) => ({ ...h, id: (now + i).toString() }));
        const merged = existing.concat(importedWithIds);
        chrome.storage.local.set({ customHeaders: toFlat(merged) }, () => {
          // Respect filtering when loading headers after import
          if (filterValue) {
            renderFilteredHeaders();
          } else {
            loadHeaders();
          }
          alert("Headers imported and added successfully!");
        });
      });
    };
    reader.readAsText(file);
  });

  // Helper function to escape HTML
  function escapeHtml(str) {
    if (typeof str !== "string") return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});

// Export any functions that might be needed by other modules
// export { someFunction };

# Privacy Justifications for Chrome Extension

## Single Purpose Description
This extension modifies HTTP request headers to enhance web interactions by adding custom headers to all outgoing web requests.

## Permissions Justifications

### declarativeNetRequest
This extension uses declarativeNetRequest to efficiently modify HTTP headers in outgoing requests without accessing or exposing sensitive user data. This permission allows the extension to add, modify, or remove HTTP headers based on configurable rules.

### Host Permission
Host permissions for "<all_urls>" are required to modify headers for any website the user visits, ensuring the header modification functionality works across all domains without restrictions. This is essential for the core functionality as users may need to add custom headers for any website.

### Remote Code
Remote code is not intentionally used in this extension. If the Chrome Web Store flagged this, it might be related to how the extension loads and applies rules dynamically from storage. No external scripts are loaded from remote servers.

### Storage
Storage permission is needed to save user preferences, custom header configurations, and rule sets between browser sessions. This allows users to maintain their header modification settings after closing and reopening the browser.

### webRequest
The webRequest permission allows the extension to monitor network requests for debugging purposes and to properly apply the header modifications. This is necessary to ensure headers are correctly applied to the appropriate requests based on user-defined patterns.

## Data Usage Compliance
This extension complies with all Chrome Web Store Developer Program Policies regarding data collection and usage. User data is processed locally within the browser and is not transmitted to any external servers. The extension only modifies outgoing request headers based on user-defined rules and does not collect, store, or share any browsing data or personal information.

## Publication Checklist
- [x] Existing icon128.png in the extension/images folder is already set up
- [ ] Add at least one screenshot to the Chrome Web Store listing
- [ ] Select a category for your extension (suggested: "Productivity" or "Developer Tools")
- [ ] Select a language
- [ ] Write a detailed description (suggested below)
- [ ] Provide contact email and verify it
- [ ] Fill in privacy practices tab with justifications from this document
- [ ] Certify data usage compliance

## Suggested Detailed Description
Header Modifier is a powerful browser extension that allows you to customize HTTP request headers for all your web interactions. Whether you're a developer testing APIs, need to add authentication headers, or want to modify browser fingerprints, this tool gives you complete control over outgoing HTTP headers.

Key features:
- Add, modify, or remove HTTP headers in outgoing requests
- Apply headers globally or to specific URLs using pattern matching
- Save multiple header configurations for different scenarios
- User-friendly interface with real-time header management
- No data collection - all operations happen locally in your browser
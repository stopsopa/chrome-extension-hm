# Header Modifier - Chrome Extension Publishing Guide

This guide will help you resolve all the issues mentioned by the Chrome Web Store when attempting to publish your "Header Modifier" extension.

## Required Actions

### 1. Visual Assets
- **Icon**: Your extension already has the required icon at `extension/icons/icon128.png`
- **Screenshots**: Take at least one screenshot of your extension in action showing the header modification functionality. The screenshot should:
  - Show the popup interface
  - Demonstrate how users add/modify headers
  - Be clear and represent the core functionality

### 2. Update Chrome Web Store Listing
Log into your Chrome Developer Dashboard and update the following:

- **Basic Information**:
  - **Category**: Select "Developer Tools" or "Productivity"
  - **Language**: Select the primary language (e.g., English)
  - **Detailed Description**: Use the suggested description from PRIVACY_JUSTIFICATIONS.md or write your own detailed explanation (minimum 25 characters)

- **Privacy Practices Tab**:
  - **Single Purpose Description**: "This extension modifies HTTP request headers to enhance web interactions by adding custom headers to all outgoing web requests."
  - **Permission Justifications**: Copy the detailed justifications from PRIVACY_JUSTIFICATIONS.md for:
    - declarativeNetRequest
    - Host permissions
    - Remote code
    - Storage
    - webRequest
  - **Data Usage Compliance**: Check the certification box confirming your extension complies with developer program policies

- **Account Tab**:
  - Provide a contact email if not already done
  - Verify your contact email by following the verification link sent to your email

### 3. Upload Assets
- Upload your icon (from `extension/icons/icon128.png`) and screenshots in the appropriate sections of the Chrome Web Store listing

## Using the Privacy Justifications
The `PRIVACY_JUSTIFICATIONS.md` file contains detailed justifications for all the required permissions. You can copy these explanations directly into the Chrome Web Store listing's Privacy Practices tab.

The justifications are:
- Specific to your "Header Modifier" extension's functionality
- Clear about how and why each permission is used
- Aligned with Chrome's developer policies

## Taking Screenshots
To create effective screenshots for your Chrome Web Store listing:

1. Install your extension in developer mode
2. Open the popup by clicking the extension icon
3. Configure some example headers to demonstrate functionality
4. Take a screenshot (on macOS: press Command+Shift+4, then Space, then click on the popup)
5. You may want to show the effect of the headers being applied - perhaps showing a before/after of a network request

## Final Checklist
- [x] Icon is ready in extension/icons/icon128.png
- [ ] Take at least one screenshot of the extension in action
- [ ] Select "Developer Tools" or "Productivity" category
- [ ] Select language
- [ ] Write detailed description (use suggestion from PRIVACY_JUSTIFICATIONS.md)
- [ ] Provide and verify contact email
- [ ] Fill in privacy justifications
- [ ] Certify data usage compliance

Once you've completed all these steps, you should be able to successfully publish your extension.


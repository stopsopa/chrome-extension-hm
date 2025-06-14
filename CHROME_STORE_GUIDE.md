# Chrome Web Store Justification Guide

## How to Enter declarativeNetRequest Justification

1. Log in to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)

2. Navigate to your extension listing 

3. Click on the "Privacy practices" tab

4. In the Privacy practices tab, look for the "Permission justifications" section
   - This is usually below the "Single purpose" section

5. For the declarativeNetRequest permission, copy and paste the following text:
   ```
   This extension uses the declarativeNetRequest permission to modify HTTP headers in outgoing requests. This permission is essential for the core functionality of the extension, which is to add, modify, or remove HTTP headers based on user-defined rules. The declarativeNetRequest API allows the extension to perform these modifications efficiently without accessing or exposing sensitive user data, as it operates at the network request level rather than accessing page content.
   ```

6. Important tips:
   - Make sure to enter the text in the specific field for declarativeNetRequest, not in a general field
   - Click outside the text field after entering the justification to ensure it registers
   - Click "Save draft" after entering the justification
   - Review the field to confirm the text was saved properly

7. Other common issues:
   - Make sure the Single Purpose description is also filled in
   - Ensure all other permission justifications are provided
   - Check that you've certified data usage compliance (checkbox at bottom of Privacy practices)
   - Verify that screenshots are uploaded
   - Confirm category and language are selected

If you're still having issues, try:
- Using a different browser
- Clearing your cache
- Ensuring you're logged in with the correct Google account
- Checking for any character limits (try removing some text if needed)

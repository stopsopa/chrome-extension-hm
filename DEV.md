# some development facts

content-script.js loads before content-script-isolated.js therefore in order to be able to fetch state of "Extension Enabled" from localstorage. Start tracing it by taking look at requestExtensionEnabledState();

# Shared Utility Functions

This document explains how the shared utility functions work in the Website Time Manager extension, following the Stack Overflow solution for sharing functions between background and content scripts.

## How It Works

The extension uses two utility files to handle the different script contexts:

### Background Script (background.js)
- Uses **`utils.js`** with ES6 module imports: `import { extractSite, formatTime, ... } from './utils.js'`
- Functions are imported directly and can be called normally

### Content Script (content.js)
- Uses **`utils-content.js`** which creates a global `WTMUtils` object
- Usage: `WTMUtils.extractSite(hostname)`, `WTMUtils.formatTime(timeMs)`, etc.
- No ES6 modules support, so uses traditional script loading

### Popup Script (popup/popup.js)
- Uses **`utils.js`** with ES6 module imports like the background script
- Functions are imported directly and can be called normally

## Available Shared Functions

### `extractSite(hostname)`
Removes the 'www.' prefix from a hostname.
```javascript
// Background script
const site = extractSite('www.example.com'); // Returns 'example.com'

// Content script
const site = WTMUtils.extractSite('www.example.com'); // Returns 'example.com'
```

### `formatTime(timeMs)`
Formats time in milliseconds to a human-readable string.
```javascript
// Background script
const formatted = formatTime(90000); // Returns '1m 30s'

// Content script
const formatted = WTMUtils.formatTime(90000); // Returns '1m 30s'
```

### `formatTimeDigital(timeMs)`
Formats time in milliseconds to MM:SS format.
```javascript
// Background script
const digital = formatTimeDigital(90000); // Returns '01:30'

// Content script
const digital = WTMUtils.formatTimeDigital(90000); // Returns '01:30'
```

### `isValidUrl(url)`
Validates if a URL or hostname is valid.
```javascript
// Background script
const valid = isValidUrl('example.com'); // Returns true

// Content script
const valid = WTMUtils.isValidUrl('example.com'); // Returns true
```

### `getTodayString()`
Gets the current date in YYYY-MM-DD format.
```javascript
// Background script
const today = getTodayString(); // Returns '2024-01-15'

// Content script
const today = WTMUtils.getTodayString(); // Returns '2024-01-15'
```

### `getNextMidnight()`
Calculates the timestamp for the next midnight.
```javascript
// Background script
const midnight = getNextMidnight(); // Returns timestamp

// Content script
const midnight = WTMUtils.getNextMidnight(); // Returns timestamp
```

### `findMatchingSite(hostname, sites)`
Finds a matching site from a collection, including subdomain matching.
```javascript
// Background script
const match = findMatchingSite('www.youtube.com', sitesMap);

// Content script
const match = WTMUtils.findMatchingSite('www.youtube.com', sitesMap);
```

### `debounce(func, wait)`
Creates a debounced version of a function.
```javascript
// Background script
const debouncedSave = debounce(saveFunction, 300);

// Content script
const debouncedSave = WTMUtils.debounce(saveFunction, 300);
```

### `safeAsync(asyncFn, defaultValue)`
Wraps an async function to handle errors gracefully.
```javascript
// Background script
const safeGetData = safeAsync(getData, null);

// Content script
const safeGetData = WTMUtils.safeAsync(getData, null);
```

### `isContentScript()` / `isBackgroundScript()`
Environment detection functions.
```javascript
// Background script
if (isContentScript()) { /* ... */ }

// Content script
if (WTMUtils.isContentScript()) { /* ... */ }
```

## Implementation Details

The extension uses two separate utility files to handle different script contexts:

1. **`utils.js`**: ES6 module with exports for background.js and popup.js
2. **`utils-content.js`**: Traditional script that creates `window.WTMUtils` for content scripts
3. **Node.js Compatibility**: Both files support `module.exports` if needed

This approach avoids the "Unexpected token 'export'" error in content scripts while maintaining clean ES6 module imports for service workers and popup scripts.

## Manifest Configuration

The current manifest.json loads the appropriate utils files for each context:

```json
{
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["utils-content.js", "content.js"]
    }
  ]
}
```

## Adding New Shared Functions

To add a new shared function:

1. Add the function to both `utils.js` and `utils-content.js`
2. Add it to the export statements in `utils.js`
3. Add it to the `window.WTMUtils` object in `utils-content.js`
4. Import it in background.js and popup.js if needed
5. Use via `WTMUtils.functionName()` in content scripts

## Benefits

- **Code Reuse**: No need to duplicate utility functions
- **Consistency**: Same logic across all extension contexts
- **Maintainability**: Single source of truth for utility functions
- **Type Safety**: Consistent function signatures across contexts 
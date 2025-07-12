# Testing the Website Time Manager Extension

## Issues Fixed

1. **"window is not defined" error** ✅
   - Fixed by changing `window.setInterval` to `setInterval` in background script
   - Service workers don't have access to the `window` object

2. **Popup HTML structure** ✅
   - Updated popup.html with proper Tailwind CSS classes
   - Added loading states and proper content structure

3. **CSS classes** ✅
   - Added missing loading-related CSS classes
   - Rebuilt Tailwind CSS with all required components

## How to Test the Extension

### 1. Load the Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked" and select this folder
4. The extension should appear in your extensions list

### 2. Check for Errors

1. **Background Script Errors:**
   - Go to `chrome://extensions/`
   - Find "Website Time Manager" and click "Errors" if any appear
   - Or click "service worker" link to open DevTools

2. **Popup Errors:**
   - Right-click the extension icon in the toolbar
   - Select "Inspect popup" to open DevTools for the popup
   - Check the Console tab for any errors

### 3. Test Functionality

1. **Popup Display:**
   - Click the extension icon in the toolbar
   - The popup should open with proper size (384px width, ~500px height)
   - Should show "Loading..." initially, then display the main content

2. **Background Script:**
   - Visit a website like youtube.com
   - The background script should start tracking time
   - Check the service worker console for logs

3. **Data Loading:**
   - The popup should display "No activity data yet" initially
   - After visiting tracked sites, it should show usage statistics

### 4. Debug Steps

If the popup is still not working:

1. **Check Console Logs:**
   - Open popup inspector (right-click extension icon → Inspect popup)
   - Look for console logs starting with "Initializing popup..."
   - Check if there are any error messages

2. **Verify File Paths:**
   - Ensure `dist/popup/index.js` exists and is not empty
   - Ensure `dist/styles.css` exists and contains the CSS classes
   - Check that `src/popup/popup.html` is loading the correct script path

3. **Test Background Script:**
   - Go to `chrome://extensions/`
   - Click "service worker" link for the extension
   - Check if the background script is running without errors

### 5. Common Issues and Solutions

**Issue: Popup appears but is blank or very small**
- Check if CSS is loading properly (`../../dist/styles.css`)
- Verify Tailwind classes are compiled correctly
- Check browser console for CSS loading errors

**Issue: "No activity data yet" always shows**
- Check if background script is receiving messages
- Verify storage permissions in manifest.json
- Check if sites are being tracked (visit youtube.com, facebook.com, etc.)

**Issue: Settings not saving**
- Check background script console for errors
- Verify chrome.storage.local permissions
- Check if updateSettings message handler is working

## Expected Behavior

1. **Fresh Install:** Shows "No activity data yet" with empty stats
2. **After Visiting Sites:** Shows time spent on tracked websites
3. **Settings:** Can modify time limits and add/remove sites
4. **Blocking:** Should redirect to blocked.html when time limit exceeded

## Debugging Commands

```bash
# Rebuild everything
npm run build

# Rebuild just TypeScript
npm run build:ts

# Rebuild just CSS
npm run build:css

# Watch mode for development
npm run dev
```

## File Structure Verification

Ensure these files exist:
- `dist/background/index.js` - Background script
- `dist/content/index.js` - Content script
- `dist/popup/index.js` - Popup script
- `dist/styles.css` - Compiled CSS
- `src/popup/popup.html` - Popup HTML
- `src/blocked.html` - Blocked page HTML 
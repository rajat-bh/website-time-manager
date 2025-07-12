# Quick Setup Guide

Follow these steps to get the Website Time Manager extension up and running in just a few minutes.

## Step 1: Prepare the Extension

1. **Download/Clone the Project**
   - You should have all the extension files in a single folder
   - Make sure you have all these files:
     - `manifest.json`
     - `background.js`
     - `content.js`
     - `styles.css`
     - `popup.html`
     - `popup.css`
     - `popup.js`
     - `blocked.html`

2. **Create Icons (Temporary)**
   - The extension needs icon files to work
   - For quick testing, you can use placeholder icons:
   
   **Option A: Use Online Icon Generator**
   - Go to https://www.favicon-generator.org/
   - Upload any simple image or create a basic design
   - Download the generated icons
   - Rename them to: `icon16.png`, `icon32.png`, `icon48.png`, `icon128.png`
   - Place them in the `icons/` folder

   **Option B: Create Simple Colored Squares (Quick Test)**
   - Create 4 small colored PNG images using any image editor
   - Make them 16x16, 32x32, 48x48, and 128x128 pixels
   - Save as the required names in the `icons/` folder

## Step 2: Install in Chrome

1. **Open Chrome Extensions Page**
   - Open Chrome browser
   - Go to `chrome://extensions/`
   - Or click Chrome menu → More Tools → Extensions

2. **Enable Developer Mode**
   - Look for "Developer mode" toggle in the top-right corner
   - Click to enable it

3. **Load the Extension**
   - Click "Load unpacked" button
   - Navigate to your extension folder
   - Select the folder and click "Open"
   - The extension should now appear in your extensions list

4. **Pin the Extension (Optional)**
   - Click the puzzle piece icon in the Chrome toolbar
   - Find "Website Time Manager" in the list
   - Click the pin icon to keep it visible

## Step 3: Test the Extension

1. **Visit a Tracked Website**
   - Go to YouTube, Facebook, Twitter, Instagram, TikTok, or Reddit
   - You should see a floating timer in the top-right corner

2. **Check the Popup**
   - Click the extension icon in the toolbar
   - You should see the popup with statistics and settings

3. **Test Warning System**
   - For quick testing, you can modify the time limit:
   - Click the extension icon
   - Change "Daily Time Limit" to 1 minute
   - Click "Save Settings"
   - Visit YouTube and wait for the warning

## Step 4: Customize Settings

1. **Adjust Time Limits**
   - Click the extension icon
   - Change the "Daily Time Limit" to your preferred duration
   - Click "Save Settings"

2. **Select Blocked Sites**
   - In the popup, check/uncheck sites you want to track
   - Click "Save Settings"

3. **Reset Data (if needed)**
   - Click "Reset Today's Data" to clear current usage
   - Useful for testing or starting fresh

## Troubleshooting

### Extension Not Loading
- Make sure all files are in the correct locations
- Check that you have the icon files in the `icons/` folder
- Try reloading the extension: go to `chrome://extensions/`, find your extension, and click the reload icon

### Timer Not Showing
- Make sure you're visiting a website that's in the blocked sites list
- Check that the website URL matches the expected format (e.g., youtube.com, not m.youtube.com)
- Try reloading the webpage

### Popup Not Working
- Right-click the extension icon and select "Inspect popup" to see any errors
- Make sure popup.html, popup.css, and popup.js files are present

## Quick Test Checklist

- [ ] Extension loads without errors in `chrome://extensions/`
- [ ] Extension icon appears in toolbar
- [ ] Popup opens when clicking the icon
- [ ] Floating timer appears on blocked websites
- [ ] Time tracking works (numbers change in popup)
- [ ] Warning appears at 80% usage
- [ ] Blocking page appears at 100% usage

## Next Steps

Once everything is working:

1. **Create Better Icons**: Design proper icons for your extension
2. **Customize Sites**: Add or remove websites from the blocked list
3. **Adjust Settings**: Fine-tune time limits and preferences
4. **Share**: Consider sharing with friends or publishing to Chrome Web Store

## Need Help?

- Check the main README.md for detailed documentation
- Look at the browser console for error messages
- Try disabling and re-enabling the extension
- Make sure Chrome is up to date

---

**Estimated Setup Time**: 5-10 minutes

Once set up, the extension will help you build better browsing habits by making you aware of your time usage on distracting websites! 
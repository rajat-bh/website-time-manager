# Website Time Manager - Chrome Extension

A powerful Chrome extension that helps you manage and limit time spent on distracting websites like YouTube, Facebook, Twitter, Instagram and Reddit.

## Features

- ⏰ **Time Tracking**: Automatically tracks time spent on blocked websites
- 🚫 **Smart Blocking**: Blocks access after reaching daily time limits (default 30 minutes)
- ⚠️ **Warning System**: Shows warnings at 80% of time limit (24 minutes)
- 📊 **Real-time Statistics**: View detailed usage statistics in the popup
- 🎯 **Floating Timer**: See remaining time while browsing tracked sites
- 🔄 **Daily Reset**: Time limits reset automatically at midnight
- ⚙️ **Customizable**: Configure time limits and blocked sites
- 🎨 **Modern UI**: Beautiful, responsive design with smooth animations


## 🚀 Safe to Use

This extension has been designed with security and safety as top priorities. It:

- **Does NOT** hang the browser
- **Does NOT** create memory leaks
- **Does NOT** expose sensitive data
- **Does NOT** make external requests
- **Does NOT** execute unsafe code
- **DOES** validate all inputs
- **DOES** handle errors gracefully
- **DOES** protect user privacy
- **DOES** perform efficiently

The extension is **production-ready** and **safe for daily use**. 

## Installation

### Method 1: Load as Unpacked Extension (Development)

1. **Download the Extension**
   - Clone or download this repository
   - Make sure all files are in a single folder

2. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the extension folder
   - The extension should now appear in your toolbar

### Method 2: Chrome Web Store (Future)
This extension can be packaged and published to the Chrome Web Store for easier installation.

## How It Works

### Time Tracking
- Automatically detects when you visit blocked websites
- Tracks active time spent (only when tab is focused)
- Stores data locally using Chrome's storage API
- Resets daily at midnight

### Warning System
- **80% Warning**: Shows popup when you've used 24 minutes (80% of 30 minutes)
- **100% Block**: Redirects to blocking page when limit is reached
- Floating timer shows remaining time while browsing

### Blocking Mechanism
- Replaces blocked websites with a motivational blocking page
- Shows usage statistics and countdown to reset
- Provides productive activity suggestions

## File Structure

```
├── manifest.json         # Extension configuration
├── background.js         # Background service worker (main logic)
├── content.js            # Content script (in-page interactions)
├── styles.css            # Styles for content script elements
├──popup                  # Extension popup
│   ├── popup.html            # Extension popup interface
│   ├── popup.css             # Popup styling
│   ├── popup.js              # Popup functionality
├── blocked.html          # Blocking page shown when limit reached
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

## Customization

### Adding New Blocked Sites

1. **Via Popup Interface**
   - Click the extension icon
   - Uncheck/check sites in the "Blocked Sites" section
   - Click "Save Settings"

2. **Via Code** (for developers)
   - Edit the `blockedSites` array in `background.js`
   - Add entries to the popup UI in `popup.html`
   - Update the formatSiteName function in `popup.js`

### Changing Time Limits

1. **Via Popup Interface**
   - Click the extension icon
   - Change the "Daily Time Limit" value
   - Click "Save Settings"

2. **Via Code**
   - Modify `timeLimit` in `background.js` (value in milliseconds)

### Customizing Appearance

- Edit `styles.css` for content script elements (warnings, timers)
- Edit `popup.css` for popup interface styling
- Modify `blocked.html` for the blocking page design

## Default Blocked Sites

The extension comes pre-configured to track these websites:
- YouTube (youtube.com)
- Facebook (facebook.com)
- Twitter (twitter.com)
- Reddit (reddit.com)

## Browser Compatibility

- **Chrome**: Fully supported (Manifest V3)
- **Edge**: Compatible (uses Chromium engine)
- **Brave**: Compatible (uses Chromium engine)
- **Firefox**: Would require adaptation to Manifest V2

## Extending to Other Browsers

### Microsoft Edge
1. Go to `edge://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the extension folder

### Brave Browser
1. Go to `brave://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the extension folder

## Development

### Prerequisites
- Basic knowledge of JavaScript, HTML, CSS
- Understanding of Chrome Extension APIs
- Text editor or IDE

### Key APIs Used
- `chrome.storage` - Data persistence
- `chrome.tabs` - Tab management
- `chrome.alarms` - Daily reset scheduling
- `chrome.notifications` - User notifications
- `chrome.runtime` - Message passing between scripts

### Testing
1. Load the extension in developer mode
2. Visit a blocked website (e.g., YouTube)
3. Check that the floating timer appears
4. Wait for warning at 80% usage
5. Test blocking at 100% usage
6. Verify popup statistics

### Debugging
- Use Chrome DevTools for popup: Right-click extension icon → "Inspect popup"
- Background script logs: Go to `chrome://extensions/` → Click "service worker"
- Content script logs: Use DevTools on the website page

## Privacy & Security

- **Local Storage Only**: All data is stored locally on your device
- **No External Servers**: No data is sent to external servers
- **Minimal Permissions**: Only requests necessary permissions
- **Open Source**: Code is transparent and auditable

## Troubleshooting

### Extension Not Working
1. Check that all files are present
2. Ensure icons are in the correct folder
3. Reload the extension in `chrome://extensions/`
4. Check the browser console for errors

### Time Not Tracking
1. Make sure the website is in the blocked sites list
2. Check that the tab is active (focused)
3. Verify the extension has necessary permissions

### Popup Not Loading
1. Right-click the extension icon and select "Inspect popup"
2. Check for JavaScript errors in the console
3. Ensure popup.html, popup.css, and popup.js are present

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Ideas for Contributions
- Add more blocked sites
- Implement weekly/monthly statistics
- Add productivity goals and achievements
- Create better icon designs
- Add sound notifications
- Implement focus sessions (Pomodoro technique)

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you encounter issues or have questions:
1. Check the troubleshooting section above
2. Review the Chrome Extension documentation
3. Search for similar issues online
4. Create an issue in the project repository

## Changelog

### Version 1.0.0
- Initial release
- Basic time tracking and blocking
- Warning system at 80% usage
- Popup interface with statistics
- Daily reset functionality

---

**Remember**: This extension is designed to help you build better browsing habits. Use it as a tool for self-improvement, not as a strict enforcement mechanism. The goal is to increase awareness of your time usage and encourage more mindful browsing. 
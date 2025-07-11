// Website Time Manager - Background Script

import { 
  extractSite, 
  formatTime, 
  formatTimeDigital, 
  isValidUrl, 
  getTodayString, 
  getNextMidnight, 
  findMatchingSite, 
  debounce, 
  safeAsync 
} from './utils.js';

class WebsiteTimeManager {
  constructor() {
    this.sites = new Map();
    this.defaultTimeLimit = 30; // in minutes
    this.warningThreshold = 0.8; // 80% of time limit
    this.activeTab = null;
    this.sessionStartTime = null;
    this.trackingInterval = null;
    this.maxUpdateInterval = 5000; // Maximum interval between updates (5 seconds)
    this.lastUpdateTime = 0;
    
    this.initializeExtension();
  }

  async initializeExtension() {
    // Set up daily reset alarm
    chrome.alarms.create('dailyReset', {
      when: this.getNextMidnight(),
      periodInMinutes: 24 * 60 // Repeat every 24 hours
    });

    // Initialize storage
    await this.initializeStorage();

    // Set up event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Tab activation
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.handleTabChange(activeInfo.tabId);
    });

    // Tab updates
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.active) {
        this.handleTabChange(tabId);
      }
    });

    // Window focus change
    chrome.windows.onFocusChanged.addListener((windowId) => {
      if (windowId === chrome.windows.WINDOW_ID_NONE) {
        this.stopTracking();
      } else {
        chrome.tabs.query({active: true, windowId: windowId}, (tabs) => {
          if (tabs.length > 0) {
            this.handleTabChange(tabs[0].id);
          }
        });
      }
    });

    // Alarm listener for daily reset
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === 'dailyReset') {
        this.resetDailyData();
      }
    });

    // Message handling
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
    });
  }

  async handleTabChange(tabId) {
    try {
      // Stop current tracking
      this.stopTracking();

      // Get tab info with timeout protection
      const tab = await this.getTabWithTimeout(tabId);
      if (!tab || !tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('extension://')) {
        return;
      }

      const hostname = new URL(tab.url).hostname;
      const site = extractSite(hostname);
      const matchedSite = this.findMatchingSite(site);

      if (matchedSite) {
        const siteConfig = this.sites.get(matchedSite);
        if (!siteConfig || !siteConfig.enabled) {
          return;
        }

        const timeData = await this.getTimeData(matchedSite);
        const siteLimitMs = this.getSiteTimeLimit(matchedSite);
        
        // Check if site should be blocked
        if (timeData.timeSpent >= siteLimitMs) {
          this.blockSite(tabId, matchedSite);
          return;
        }

        // Start tracking this site
        this.startTracking(matchedSite, tabId);
      }
    } catch (error) {
      console.error('Error handling tab change:', error);
      // Don't block browser if there's an error
    }
  }

  async getTabWithTimeout(tabId, timeout = 3000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Tab query timeout'));
      }, timeout);

      chrome.tabs.get(tabId, (tab) => {
        clearTimeout(timer);
        if (chrome.runtime.lastError) {
          resolve(null);
        } else {
          resolve(tab);
        }
      });
    });
  }

  findMatchingSite(hostname) {
    // Use the shared utility function
    return findMatchingSite(hostname, this.sites);
  }

  getSiteTimeLimit(site) {
    // Return per-site limit in milliseconds
    const siteConfig = this.sites.get(site);
    const limitMinutes = siteConfig?.timeLimit || this.defaultTimeLimit;
    return limitMinutes * 60 * 1000;
  }

  startTracking(site, tabId) {
    // Clear any existing interval first
    this.stopTracking();
    
    this.activeTab = { site, tabId };
    this.sessionStartTime = Date.now();
    this.lastUpdateTime = Date.now();
    
    // Set up periodic checks with safety limits
    this.trackingInterval = setInterval(() => {
      this.updateTimeSpent();
    }, 1000); // Update every second
  }

  stopTracking() {
    if (this.activeTab && this.sessionStartTime) {
      this.updateTimeSpent();
    }
    
    this.activeTab = null;
    this.sessionStartTime = null;
    
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
  }

  async updateTimeSpent() {
    if (!this.activeTab || !this.sessionStartTime) {
      this.stopTracking(); // Clean up if in invalid state
      return;
    }

    const now = Date.now();
    const sessionTime = now - this.sessionStartTime;
    const site = this.activeTab.site;
    
    // Safety check: prevent excessive time accumulation
    if (sessionTime > this.maxUpdateInterval) {
      console.warn('Large time gap detected, limiting session time');
      // Only count the maximum interval to prevent time manipulation
      const limitedSessionTime = Math.min(sessionTime, this.maxUpdateInterval);
      this.sessionStartTime = now - limitedSessionTime;
    }
    
    try {
      // Get current time data
      const timeData = await this.getTimeData(site);
      const actualSessionTime = Math.min(sessionTime, this.maxUpdateInterval);
      const newTimeSpent = timeData.timeSpent + actualSessionTime;

      // Update storage
      await this.setTimeData(site, {
        timeSpent: newTimeSpent,
        lastUpdated: now
      });

      // Check for warnings and blocking using site-specific limits
      this.checkTimeThresholds(site, newTimeSpent);

      // Reset session start time
      this.sessionStartTime = now;
      this.lastUpdateTime = now;
    } catch (error) {
      console.error('Error updating time spent:', error);
      // Continue running but reset tracking to prevent accumulation of errors
      this.stopTracking();
    }
  }

  async checkTimeThresholds(site, timeSpent) {
    const siteLimitMs = this.getSiteTimeLimit(site);
    const warningTime = siteLimitMs * this.warningThreshold;
    
    if (timeSpent >= siteLimitMs) {
      // Block the site
      this.blockSite(this.activeTab.tabId, site);
    } else if (timeSpent >= warningTime) {
      // Show warning
      const remainingTime = siteLimitMs - timeSpent;
      this.showWarning(site, remainingTime);
    }
  }

  async blockSite(tabId, site) {
    try {
      const blockedUrl = chrome.runtime.getURL('blocked.html') + '?site=' + encodeURIComponent(site);
      await chrome.tabs.update(tabId, { url: blockedUrl });
      
      // Show notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Website Time Manager',
        message: `You've reached your daily limit for ${site}. Access blocked until tomorrow.`
      });
    } catch (error) {
      console.error('Error blocking site:', error);
    }
  }

  async showWarning(site, remainingTime) {
    const minutes = Math.ceil(remainingTime / (60 * 1000));
    
    // Send message to content script
    if (this.activeTab) {
      try {
        await chrome.tabs.sendMessage(this.activeTab.tabId, {
          action: 'showWarning',
          site: site,
          remainingTime: remainingTime,
          message: `Warning: You have ${minutes} minutes left on ${site} today.`
        });
      } catch (error) {
        console.error('Error sending warning message:', error);
      }
    }
  }

  async getTimeData(site) {
    const today = this.getTodayString();
    const key = `time_${site}_${today}`;
    
    const result = await chrome.storage.local.get([key]);
    return result[key] || { timeSpent: 0, lastUpdated: Date.now() };
  }

  async setTimeData(site, data) {
    const today = this.getTodayString();
    const key = `time_${site}_${today}`;
    
    await chrome.storage.local.set({ [key]: data });
  }

  async resetDailyData() {
    // Clear old data (keep only last 7 days)
    const storage = await chrome.storage.local.get();
    const keysToRemove = [];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    for (const key in storage) {
      if (key.startsWith('time_')) {
        const dateStr = key.split('_').pop();
        const date = new Date(dateStr);
        if (date < sevenDaysAgo) {
          keysToRemove.push(key);
        }
      }
    }
    
    if (keysToRemove.length > 0) {
      await chrome.storage.local.remove(keysToRemove);
    }
  }

  async initializeStorage() {
    try {
      // Initialize with default sites and limits if not already set
      const result = await chrome.storage.local.get(['sites', 'defaultTimeLimit']);
      
      if (!result.sites) {
        // Initialize with default sites
        const defaultSites = {
          'youtube.com': { enabled: true, timeLimit: 30, isDefault: true },
          'facebook.com': { enabled: true, timeLimit: 30, isDefault: true },
          'instagram.com': { enabled: true, timeLimit: 30, isDefault: true }
        };
        
        await chrome.storage.local.set({
          sites: defaultSites,
          defaultTimeLimit: this.defaultTimeLimit
        });
        
        // Convert to Map for internal use
        this.sites.clear();
        Object.entries(defaultSites).forEach(([domain, config]) => {
          this.sites.set(domain, config);
        });
      } else {
        // Load existing sites
        this.sites.clear();
        Object.entries(result.sites).forEach(([domain, config]) => {
          this.sites.set(domain, config);
        });
        
        if (result.defaultTimeLimit) {
          this.defaultTimeLimit = result.defaultTimeLimit;
        }
      }
    } catch (error) {
      console.error('Error initializing storage:', error);
      // Use defaults if storage fails
      this.initializeDefaultSites();
    }
  }

  initializeDefaultSites() {
    const defaultSites = [
      'youtube.com',
      'facebook.com',
      'instagram.com'
    ];

    this.sites.clear();
    defaultSites.forEach(domain => {
      this.sites.set(domain, {
        enabled: true,
        timeLimit: this.defaultTimeLimit,
        isDefault: true
      });
    });
  }



  getTodayString() {
    // Use the shared utility function
    return getTodayString();
  }

  getNextMidnight() {
    // Use the shared utility function
    return getNextMidnight();
  }

  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case 'getTimeData':
          const timeData = await this.getTimeData(request.site);
          sendResponse(timeData);
          break;
        case 'updateSettings':
          await this.updateSettings(request.settings);
          sendResponse({ success: true });
          break;
        case 'getAllTimeData':
          const allData = await this.getAllTimeData();
          sendResponse({ success: true, data: allData });
          break;
        case 'getSiteLimits':
          const siteLimits = this.getSiteLimits();
          sendResponse(siteLimits);
          break;
        case 'validateSite':
          const isValid = this.validateSiteUrl(request.site);
          sendResponse({ valid: isValid });
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async getAllTimeData() {
    const today = this.getTodayString();
    const data = {};
    
    for (const [site, config] of this.sites) {
      if (config.enabled) {
        const timeData = await this.getTimeData(site);
        data[site] = timeData;
      }
    }
    
    return data;
  }

  getSiteLimits() {
    const limits = {};
    this.sites.forEach((config, site) => {
      limits[site] = config.timeLimit || this.defaultTimeLimit;
    });
    return limits;
  }

  async updateSettings(settings) {
    if (settings.defaultTimeLimit) {
      this.defaultTimeLimit = settings.defaultTimeLimit;
    }
    
    if (settings.sites) {
      // Convert to Map for internal use
      this.sites.clear();
      Object.entries(settings.sites).forEach(([domain, config]) => {
        this.sites.set(domain, config);
      });
    }

    // Save to storage
    await chrome.storage.local.set({
      defaultTimeLimit: this.defaultTimeLimit,
      sites: settings.sites || this.convertSitesToObject()
    });

    // Notify content scripts of settings update
    try {
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('extension://')) {
          chrome.tabs.sendMessage(tab.id, { action: 'settingsUpdated' }).catch(() => {
            // Ignore errors for tabs that don't have content script
          });
        }
      }
    } catch (error) {
      console.error('Error notifying content scripts:', error);
    }
  }

  convertSitesToObject() {
    const sitesObj = {};
    this.sites.forEach((config, domain) => {
      sitesObj[domain] = config;
    });
    return sitesObj;
  }

  validateSiteUrl(site) {
    // Use the shared utility function with additional security checks
    if (!isValidUrl(site)) return false;
    
    // Additional security checks for dangerous patterns
    const dangerous = [
      'chrome://', 'file://', 'ftp://', 'data:', 'javascript:',
      'chrome-extension://', 'moz-extension://', 'about:'
    ];
    
    return !dangerous.some(pattern => site.toLowerCase().includes(pattern));
  }
}

// Initialize the extension
const timeManager = new WebsiteTimeManager(); 
/**
 * Website Time Manager - Background Script (Service Worker)
 */

// Chrome APIs are available globally in the extension context
declare const chrome: any;

import type {
  BackgroundState,
  SiteConfig,
  TimeData,
  ChromeMessage,
  ChromeResponse,
  GetTimeDataMessage,
  SetTimeDataMessage,
  UpdateSettingsMessage,
  MessageAction
} from '../types/index.js';

import {
  extractSite,
  formatTime,
  getTodayString,
  getNextMidnight,
  findMatchingSite,
  getErrorMessage
} from '../utils/index.js';
import { DEFAULT_TIME_LIMIT, WARNING_THRESHOLD, MAX_UPDATE_INTERVAL, DEFAULT_SITES } from '../types/index.js';

/**
 * Main background script class for managing website time tracking
 */
class WebsiteTimeManager {
  private state: BackgroundState;

  constructor() {
    this.state = {
      sites: new Map<string, SiteConfig>(),
      defaultTimeLimit: DEFAULT_TIME_LIMIT,
      warningThreshold: WARNING_THRESHOLD,
      activeTab: null,
      sessionStartTime: null,
      trackingInterval: null,
      maxUpdateInterval: MAX_UPDATE_INTERVAL,
      lastUpdateTime: 0
    };

    this.initializeExtension();
  }

  /**
   * Initialize the extension with proper error handling
   */
  private async initializeExtension(): Promise<void> {
    try {
      // Set up daily reset alarm
      await this.setupDailyResetAlarm();

      // Initialize storage
      await this.initializeStorage();

      // Set up event listeners
      this.setupEventListeners();

      console.log('Website Time Manager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize extension:', getErrorMessage(error));
    }
  }

  // TODO: do we need to set an alarm for this ? wouldn't the change of date just enable this ?
  /**
   * Set up the daily reset alarm
   */
  private async setupDailyResetAlarm(): Promise<void> {
    try {
      await chrome.alarms.create('dailyReset', {
        when: getNextMidnight(),
        periodInMinutes: 24 * 60 // Repeat every 24 hours
      });
    } catch (error) {
      console.error('Failed to create daily reset alarm:', getErrorMessage(error));
    }
  }

  /**
   * Set up all event listeners
   */
  private setupEventListeners(): void {
    // Tab activation
    chrome.tabs.onActivated.addListener((activeInfo: chrome.tabs.TabActiveInfo) => {
      this.handleTabChange(activeInfo.tabId);
    });

    // Tab updates
    chrome.tabs.onUpdated.addListener((tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
      if (changeInfo.status === 'complete' && tab.active) {
        this.handleTabChange(tabId);
      }
    });

    // Window focus change
    chrome.windows.onFocusChanged.addListener((windowId: number) => {
      if (windowId === chrome.windows.WINDOW_ID_NONE) {
        this.stopTracking();
      } else {
        chrome.tabs.query({ active: true, windowId: windowId }, (tabs: any[]) => {
          if (tabs.length > 0 && tabs[0].id) {
            this.handleTabChange(tabs[0].id);
          }
        });
      }
    });

    // Alarm listener for daily reset
    chrome.alarms.onAlarm.addListener((alarm: chrome.alarms.Alarm) => {
      if (alarm.name === 'dailyReset') {
        this.resetDailyData();
      }
    });

    // Message handling
    chrome.runtime.onMessage.addListener((request: ChromeMessage, sender: chrome.runtime.MessageSender, sendResponse: (response: ChromeResponse) => void) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep message channel open for async responses
    });
  }

  /**
   * Handle tab changes with improved error handling
   */
  private async handleTabChange(tabId: number): Promise<void> {
    try {
      // Stop current tracking
      this.stopTracking();

      // Get tab info with timeout protection
      const tab = await this.getTabWithTimeout(tabId);
      if (!tab?.url || this.isSystemUrl(tab.url)) {
        return;
      }

      const hostname = new URL(tab.url).hostname;
      const site = extractSite(hostname);
      const matchedSite = findMatchingSite(site, this.state.sites);

      if (!matchedSite) {
        return;
      }

      const siteConfig = this.state.sites.get(matchedSite);
      if (!siteConfig?.enabled) {
        return;
      }

      const timeData = await this.getTimeData(matchedSite);
      const siteLimitMs = this.getSiteTimeLimit(matchedSite);
      
      // Check if site should be blocked
      if (timeData.timeSpent >= siteLimitMs) {
        await this.blockSite(tabId, matchedSite);
        return;
      }

      // Start tracking this site
      this.startTracking(matchedSite, tabId);
    } catch (error) {
      console.error('Error handling tab change:', getErrorMessage(error));
      // Don't block browser if there's an error
    }
  }

  /**
   * Check if URL is a system URL that should be ignored
   */
  private isSystemUrl(url: string): boolean {
    return url.startsWith('chrome://') || 
           url.startsWith('chrome-extension://') || 
           url.startsWith('edge://') ||
           url.startsWith('about:');
  }

  /**
   * Get tab information with timeout protection
   */
  private async getTabWithTimeout(tabId: number, timeout: number = 3000): Promise<chrome.tabs.Tab | null> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        resolve(null);
      }, timeout);

      chrome.tabs.get(tabId, (tab: any) => {
        clearTimeout(timer);
        if (chrome.runtime.lastError) {
          resolve(null);
        } else {
          resolve(tab);
        }
      });
    });
  }

  /**
   * Get the time limit for a site in milliseconds
   */
  private getSiteTimeLimit(site: string): number {
    const siteConfig = this.state.sites.get(site);
    const limitMinutes = siteConfig?.timeLimit || this.state.defaultTimeLimit;
    return limitMinutes * 60 * 1000;
  }

  /**
   * Start tracking time for a site
   */
  private startTracking(site: string, tabId: number): void {
    // Clear any existing interval first
    this.stopTracking();
    
    this.state.activeTab = { site, tabId };
    this.state.sessionStartTime = Date.now();
    this.state.lastUpdateTime = Date.now();
    
    // Set up periodic checks with safety limits
    this.state.trackingInterval = setInterval(() => {
      this.updateTimeSpent();
    }, 1000); // Update every second
  }

  /**
   * Stop tracking time
   */
  private stopTracking(): void {
    if (this.state.activeTab && this.state.sessionStartTime) {
      this.updateTimeSpent();
    }
    
    this.state.activeTab = null;
    this.state.sessionStartTime = null;
    
    if (this.state.trackingInterval) {
      clearInterval(this.state.trackingInterval);
      this.state.trackingInterval = null;
    }
  }

  /**
   * Update time spent on current site
   */
  private async updateTimeSpent(): Promise<void> {
    if (!this.state.activeTab || !this.state.sessionStartTime) {
      this.stopTracking(); // Clean up if in invalid state
      return;
    }

    const now = Date.now();
    const sessionTime = now - this.state.sessionStartTime;
    const site = this.state.activeTab.site;
    
    // Safety check: prevent excessive time accumulation
    if (sessionTime > this.state.maxUpdateInterval) {
      console.warn('Large time gap detected, limiting session time');
      // Only count the maximum interval to prevent time manipulation
      const limitedSessionTime = Math.min(sessionTime, this.state.maxUpdateInterval);
      this.state.sessionStartTime = now - limitedSessionTime;
    }
    
    try {
      // Get current time data
      const timeData = await this.getTimeData(site);
      const actualSessionTime = Math.min(sessionTime, this.state.maxUpdateInterval);
      const newTimeSpent = timeData.timeSpent + actualSessionTime;

      // Update time data
      await this.setTimeData(site, {
        timeSpent: newTimeSpent,
        date: getTodayString(),
        lastUpdate: now
      });

      // Reset session start time
      this.state.sessionStartTime = now;

      // Check thresholds
      await this.checkTimeThresholds(site, newTimeSpent);
    } catch (error) {
      console.error('Error updating time spent:', getErrorMessage(error));
    }
  }

  /**
   * Check time thresholds and show warnings/blocks
   */
  private async checkTimeThresholds(site: string, timeSpent: number): Promise<void> {
    const siteLimitMs = this.getSiteTimeLimit(site);
    const percentage = timeSpent / siteLimitMs;

    if (percentage >= 1.0) {
      // Block the site
      if (this.state.activeTab) {
        await this.blockSite(this.state.activeTab.tabId, site);
      }
    } else if (percentage >= this.state.warningThreshold) {
      // Show warning
      const remainingTime = siteLimitMs - timeSpent;
      await this.showWarning(site, remainingTime);
    }
  }

  /**
   * Block a site by redirecting to blocked page
   */
  private async blockSite(tabId: number, site: string): Promise<void> {
    try {
      const blockedUrl = chrome.runtime.getURL('src/blocked.html') + `?site=${encodeURIComponent(site)}`;
      await chrome.tabs.update(tabId, { url: blockedUrl });
      
      // Stop tracking since we're blocking
      this.stopTracking();
    } catch (error) {
      console.error('Error blocking site:', getErrorMessage(error));
    }
  }

  /**
   * Show warning to user
   */
  private async showWarning(site: string, remainingTime: number): Promise<void> {
    try {
      const formattedTime = formatTime(remainingTime);
      const message = `Warning: You have ${formattedTime} left on ${site} today.`;
      
      // Send message to content script
      if (this.state.activeTab) {
        await chrome.tabs.sendMessage(this.state.activeTab.tabId, {
          action: 'showWarning' as MessageAction,
          message,
          remainingTime
        });
      }
    } catch (error) {
      console.error('Error showing warning:', getErrorMessage(error));
    }
  }

  /**
   * Get time data for a site
   */
  private async getTimeData(site: string): Promise<TimeData> {
    try {
      const today = getTodayString();
      const storageKey = `timeData_${site}_${today}`;
      const result = await chrome.storage.local.get([storageKey]);
      
      return result[storageKey] || {
        timeSpent: 0,
        date: today,
        lastUpdate: Date.now()
      };
    } catch (error) {
      console.error('Error getting time data:', getErrorMessage(error));
      return {
        timeSpent: 0,
        date: getTodayString(),
        lastUpdate: Date.now()
      };
    }
  }

  /**
   * Set time data for a site
   */
  private async setTimeData(site: string, data: TimeData): Promise<void> {
    try {
      const storageKey = `timeData_${site}_${data.date}`;
      await chrome.storage.local.set({ [storageKey]: data });
    } catch (error) {
      console.error('Error setting time data:', getErrorMessage(error));
    }
  }

  /**
   * Reset all daily data
   */
  private async resetDailyData(): Promise<void> {
    try {
      const storage = await chrome.storage.local.get(null);
      const keysToRemove: string[] = [];

      // Find all time data keys for today and previous days
      Object.keys(storage).forEach(key => {
        if (key.startsWith('timeData_')) {
          keysToRemove.push(key);
        }
      });

      if (keysToRemove.length > 0) {
        await chrome.storage.local.remove(keysToRemove);
        console.log('Daily data reset completed');
      }
    } catch (error) {
      console.error('Error resetting daily data:', getErrorMessage(error));
    }
  }

  /**
   * Initialize storage with default values
   */
  private async initializeStorage(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['defaultTimeLimit', 'sites']);
      
      if (result.defaultTimeLimit) {
        this.state.defaultTimeLimit = result.defaultTimeLimit;
      }
      
      if (result.sites) {
        // Convert stored data to Map
        this.state.sites.clear();
        Object.entries(result.sites).forEach(([domain, config]) => {
          this.state.sites.set(domain, config as SiteConfig);
        });
      } else {
        // Initialize with default sites
        this.initializeDefaultSites();
        await this.saveSettings();
      }
    } catch (error) {
      console.error('Error initializing storage:', getErrorMessage(error));
      // Initialize with defaults on error
      this.initializeDefaultSites();
    }
  }

  /**
   * Initialize default sites
   */
  private initializeDefaultSites(): void {
    this.state.sites.clear();
    
    DEFAULT_SITES.forEach(domain => {
      this.state.sites.set(domain, {
        enabled: true,
        timeLimit: this.state.defaultTimeLimit,
        isDefault: true
      });
    });
  }

  /**
   * Save current settings to storage
   */
  private async saveSettings(): Promise<void> {
    try {
      const sitesObject = Object.fromEntries(this.state.sites);
      await chrome.storage.local.set({
        defaultTimeLimit: this.state.defaultTimeLimit,
        sites: sitesObject
      });
    } catch (error) {
      console.error('Error saving settings:', getErrorMessage(error));
    }
  }

  /**
   * Handle messages from popup and content scripts
   */
  private async handleMessage(
    request: ChromeMessage,
    _sender: any,
    sendResponse: (response: ChromeResponse) => void
  ): Promise<void> {
    try {
      switch (request.action) {
        case 'getTimeData':
          const timeData = await this.getTimeData((request as GetTimeDataMessage).site);
          sendResponse({ success: true, data: timeData });
          break;

        case 'setTimeData':
          const setRequest = request as SetTimeDataMessage;
          await this.setTimeData(setRequest.site, setRequest.data);
          sendResponse({ success: true });
          break;

        case 'getAllTimeData':
          const allData = await this.getAllTimeData();
          sendResponse({ success: true, data: allData });
          break;

        case 'updateSettings':
          const updateRequest = request as UpdateSettingsMessage;
          await this.updateSettings(updateRequest.settings);
          sendResponse({ success: true });
          break;

        case 'resetTodayData':
          await this.resetDailyData();
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Error handling message:', getErrorMessage(error));
      sendResponse({ success: false, error: getErrorMessage(error) });
    }
  }

  /**
   * Get all time data for today
   */
  private async getAllTimeData(): Promise<Record<string, TimeData>> {
    try {
      const today = getTodayString();
      const storage = await chrome.storage.local.get(null);
      const timeData: Record<string, TimeData> = {};

      Object.entries(storage).forEach(([key, value]) => {
        if (key.startsWith('timeData_') && key.endsWith(`_${today}`)) {
          const site = key.replace('timeData_', '').replace(`_${today}`, '');
          timeData[site] = value as TimeData;
        }
      });

      return timeData;
    } catch (error) {
      console.error('Error getting all time data:', getErrorMessage(error));
      return {};
    }
  }

  /**
   * Update settings
   */
  private async updateSettings(settings: { defaultTimeLimit: number; sites: Record<string, SiteConfig> }): Promise<void> {
    try {
      this.state.defaultTimeLimit = settings.defaultTimeLimit;
      
      // Update sites map
      this.state.sites.clear();
      Object.entries(settings.sites).forEach(([domain, config]) => {
        this.state.sites.set(domain, config);
      });

      // Save to storage
      await this.saveSettings();

      // Notify content scripts
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (tab.id) {
          try {
            await chrome.tabs.sendMessage(tab.id, { 
              action: 'settingsUpdated' as MessageAction 
            });
          } catch {
            // Ignore errors for tabs that don't have content scripts
          }
        }
      }
    } catch (error) {
      console.error('Error updating settings:', getErrorMessage(error));
      throw error;
    }
  }
}

// Initialize the background script
new WebsiteTimeManager(); 
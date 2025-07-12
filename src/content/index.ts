/**
 * Website Time Manager - Content Script
 * Handles warnings and time tracking on websites
 */

// Chrome APIs are available globally in the extension context
declare const chrome: any;

import type {
  SiteConfig,
  TimeData,
  ShowWarningMessage,
  ChromeMessage,
  MessageAction
} from '../types/index.js';

interface WarningElement extends HTMLElement {
  id: 'website-time-manager-warning';
}

interface ContentState {
  warningShown: boolean;
  warningElement: WarningElement | null;
  sites: Map<string, SiteConfig>;
  defaultTimeLimit: number;
}

// Constants
const DEFAULT_TIME_LIMIT = 30; // minutes

// Utility functions (copied from utils/index.ts)
const extractSite = (hostname: string): string => {
  if (!hostname || typeof hostname !== 'string') {
    return '';
  }
  return hostname.replace(/^www\./, '');
};

const formatTime = (timeMs: number): string => {
  if (!timeMs || timeMs < 0) return '0s';
  
  const seconds = Math.floor(timeMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return `${seconds}s`;
  }
};

const findMatchingSite = (
  hostname: string,
  sites: Map<string, SiteConfig> | Record<string, SiteConfig>
): string | null => {
  if (!hostname || !sites) return null;
  
  const sitesMap = sites instanceof Map ? sites : new Map(Object.entries(sites));
  
  // Direct match
  if (sitesMap.has(hostname)) {
    return hostname;
  }

  // Check if hostname is a subdomain of any tracked site
  for (const [site] of sitesMap) {
    if (hostname.endsWith('.' + site) || hostname === site) {
      return site;
    }
  }

  return null;
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
};

/**
 * Content script manager for handling warnings and timers
 */
class ContentTimeManager {
  private state: ContentState;

  constructor() {
    this.state = {
      warningShown: false,
      warningElement: null,
      sites: new Map<string, SiteConfig>(),
      defaultTimeLimit: DEFAULT_TIME_LIMIT
    };

    this.initialize();
  }

  /**
   * Initialize the content script
   */
  private async initialize(): Promise<void> {
    try {
      this.setupMessageListener();
      await this.loadSettings();
      await this.checkCurrentSite();
    } catch (error) {
      console.error('Error initializing content script:', getErrorMessage(error));
    }
  }

  /**
   * Load settings from storage
   */
  private async loadSettings(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['defaultTimeLimit', 'sites']);
      
      if (result['defaultTimeLimit']) {
        this.state.defaultTimeLimit = result['defaultTimeLimit'];
      }
      
      if (result['sites']) {
        // Convert stored data to Map for easier access
        this.state.sites.clear();
        Object.entries(result['sites']).forEach(([domain, config]) => {
          this.state.sites.set(domain, config as SiteConfig);
        });
      }
    } catch (error) {
      console.error('Error loading settings:', getErrorMessage(error));
    }
  }

  /**
   * Set up message listener for communication with background script
   */
  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((request: ChromeMessage, _sender: any, _sendResponse: any) => {
      switch (request.action) {
        case 'showWarning':
          const showWarningMsg = request as ShowWarningMessage;
          this.showWarning(showWarningMsg.message, showWarningMsg.remainingTime);
          break;
        case 'hideWarning':
          this.hideWarning();
          break;
        case 'settingsUpdated':
          this.loadSettings();
          break;
      }
    });
  }

  /**
   * Check the current site and show appropriate warnings
   */
  private async checkCurrentSite(): Promise<void> {
    const hostname = window.location.hostname;
    const site = extractSite(hostname);
    
    try {
      // Check if current site matches any tracked site (including subdomains)
      const matchedSite = findMatchingSite(site, this.state.sites);
      
      if (!matchedSite) {
        return;
      }

      const siteConfig = this.state.sites.get(matchedSite);
      if (!siteConfig?.enabled) {
        return;
      }

      // Get current time data
      const response = await chrome.runtime.sendMessage({
        action: 'getTimeData' as MessageAction,
        site: matchedSite
      });
      
      if (response?.success && response.data) {
        const timeData = response.data as TimeData;
        const siteLimitMs = (siteConfig.timeLimit || this.state.defaultTimeLimit) * 60 * 1000;
        const percentage = (timeData.timeSpent / siteLimitMs);
        
        if (percentage >= 0.8 && percentage < 1.0) {
          const remainingTime = siteLimitMs - timeData.timeSpent;
          const formattedTime = formatTime(remainingTime);
          this.showWarning(`Warning: You have ${formattedTime} left on ${matchedSite} today.`, remainingTime);
        }
      }
    } catch (error) {
      console.error('Error checking site time:', getErrorMessage(error));
    }
  }

  /**
   * Create warning template with Tailwind CSS classes
   */
  private createWarningTemplate(message: string, remainingTime: number): string {
    const progressPercentage = Math.min(80, (remainingTime / (this.state.defaultTimeLimit * 60 * 1000)) * 100);
    
    return `
      <div class="wtm-warning-overlay">
        <div class="wtm-warning-container">
          <div class="wtm-warning-content">
            <div class="wtm-warning-icon">⚠️</div>
            <div class="wtm-warning-message">${this.escapeHtml(message)}</div>
            <div class="w-full my-4">
              <div class="wtm-progress-bar">
                <div class="wtm-progress-fill" style="width: ${progressPercentage}%"></div>
              </div>
            </div>
            <div class="wtm-warning-buttons">
              <button class="wtm-warning-btn wtm-btn-primary" onclick="this.closest('.wtm-warning-overlay').remove()">
                I understand
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Show warning overlay
   */
  private showWarning(message: string, remainingTime: number): void {
    if (this.state.warningShown) return;

    this.state.warningShown = true;
    
    // Create warning overlay
    this.state.warningElement = document.createElement('div') as WarningElement;
    this.state.warningElement.id = 'website-time-manager-warning';
    this.state.warningElement.innerHTML = this.createWarningTemplate(message, remainingTime);

    // Add to page
    document.body.appendChild(this.state.warningElement);

    // Auto-hide after 10 seconds
    setTimeout(() => {
      this.hideWarning();
    }, 10000);
  }

  /**
   * Hide warning overlay
   */
  private hideWarning(): void {
    if (this.state.warningElement) {
      this.state.warningElement.remove();
      this.state.warningElement = null;
      this.state.warningShown = false;
    }
  }

  /**
   * Escape HTML to prevent XSS attacks
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

/**
 * Initialize the content script manager
 */
function initializeContentScript(): void {
  // Only initialize if we're in the main frame (not iframes)
  if (window === window.top) {
    new ContentTimeManager();
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeContentScript);
} else {
  initializeContentScript();
} 
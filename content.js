import { extractSite } from './utils.js';

class ContentTimeManager {
  constructor() {
    this.warningShown = false;
    this.warningElement = null;
    this.sites = new Map();
    this.defaultTimeLimit = 30; // in minutes
    this.setupMessageListener();
    this.loadSettings().then(() => {
      this.checkCurrentSite();
    });
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.local.get(['defaultTimeLimit', 'sites']);
      
      if (result.defaultTimeLimit) {
        this.defaultTimeLimit = result.defaultTimeLimit;
      }
      
      if (result.sites) {
        // Convert stored data to Map for easier access
        this.sites.clear();
        Object.entries(result.sites).forEach(([domain, config]) => {
          this.sites.set(domain, config);
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.action) {
        case 'showWarning':
          this.showWarning(request.message, request.remainingTime);
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

  async checkCurrentSite() {
    const hostname = window.location.hostname;
    const site = extractSite(hostname);
    
    try {
      // Check if current site matches any tracked site (including subdomains)
      const matchedSite = this.findMatchingSite(site);
      
      if (matchedSite) {
        const siteConfig = this.sites.get(matchedSite);
        if (!siteConfig || !siteConfig.enabled) {
          return;
        }

        // Get current time data
        const response = await chrome.runtime.sendMessage({
          action: 'getTimeData',
          site: matchedSite
        });
        
        if (response && response.timeSpent !== undefined) {
          const siteLimitMs = (siteConfig.timeLimit || this.defaultTimeLimit) * 60 * 1000;
          const percentage = (response.timeSpent / siteLimitMs) * 100;
          
          if (percentage >= 80 && percentage < 100) {
            const remainingTime = siteLimitMs - response.timeSpent;
            const minutes = Math.ceil(remainingTime / (60 * 1000));
            this.showWarning(`Warning: You have ${minutes} minutes left on ${matchedSite} today.`, remainingTime);
          }
        }
      }
    } catch (error) {
      console.error('Error checking site time:', error);
    }
  }

  findMatchingSite(hostname) {
    // Direct match
    if (this.sites.has(hostname)) {
      return hostname;
    }

    // Check if hostname is a subdomain of any tracked site
    for (const [site] of this.sites) {
      if (hostname.endsWith('.' + site) || hostname === site) {
        return site;
      }
    }

    return null;
  }

  createWarningTemplate(message, remainingTime) {
    const progressPercentage = Math.min(80, (remainingTime / (this.defaultTimeLimit * 60 * 1000)) * 100);
    
    return `
      <div class="wtm-warning-container">
        <div class="wtm-warning-content">
          <div class="wtm-warning-icon">⚠️</div>
          <div class="wtm-warning-message">${message}</div>
          <div class="wtm-warning-progress">
            <div class="wtm-progress-bar">
              <div class="wtm-progress-fill" style="width: ${progressPercentage}%"></div>
            </div>
          </div>
          <div class="wtm-warning-buttons">
            <button class="wtm-warning-btn wtm-btn-primary" onclick="this.parentElement.parentElement.parentElement.parentElement.remove()">
              I understand
            </button>
          </div>
        </div>
      </div>
    `;
  }

  createTimerTemplate() {
    return `
      <div class="wtm-timer-container">
        <div class="wtm-timer-content">
          <div class="wtm-timer-icon">⏰</div>
          <div class="wtm-timer-text">Time left: <span id="wtm-timer-value">--:--</span></div>
        </div>
      </div>
    `;
  }

  showWarning(message, remainingTime) {
    if (this.warningShown) return;

    this.warningShown = true;
    
    // Create warning overlay
    this.warningElement = document.createElement('div');
    this.warningElement.id = 'website-time-manager-warning';
    this.warningElement.innerHTML = this.createWarningTemplate(message, remainingTime);

    // Add to page
    document.body.appendChild(this.warningElement);

    // Auto-hide after 10 seconds
    setTimeout(() => {
      this.hideWarning();
    }, 10000);
  }

  hideWarning() {
    if (this.warningElement) {
      this.warningElement.remove();
      this.warningElement = null;
      this.warningShown = false;
    }
  }

  // Add floating timer for tracked sites
  async addFloatingTimer() {
    const hostname = window.location.hostname;
    const site = extractSite(hostname);
    
    try {
      // Ensure settings are loaded
      await this.loadSettings();
      
      const matchedSite = this.findMatchingSite(site);
      if (!matchedSite) return;

      const siteConfig = this.sites.get(matchedSite);
      if (!siteConfig || !siteConfig.enabled) return;

      // Create floating timer element
      const timerElement = document.createElement('div');
      timerElement.id = 'website-time-manager-timer';
      timerElement.innerHTML = this.createTimerTemplate();

      document.body.appendChild(timerElement);

      // Update timer every second
      this.updateTimer();
      setInterval(() => {
        this.updateTimer();
      }, 1000);
    } catch (error) {
      console.error('Error adding floating timer:', error);
    }
  }

  async updateTimer() {
    const hostname = window.location.hostname;
    const site = extractSite(hostname);
    
    try {
      const matchedSite = this.findMatchingSite(site);
      if (!matchedSite) return;

      const siteConfig = this.sites.get(matchedSite);
      if (!siteConfig || !siteConfig.enabled) return;

      const response = await chrome.runtime.sendMessage({
        action: 'getTimeData',
        site: matchedSite
      });
      
      if (response && response.timeSpent !== undefined) {
        const siteLimitMs = (siteConfig.timeLimit || this.defaultTimeLimit) * 60 * 1000;
        const remainingTime = Math.max(0, siteLimitMs - response.timeSpent);
        const minutes = Math.floor(remainingTime / (60 * 1000));
        const seconds = Math.floor((remainingTime % (60 * 1000)) / 1000);
        
        const timerValue = document.getElementById('wtm-timer-value');
        if (timerValue) {
          timerValue.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          
          // Change color based on time remaining
          const timerContainer = document.querySelector('.wtm-timer-container');
          if (timerContainer) {
            // Calculate percentage for dynamic thresholds
            const percentage = (remainingTime / siteLimitMs) * 100;
            
            timerContainer.classList.remove('wtm-timer-warning', 'wtm-timer-critical');
            
            if (percentage <= 16.67) { // Less than 1/6 remaining
              timerContainer.classList.add('wtm-timer-critical');
            } else if (percentage <= 33.33) { // Less than 1/3 remaining
              timerContainer.classList.add('wtm-timer-warning');
            }
          }
        }
      }
    } catch (error) {
      console.error('Error updating timer:', error);
    }
  }
}

// Initialize when DOM is ready
let contentManager = null;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    contentManager = new ContentTimeManager();
  });
} else {
  contentManager = new ContentTimeManager();
}

// Add floating timer after a short delay
setTimeout(() => {
  if (contentManager) {
    contentManager.addFloatingTimer();
  } else {
    // If manager not ready, create a new one
    const manager = new ContentTimeManager();
    manager.addFloatingTimer();
  }
}, 2000); 
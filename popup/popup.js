import {extractSite} from '../utils';

class Site {
  constructor(domain, config = {}) {
    this.domain = this.validateDomain(domain);
    this.enabled = config.enabled !== undefined ? config.enabled : true;
    this.timeLimit = config.timeLimit || 30; // in minutes
    this.isDefault = config.isDefault || false;
  }

  validateDomain(domain) {
    // Remove protocol if present
    domain = domain.replace(/^https?:\/\//, '');
    // Remove www if present
    domain = extractSite(domain);
    // Remove trailing slash
    domain = domain.replace(/\/$/, '');
    // Basic domain validation
    if (!domain || !domain.includes('.')) {
      throw new Error('Invalid domain format');
    }
    return domain.toLowerCase();
  }

  toggle() {
    this.enabled = !this.enabled;
  }

  setTimeLimit(minutes) {
    if (minutes < 1 || minutes > 480) {
      throw new Error('Time limit must be between 1 and 480 minutes');
    }
    this.timeLimit = minutes;
  }

  getDisplayName() {
    const names = {
      'youtube.com': 'YouTube',
      'facebook.com': 'Facebook',
      'twitter.com': 'Twitter',
      'instagram.com': 'Instagram',
      'tiktok.com': 'TikTok',
      'reddit.com': 'Reddit'
    };
    return names[this.domain] || this.domain;
  }

  getIcon() {
    const icons = {
      'youtube.com': '🎥',
      'facebook.com': '👥',
      'twitter.com': '🐦',
      'instagram.com': '📷',
      'tiktok.com': '🎵',
      'reddit.com': '🤖'
    };
    return icons[this.domain] || '🌐';
  }

  // Convert to plain object for storage
  toJSON() {
    return {
      enabled: this.enabled,
      timeLimit: this.timeLimit,
      isDefault: this.isDefault
    };
  }

  // Create Site from stored data
  static fromJSON(domain, data) {
    return new Site(domain, data);
  }
}

class PopupManager {
  constructor() {
    this.defaultTimeLimit = 30; // in minutes
    this.sites = new Map();
    this.isLoading = false;
    
    // Initialize default sites
    this.initializeDefaultSites();
    this.init();
  }

  initializeDefaultSites() {
    const defaultSites = [
      'youtube.com',
      'facebook.com', 
      'instagram.com'
    ];

    defaultSites.forEach(domain => {
      this.sites.set(domain, new Site(domain, {
        enabled: true,
        timeLimit: this.defaultTimeLimit,
        isDefault: true
      }));
    });
  }

  async init() {
    this.setLoading(true);
    try {
      await this.loadSettings();
      await this.loadTimeData();
      this.setupEventListeners();
    } catch (error) {
      console.error('Error initializing popup:', error);
      this.showMessage('Error loading extension data. Please try again.', 'error');
    } finally {
      this.setLoading(false);
    }
  }

  setLoading(isLoading) {
    this.isLoading = isLoading;
    const loadingElement = document.getElementById('loading');
    const contentElement = document.getElementById('content');
    
    if (isLoading) {
      loadingElement.style.display = 'flex';
      contentElement.style.display = 'none';
    } else {
      loadingElement.style.display = 'none';
      contentElement.style.display = 'block';
    }
  }

  setButtonLoading(button, isLoading) {
    if (isLoading) {
      button.disabled = true;
      button.dataset.originalText = button.textContent;
      button.textContent = 'Loading...';
      button.classList.add('loading');
    } else {
      button.disabled = false;
      button.textContent = button.dataset.originalText || button.textContent;
      button.classList.remove('loading');
    }
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.local.get(['defaultTimeLimit', 'sites']);
      
      if (result.defaultTimeLimit) {
        this.defaultTimeLimit = result.defaultTimeLimit;
        const timeLimitInput = document.getElementById('time-limit');
        if (timeLimitInput) {
          timeLimitInput.value = result.defaultTimeLimit;
        }
      }
      
      if (result.sites) {
        // Convert stored data to Site objects
        this.sites.clear();
        Object.entries(result.sites).forEach(([domain, data]) => {
          this.sites.set(domain, Site.fromJSON(domain, data));
        });
      }

      this.updateBlockedSitesUI();
    } catch (error) {
      console.error('Error loading settings:', error);
      throw new Error('Failed to load settings');
    }
  }

  async loadTimeData() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getAllTimeData' });
      
      if (response && response.success) {
        this.displayTimeStats(response.data);
      } else {
        this.displayTimeStats({});
      }
    } catch (error) {
      console.error('Error loading time data:', error);
      this.showEmptyState();
    }
  }

  displayTimeStats(timeData) {
    const siteStatsContainer = document.getElementById('site-stats');
    
    if (!timeData || Object.keys(timeData).length === 0) {
      this.showEmptyState();
      return;
    }

    siteStatsContainer.innerHTML = '';

    // Sort sites by time spent (descending) - only show enabled sites
    const sortedSites = Object.entries(timeData)
      .filter(([domain]) => this.sites.has(domain) && this.sites.get(domain).enabled)
      .sort(([, a], [, b]) => b.timeSpent - a.timeSpent);

    sortedSites.forEach(([domain, data]) => {
      const site = this.sites.get(domain);
      const siteElement = this.createSiteStatElement(site, data);
      siteStatsContainer.appendChild(siteElement);
    });
  }

  createSiteStatElement(site, data) {
    const element = document.createElement('div');
    element.className = 'site-stat fade-in';
    
    const timeSpentMs = data.timeSpent || 0;
    const timeSpentMinutes = Math.floor(timeSpentMs / (60 * 1000));
    const timeLimit = site.timeLimit;
    const percentage = Math.min(100, (timeSpentMinutes / timeLimit) * 100);
    const remainingMinutes = Math.max(0, timeLimit - timeSpentMinutes);
    
    // Determine status
    let status = '';
    let statusClass = '';
    
    if (percentage >= 100) {
      status = 'Blocked';
      statusClass = 'blocked';
    } else if (percentage >= 80) {
      status = 'Warning';
      statusClass = 'warning';
    }
    
    element.classList.add(statusClass);
    
    const hours = Math.floor(timeSpentMinutes / 60);
    const minutes = timeSpentMinutes % 60;
    const seconds = Math.floor((timeSpentMs % (60 * 1000)) / 1000);
    
    const remainingHours = Math.floor(remainingMinutes / 60);
    const remainingMins = remainingMinutes % 60;
    
    let timeText = '';
    if (hours > 0) {
      timeText = `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      timeText = `${minutes}m ${seconds}s`;
    } else {
      timeText = `${seconds}s`;
    }
    
    let remainingText = '';
    if (remainingMinutes > 0) {
      if (remainingHours > 0) {
        remainingText = `${remainingHours}h ${remainingMins}m remaining`;
      } else {
        remainingText = `${remainingMins}m remaining`;
      }
    } else {
      remainingText = 'Time limit reached';
    }

    element.innerHTML = `
      <div class="site-name">
        <span class="site-icon">${site.getIcon()}</span>
        ${site.getDisplayName()}
        ${status ? `<span class="status-badge ${statusClass}">${status}</span>` : ''}
      </div>
      <div class="site-time">
        Used: ${timeText} • ${remainingText}
      </div>
      <div class="site-progress">
        <div class="progress-fill ${statusClass}" style="width: ${percentage}%"></div>
      </div>
    `;

    return element;
  }

  showEmptyState() {
    const siteStatsContainer = document.getElementById('site-stats');
    siteStatsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📊</div>
        <div class="empty-state-text">No activity today</div>
        <div class="empty-state-subtext">Visit a tracked website to see your time usage</div>
      </div>
    `;
  }

  updateBlockedSitesUI() {
    const container = document.getElementById('blocked-sites');
    container.innerHTML = '';

    Array.from(this.sites.values()).forEach(site => {
      const siteElement = this.createSiteElement(site);
      container.appendChild(siteElement);
    });
  }

  createSiteElement(site) {
    const element = document.createElement('div');
    element.className = `site-item ${!site.isDefault ? 'custom-site' : ''}`;
    
    element.innerHTML = `
      <input type="checkbox" value="${site.domain}" ${site.enabled ? 'checked' : ''}>
      <label>${site.getDisplayName()}</label>
      <span class="site-limit" data-site="${site.domain}">${site.timeLimit}m</span>
      ${!site.isDefault ? `<button class="site-remove" data-site="${site.domain}">×</button>` : ''}
    `;

    // Add event listeners
    const checkbox = element.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', (e) => {
      site.enabled = e.target.checked;
      if (!e.target.checked && !site.isDefault) {
        this.removeCustomSite(site.domain);
      }
    });

    if (!site.isDefault) {
      const removeBtn = element.querySelector('.site-remove');
      removeBtn.addEventListener('click', () => {
        this.removeCustomSite(site.domain);
      });
    }

    return element;
  }

  validateInput(input, min, max, fieldName) {
    const value = parseInt(input.value);
    
    if (isNaN(value) || value < min || value > max) {
      input.classList.add('error');
      this.showMessage(`${fieldName} must be between ${min} and ${max}`, 'error');
      return false;
    }
    
    input.classList.remove('error');
    return true;
  }

  setupEventListeners() {
    // Save settings button
    const saveBtn = document.getElementById('save-settings');
    saveBtn.addEventListener('click', () => {
      this.saveSettings();
    });

    // Reset today's data button
    const resetBtn = document.getElementById('reset-today');
    resetBtn.addEventListener('click', () => {
      this.resetTodayData();
    });

    // Time limit input
    const timeLimitInput = document.getElementById('time-limit');
    timeLimitInput.addEventListener('change', (e) => {
      if (this.validateInput(e.target, 5, 480, 'Time limit')) {
        const minutes = parseInt(e.target.value);
        this.defaultTimeLimit = minutes;
        // Update all sites that are still using the default limit
        this.sites.forEach(site => {
          if (site.isDefault) {
            site.setTimeLimit(minutes);
          }
        });
        this.updateBlockedSitesUI();
      }
    });

    // Add custom site button
    const addSiteBtn = document.getElementById('add-site');
    addSiteBtn.addEventListener('click', () => {
      this.addCustomSite();
    });

    // Add site on Enter key
    document.getElementById('custom-site').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addCustomSite();
      }
    });

    document.getElementById('custom-time-limit').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addCustomSite();
      }
    });

    // Input validation feedback
    document.getElementById('custom-site').addEventListener('input', (e) => {
      e.target.classList.remove('error');
    });

    document.getElementById('custom-time-limit').addEventListener('input', (e) => {
      e.target.classList.remove('error');
    });
  }

  async addCustomSite() {
    if (this.isLoading) return;
    
    const siteInput = document.getElementById('custom-site');
    const timeLimitInput = document.getElementById('custom-time-limit');
    const addButton = document.getElementById('add-site');
    
    const siteValue = siteInput.value.trim();
    const timeLimitValue = parseInt(timeLimitInput.value) || this.defaultTimeLimit;

    // Validate inputs
    if (!siteValue) {
      siteInput.classList.add('error');
      this.showMessage('Please enter a website URL', 'error');
      siteInput.focus();
      return;
    }

    if (!this.validateInput(timeLimitInput, 1, 480, 'Time limit')) {
      timeLimitInput.focus();
      return;
    }

    this.setButtonLoading(addButton, true);

    try {
      // Validate and create site
      const site = new Site(siteValue, {
        enabled: true,
        timeLimit: timeLimitValue,
        isDefault: false
      });

      // Check if site already exists
      if (this.sites.has(site.domain)) {
        this.showMessage(`${site.domain} is already in the list`, 'error');
        return;
      }

      // Add to sites map
      this.sites.set(site.domain, site);
      
      // Update UI
      this.updateBlockedSitesUI();
      siteInput.value = '';
      timeLimitInput.value = '';
      
      // Remove error states
      siteInput.classList.remove('error');
      timeLimitInput.classList.remove('error');
      
      // Save settings
      await this.saveSettings(false); // Don't show message for this internal save
      
      this.showMessage(`Added ${site.getDisplayName()} to blocked sites`, 'success');
      
    } catch (error) {
      console.error('Error adding custom site:', error);
      this.showMessage(error.message || 'Invalid website format. Please enter a valid domain (e.g., example.com)', 'error');
    } finally {
      this.setButtonLoading(addButton, false);
    }
  }

  async removeCustomSite(domain) {
    if (this.isLoading) return;
    
    try {
      if (!this.sites.has(domain)) {
        this.showMessage('Site not found', 'error');
        return;
      }

      const site = this.sites.get(domain);
      
      if (site.isDefault) {
        this.showMessage('Cannot remove default sites', 'error');
        return;
      }

      if (!confirm(`Are you sure you want to remove ${site.getDisplayName()} from blocked sites?`)) {
        return;
      }

      // Remove from sites map
      this.sites.delete(domain);
      
      // Update UI
      this.updateBlockedSitesUI();
      
      // Save settings
      await this.saveSettings(false); // Don't show message for this internal save
      
      this.showMessage(`Removed ${site.getDisplayName()} from blocked sites`, 'success');
      
      // Reload data to reflect changes
      setTimeout(() => {
        this.loadTimeData();
      }, 500);
      
    } catch (error) {
      console.error('Error removing custom site:', error);
      this.showMessage('Error removing website. Please try again.', 'error');
    }
  }

  async saveSettings(showMessage = true) {
    if (this.isLoading) return;
    
    const saveButton = document.getElementById('save-settings');
    this.setButtonLoading(saveButton, true);

    try {
      // Convert sites to plain object for storage
      const sitesData = {};
      this.sites.forEach((site, domain) => {
        sitesData[domain] = site.toJSON();
      });

      const settings = {
        defaultTimeLimit: this.defaultTimeLimit,
        sites: sitesData
      };

      // Save to chrome storage
      await chrome.storage.local.set(settings);

      // Notify background script
      try {
        await chrome.runtime.sendMessage({
          action: 'updateSettings',
          settings: settings
        });
      } catch (bgError) {
        console.warn('Background script not available:', bgError);
      }

      if (showMessage) {
        this.showMessage('Settings saved successfully!', 'success');
      }
      
      // Reload data to reflect changes
      setTimeout(() => {
        this.loadTimeData();
      }, 1000);

    } catch (error) {
      console.error('Error saving settings:', error);
      this.showMessage('Error saving settings. Please try again.', 'error');
    } finally {
      this.setButtonLoading(saveButton, false);
    }
  }

  async resetTodayData() {
    if (this.isLoading) return;
    
    if (!confirm('Are you sure you want to reset today\'s time data? This action cannot be undone.')) {
      return;
    }

    const resetButton = document.getElementById('reset-today');
    this.setButtonLoading(resetButton, true);

    try {
      const today = new Date().toISOString().split('T')[0];
      const keysToRemove = [];
      
      this.sites.forEach((site, domain) => {
        keysToRemove.push(`time_${domain}_${today}`);
      });

      await chrome.storage.local.remove(keysToRemove);
      
      this.showMessage('Today\'s data has been reset!', 'success');
      
      // Reload data
      setTimeout(() => {
        this.loadTimeData();
      }, 1000);

    } catch (error) {
      console.error('Error resetting data:', error);
      this.showMessage('Error resetting data. Please try again.', 'error');
    } finally {
      this.setButtonLoading(resetButton, false);
    }
  }

  showMessage(text, type = 'info') {
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
      existingMessage.remove();
    }

    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;

    const content = document.getElementById('content');
    content.insertBefore(message, content.firstChild);

    // Auto-scroll to top to show the message
    message.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Remove message after 4 seconds
    setTimeout(() => {
      if (message.parentNode) {
        message.remove();
      }
    }, 4000);
  }

  // Utility method to format time
  formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    } else {
      return `${mins}m`;
    }
  }

  // Helper method to get enabled sites list (for backward compatibility)
  getEnabledSites() {
    return Array.from(this.sites.entries())
      .filter(([, site]) => site.enabled)
      .map(([domain]) => domain);
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
}); 
// Website Time Manager - Popup Script

class PopupManager {
  constructor() {
    this.timeLimit = 30 * 60 * 1000; // 30 minutes default
    this.blockedSites = ['youtube.com', 'facebook.com', 'twitter.com', 'instagram.com', 'tiktok.com', 'reddit.com'];
    this.siteLimits = {}; // Per-site time limits
    this.defaultSites = ['youtube.com', 'facebook.com', 'twitter.com', 'instagram.com', 'tiktok.com', 'reddit.com'];
    
    this.init();
  }

  async init() {
    await this.loadSettings();
    await this.loadTimeData();
    this.setupEventListeners();
    this.hideLoading();
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.local.get(['timeLimit', 'blockedSites', 'siteLimits']);
      
      if (result.timeLimit) {
        this.timeLimit = result.timeLimit;
        document.getElementById('time-limit').value = Math.floor(result.timeLimit / (60 * 1000));
      }
      
      if (result.blockedSites) {
        this.blockedSites = result.blockedSites;
      }

      if (result.siteLimits) {
        this.siteLimits = result.siteLimits;
      }

      this.updateBlockedSitesUI();
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  async loadTimeData() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getAllTimeData' });
      
      if (response) {
        this.displayTimeStats(response);
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

    // Sort sites by time spent (descending)
    const sortedSites = Object.entries(timeData)
      .filter(([site, data]) => this.blockedSites.includes(site))
      .sort(([, a], [, b]) => b.timeSpent - a.timeSpent);

    sortedSites.forEach(([site, data]) => {
      const siteElement = this.createSiteStatElement(site, data);
      siteStatsContainer.appendChild(siteElement);
    });
  }

  createSiteStatElement(site, data) {
    const element = document.createElement('div');
    element.className = 'site-stat fade-in';
    
    const timeSpent = data.timeSpent || 0;
    const percentage = Math.min(100, (timeSpent / this.timeLimit) * 100);
    const remainingTime = Math.max(0, this.timeLimit - timeSpent);
    
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
    
    const hours = Math.floor(timeSpent / (60 * 60 * 1000));
    const minutes = Math.floor((timeSpent % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((timeSpent % (60 * 1000)) / 1000);
    
    const remainingHours = Math.floor(remainingTime / (60 * 60 * 1000));
    const remainingMinutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
    
    let timeText = '';
    if (hours > 0) {
      timeText = `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      timeText = `${minutes}m ${seconds}s`;
    } else {
      timeText = `${seconds}s`;
    }
    
    let remainingText = '';
    if (remainingTime > 0) {
      if (remainingHours > 0) {
        remainingText = `${remainingHours}h ${remainingMinutes}m remaining`;
      } else {
        remainingText = `${remainingMinutes}m remaining`;
      }
    } else {
      remainingText = 'Time limit reached';
    }

    element.innerHTML = `
      <div class="site-name">
        <span class="site-icon">${this.getSiteIcon(site)}</span>
        ${this.formatSiteName(site)}
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

  getSiteIcon(site) {
    const icons = {
      'youtube.com': '🎥',
      'facebook.com': '👥',
      'twitter.com': '🐦',
      'instagram.com': '📷',
      'tiktok.com': '🎵',
      'reddit.com': '🤖'
    };
    return icons[site] || '🌐';
  }

  formatSiteName(site) {
    const names = {
      'youtube.com': 'YouTube',
      'facebook.com': 'Facebook',
      'twitter.com': 'Twitter',
      'instagram.com': 'Instagram',
      'tiktok.com': 'TikTok',
      'reddit.com': 'Reddit'
    };
    return names[site] || site;
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

    this.blockedSites.forEach(site => {
      const siteElement = this.createSiteElement(site);
      container.appendChild(siteElement);
    });

    // Update site limit displays
    this.updateSiteLimitDisplays();
  }

  createSiteElement(site) {
    const isCustom = !this.defaultSites.includes(site);
    const element = document.createElement('div');
    element.className = `site-item ${isCustom ? 'custom-site' : ''}`;
    
    const siteLimit = this.siteLimits[site] || this.timeLimit;
    const limitMinutes = Math.floor(siteLimit / (60 * 1000));
    
    element.innerHTML = `
      <input type="checkbox" value="${site}" checked>
      <label>${this.formatSiteName(site)}</label>
      <span class="site-limit" data-site="${site}">${limitMinutes}m</span>
      ${isCustom ? `<button class="site-remove" data-site="${site}">×</button>` : ''}
    `;

    // Add event listeners
    const checkbox = element.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', (e) => {
      if (!e.target.checked) {
        this.removeCustomSite(site);
      }
    });

    if (isCustom) {
      const removeBtn = element.querySelector('.site-remove');
      removeBtn.addEventListener('click', () => {
        this.removeCustomSite(site);
      });
    }

    return element;
  }

  updateSiteLimitDisplays() {
    document.querySelectorAll('.site-limit').forEach(element => {
      const site = element.dataset.site;
      const siteLimit = this.siteLimits[site] || this.timeLimit;
      const limitMinutes = Math.floor(siteLimit / (60 * 1000));
      element.textContent = `${limitMinutes}m`;
    });
  }

  setupEventListeners() {
    // Save settings button
    document.getElementById('save-settings').addEventListener('click', () => {
      this.saveSettings();
    });

    // Reset today's data button
    document.getElementById('reset-today').addEventListener('click', () => {
      this.resetTodayData();
    });

    // Time limit input
    document.getElementById('time-limit').addEventListener('change', (e) => {
      const minutes = parseInt(e.target.value);
      if (minutes >= 5 && minutes <= 480) {
        this.timeLimit = minutes * 60 * 1000;
        this.updateSiteLimitDisplays(); // Update displays when global limit changes
      }
    });

    // Add custom site button
    document.getElementById('add-site').addEventListener('click', () => {
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
  }

  async addCustomSite() {
    const siteInput = document.getElementById('custom-site');
    const timeLimitInput = document.getElementById('custom-time-limit');
    
    const site = siteInput.value.trim();
    const timeLimit = parseInt(timeLimitInput.value) || null;

    if (!site) {
      this.showMessage('Please enter a website URL', 'error');
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'addCustomSite',
        site: site,
        timeLimit: timeLimit
      });

      if (response.success) {
        this.blockedSites.push(response.site);
        if (timeLimit) {
          this.siteLimits[response.site] = timeLimit * 60 * 1000;
        }
        
        this.updateBlockedSitesUI();
        siteInput.value = '';
        timeLimitInput.value = '';
        
        this.showMessage(`Added ${response.site} to blocked sites`, 'success');
      } else {
        this.showMessage(response.error || 'Failed to add website', 'error');
      }
    } catch (error) {
      console.error('Error adding custom site:', error);
      this.showMessage('Error adding website. Please try again.', 'error');
    }
  }

  async removeCustomSite(site) {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'removeCustomSite',
        site: site
      });

      if (response.success) {
        this.blockedSites = this.blockedSites.filter(s => s !== site);
        delete this.siteLimits[site];
        
        this.updateBlockedSitesUI();
        this.showMessage(`Removed ${site} from blocked sites`, 'success');
        
        // Reload data to reflect changes
        setTimeout(() => {
          this.loadTimeData();
        }, 500);
      } else {
        this.showMessage(response.error || 'Failed to remove website', 'error');
      }
    } catch (error) {
      console.error('Error removing custom site:', error);
      this.showMessage('Error removing website. Please try again.', 'error');
    }
  }

  async saveSettings() {
    try {
      const settings = {
        timeLimit: this.timeLimit,
        blockedSites: this.blockedSites,
        siteLimits: this.siteLimits
      };

      await chrome.runtime.sendMessage({
        action: 'updateSettings',
        settings: settings
      });

      await chrome.storage.local.set(settings);

      this.showMessage('Settings saved successfully!', 'success');
      
      // Reload data to reflect changes
      setTimeout(() => {
        this.loadTimeData();
      }, 1000);

    } catch (error) {
      console.error('Error saving settings:', error);
      this.showMessage('Error saving settings. Please try again.', 'error');
    }
  }

  async resetTodayData() {
    if (!confirm('Are you sure you want to reset today\'s time data? This action cannot be undone.')) {
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const keysToRemove = [];
      
      this.blockedSites.forEach(site => {
        keysToRemove.push(`time_${site}_${today}`);
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

    // Remove message after 3 seconds
    setTimeout(() => {
      if (message.parentNode) {
        message.remove();
      }
    }, 3000);
  }

  hideLoading() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('content').style.display = 'block';
  }

  // Utility method to format time
  formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});

// Add CSS for status badges
const style = document.createElement('style');
style.textContent = `
  .status-badge {
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 12px;
    font-weight: 600;
    text-transform: uppercase;
    margin-left: auto;
  }
  
  .status-badge.warning {
    background: #fff3cd;
    color: #856404;
  }
  
  .status-badge.blocked {
    background: #f8d7da;
    color: #721c24;
  }
`;
document.head.appendChild(style); 
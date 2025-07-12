/**
 * Website Time Manager - Popup Script
 * TypeScript version with improved type safety and Tailwind CSS styling
 */
import { formatTime, getErrorMessage, validateDomain, validateTimeLimit, formatPercentage } from '../utils/index.js';
import { DEFAULT_TIME_LIMIT, DEFAULT_SITES, SITE_DISPLAY_NAMES, SITE_ICONS } from '../types/index.js';
/**
 * Popup manager for handling the extension popup interface
 */
class PopupManager {
    constructor() {
        this.state = {
            isLoading: false,
            timeData: {},
            settings: {
                defaultTimeLimit: DEFAULT_TIME_LIMIT,
                sites: new Map()
            }
        };
        this.initialize();
    }
    /**
     * Initialize the popup
     */
    async initialize() {
        try {
            console.log('Initializing popup...');
            this.setLoading(true);
            this.initializeDefaultSites();
            console.log('Loading settings...');
            await this.loadSettings();
            console.log('Loading time data...');
            await this.loadTimeData();
            console.log('Setting up event listeners...');
            this.setupEventListeners();
            console.log('Popup initialized successfully');
        }
        catch (error) {
            console.error('Error initializing popup:', getErrorMessage(error));
            this.showMessage('Error loading extension data. Please try again.', 'error');
        }
        finally {
            this.setLoading(false);
        }
    }
    /**
     * Initialize default sites
     */
    initializeDefaultSites() {
        DEFAULT_SITES.forEach(domain => {
            this.state.settings.sites.set(domain, {
                enabled: true,
                timeLimit: this.state.settings.defaultTimeLimit,
                isDefault: true
            });
        });
    }
    /**
     * Set loading state
     */
    setLoading(isLoading) {
        this.state.isLoading = isLoading;
        const loadingElement = document.getElementById('loading');
        const contentElement = document.getElementById('content');
        if (loadingElement && contentElement) {
            if (isLoading) {
                loadingElement.classList.remove('hidden');
                contentElement.classList.add('hidden');
            }
            else {
                loadingElement.classList.add('hidden');
                contentElement.classList.remove('hidden');
            }
        }
    }
    /**
     * Set button loading state
     */
    setButtonLoading(button, isLoading) {
        if (isLoading) {
            button.disabled = true;
            button.dataset['originalText'] = button.textContent || '';
            button.textContent = 'Loading...';
            button.classList.add('btn-loading');
        }
        else {
            button.disabled = false;
            button.textContent = button.dataset['originalText'] || button.textContent || '';
            button.classList.remove('btn-loading');
        }
    }
    /**
     * Load settings from storage
     */
    async loadSettings() {
        try {
            const result = await chrome.storage.local.get(['defaultTimeLimit', 'sites']);
            if (result.defaultTimeLimit) {
                this.state.settings.defaultTimeLimit = result.defaultTimeLimit;
                const timeLimitInput = document.getElementById('time-limit');
                if (timeLimitInput) {
                    timeLimitInput.value = result.defaultTimeLimit.toString();
                }
            }
            if (result.sites) {
                // Convert stored data to Site objects
                this.state.settings.sites.clear();
                Object.entries(result.sites).forEach(([domain, data]) => {
                    this.state.settings.sites.set(domain, data);
                });
            }
            this.updateBlockedSitesUI();
        }
        catch (error) {
            console.error('Error loading settings:', getErrorMessage(error));
            throw new Error('Failed to load settings');
        }
    }
    /**
     * Load time data from background script
     */
    async loadTimeData() {
        try {
            console.log('Sending getAllTimeData message to background script...');
            const response = await chrome.runtime.sendMessage({ action: 'getAllTimeData' });
            console.log('Response from background script:', response);
            if (response?.success) {
                console.log('Time data loaded successfully:', response.data);
                this.displayTimeStats(response.data || {});
            }
            else {
                console.log('No time data or error response, showing empty state');
                this.displayTimeStats({});
            }
        }
        catch (error) {
            console.error('Error loading time data:', getErrorMessage(error));
            this.showEmptyState();
        }
    }
    /**
     * Display time statistics
     */
    displayTimeStats(timeData) {
        const siteStatsContainer = document.getElementById('site-stats');
        if (!siteStatsContainer)
            return;
        if (!timeData || Object.keys(timeData).length === 0) {
            this.showEmptyState();
            return;
        }
        siteStatsContainer.innerHTML = '';
        // Sort sites by time spent (descending)
        const sortedSites = Object.entries(timeData)
            .sort(([, a], [, b]) => b.timeSpent - a.timeSpent);
        sortedSites.forEach(([site, data]) => {
            const siteElement = this.createSiteStatElement(site, data);
            siteStatsContainer.appendChild(siteElement);
        });
    }
    /**
     * Create site statistics element
     */
    createSiteStatElement(site, data) {
        const siteConfig = this.state.settings.sites.get(site);
        const timeLimit = (siteConfig?.timeLimit || this.state.settings.defaultTimeLimit) * 60 * 1000;
        const percentage = Math.min(1, data.timeSpent / timeLimit);
        const displayName = SITE_DISPLAY_NAMES[site] || site;
        const icon = SITE_ICONS[site] || '🌐';
        const element = document.createElement('div');
        element.className = 'site-stat-item';
        let progressBarClass = 'progress-bar-safe';
        if (percentage >= 0.9) {
            progressBarClass = 'progress-bar-danger';
        }
        else if (percentage >= 0.8) {
            progressBarClass = 'progress-bar-warning';
        }
        element.innerHTML = `
      <div class="site-stat-info">
        <div class="site-stat-icon">${icon}</div>
        <div>
          <div class="site-stat-name">${this.escapeHtml(displayName)}</div>
          <div class="site-stat-time">${formatTime(data.timeSpent)}</div>
        </div>
      </div>
      <div class="site-stat-progress">
        <div class="site-stat-bar">
          <div class="site-stat-fill ${progressBarClass}" style="width: ${percentage * 100}%"></div>
        </div>
        <div class="site-stat-percentage">${formatPercentage(percentage)}</div>
      </div>
    `;
        return element;
    }
    /**
     * Show empty state
     */
    showEmptyState() {
        const siteStatsContainer = document.getElementById('site-stats');
        if (!siteStatsContainer)
            return;
        siteStatsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📊</div>
        <div class="empty-state-message">No activity data yet. Visit some websites to see your usage statistics.</div>
      </div>
    `;
    }
    /**
     * Update blocked sites UI
     */
    updateBlockedSitesUI() {
        const blockedSitesContainer = document.getElementById('blocked-sites');
        if (!blockedSitesContainer)
            return;
        blockedSitesContainer.innerHTML = '';
        this.state.settings.sites.forEach((config, domain) => {
            const siteElement = this.createSiteElement(domain, config);
            blockedSitesContainer.appendChild(siteElement);
        });
    }
    /**
     * Create site configuration element
     */
    createSiteElement(domain, config) {
        const displayName = SITE_DISPLAY_NAMES[domain] || domain;
        const icon = SITE_ICONS[domain] || '🌐';
        const isDefault = config.isDefault;
        const element = document.createElement('div');
        element.className = 'site-item';
        element.dataset['domain'] = domain;
        element.innerHTML = `
      <div class="site-item-info">
        <input type="checkbox" 
               class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2" 
               ${config.enabled ? 'checked' : ''} 
               onchange="window.popupManager.toggleSite('${domain}')">
        <div class="site-item-icon">${icon}</div>
        <label class="site-item-label cursor-pointer">${this.escapeHtml(displayName)}</label>
      </div>
      <div class="site-item-controls">
        <input type="number" 
               class="site-item-time-input" 
               value="${config.timeLimit}" 
               min="1" 
               max="480"
               onchange="window.popupManager.updateSiteTimeLimit('${domain}', this.value)">
        <span class="text-xs text-gray-500 font-medium">min</span>
        ${!isDefault ? `<button class="site-item-remove" onclick="window.popupManager.removeSite('${domain}')" title="Remove site">×</button>` : ''}
      </div>
    `;
        return element;
    }
    /**
     * Toggle site enabled state
     */
    toggleSite(domain) {
        const siteConfig = this.state.settings.sites.get(domain);
        if (siteConfig) {
            siteConfig.enabled = !siteConfig.enabled;
            this.saveSettings(false);
        }
    }
    /**
     * Update site time limit
     */
    updateSiteTimeLimit(domain, value) {
        try {
            const timeLimit = validateTimeLimit(parseInt(value));
            const siteConfig = this.state.settings.sites.get(domain);
            if (siteConfig) {
                siteConfig.timeLimit = timeLimit;
                this.saveSettings(false);
            }
        }
        catch (error) {
            this.showMessage(getErrorMessage(error), 'error');
        }
    }
    /**
     * Remove a custom site
     */
    removeSite(domain) {
        if (confirm(`Are you sure you want to remove ${domain}?`)) {
            this.state.settings.sites.delete(domain);
            this.updateBlockedSitesUI();
            this.saveSettings();
        }
    }
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Global reference for onclick handlers
        window.popupManager = this;
        // Time limit input
        const timeLimitInput = document.getElementById('time-limit');
        if (timeLimitInput) {
            timeLimitInput.addEventListener('change', (e) => {
                const target = e.target;
                try {
                    const value = validateTimeLimit(parseInt(target.value));
                    this.state.settings.defaultTimeLimit = value;
                    this.saveSettings(false);
                }
                catch (error) {
                    this.showMessage(getErrorMessage(error), 'error');
                    target.value = this.state.settings.defaultTimeLimit.toString();
                }
            });
        }
        // Add custom site button
        const addSiteButton = document.getElementById('add-site');
        if (addSiteButton) {
            addSiteButton.addEventListener('click', () => this.addCustomSite());
        }
        // Custom site input (Enter key)
        const customSiteInput = document.getElementById('custom-site');
        if (customSiteInput) {
            customSiteInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addCustomSite();
                }
            });
        }
        // Save settings button
        const saveButton = document.getElementById('save-settings');
        if (saveButton) {
            saveButton.addEventListener('click', () => this.saveSettings());
        }
        // Reset today button
        const resetButton = document.getElementById('reset-today');
        if (resetButton) {
            resetButton.addEventListener('click', () => this.resetTodayData());
        }
    }
    /**
     * Add custom site
     */
    async addCustomSite() {
        const customSiteInput = document.getElementById('custom-site');
        const customTimeLimitInput = document.getElementById('custom-time-limit');
        const addButton = document.getElementById('add-site');
        if (!customSiteInput || !addButton)
            return;
        const domain = customSiteInput.value.trim();
        const timeLimit = customTimeLimitInput?.value ? parseInt(customTimeLimitInput.value) : this.state.settings.defaultTimeLimit;
        if (!domain) {
            this.showMessage('Please enter a website domain', 'error');
            return;
        }
        try {
            this.setButtonLoading(addButton, true);
            const validatedDomain = validateDomain(domain);
            const validatedTimeLimit = validateTimeLimit(timeLimit);
            if (this.state.settings.sites.has(validatedDomain)) {
                this.showMessage('This site is already in your list', 'error');
                return;
            }
            // Add new site
            this.state.settings.sites.set(validatedDomain, {
                enabled: true,
                timeLimit: validatedTimeLimit,
                isDefault: false
            });
            // Clear inputs
            customSiteInput.value = '';
            if (customTimeLimitInput) {
                customTimeLimitInput.value = '';
            }
            // Update UI
            this.updateBlockedSitesUI();
            await this.saveSettings();
            this.showMessage(`Added ${validatedDomain} successfully`, 'success');
        }
        catch (error) {
            this.showMessage(getErrorMessage(error), 'error');
        }
        finally {
            this.setButtonLoading(addButton, false);
        }
    }
    /**
     * Save settings
     */
    async saveSettings(showMessage = true) {
        try {
            const settings = {
                defaultTimeLimit: this.state.settings.defaultTimeLimit,
                sites: Object.fromEntries(this.state.settings.sites)
            };
            const response = await chrome.runtime.sendMessage({
                action: 'updateSettings',
                settings
            });
            if (response?.success) {
                if (showMessage) {
                    this.showMessage('Settings saved successfully', 'success');
                }
            }
            else {
                throw new Error(response?.error || 'Failed to save settings');
            }
        }
        catch (error) {
            console.error('Error saving settings:', getErrorMessage(error));
            this.showMessage('Error saving settings. Please try again.', 'error');
        }
    }
    /**
     * Reset today's data
     */
    async resetTodayData() {
        if (!confirm('Are you sure you want to reset all time data for today? This cannot be undone.')) {
            return;
        }
        const resetButton = document.getElementById('reset-today');
        if (!resetButton)
            return;
        try {
            this.setButtonLoading(resetButton, true);
            const response = await chrome.runtime.sendMessage({
                action: 'resetTodayData'
            });
            if (response?.success) {
                this.showMessage('Today\'s data has been reset', 'success');
                await this.loadTimeData();
            }
            else {
                throw new Error(response?.error || 'Failed to reset data');
            }
        }
        catch (error) {
            console.error('Error resetting data:', getErrorMessage(error));
            this.showMessage('Error resetting data. Please try again.', 'error');
        }
        finally {
            this.setButtonLoading(resetButton, false);
        }
    }
    /**
     * Show message to user
     */
    showMessage(text, type = 'info') {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.message-container');
        existingMessages.forEach(msg => msg.remove());
        // Create message element
        const messageContainer = document.createElement('div');
        messageContainer.className = 'message-container';
        const message = document.createElement('div');
        message.className = `message message-${type}`;
        message.textContent = text;
        messageContainer.appendChild(message);
        document.body.appendChild(messageContainer);
        // Auto-remove after 3 seconds
        setTimeout(() => {
            messageContainer.remove();
        }, 3000);
    }
    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
/**
 * Initialize popup when DOM is ready
 */
function initializePopup() {
    new PopupManager();
}
// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePopup);
}
else {
    initializePopup();
}
//# sourceMappingURL=index.js.map
/**
 * Shared utility functions for Website Time Manager Extension - Content Script Version
 * This file is loaded by content scripts and creates a global WTMUtils object
 */

/**
 * Extracts the site domain from a hostname by removing the 'www.' prefix
 * @param {string} hostname - The hostname to process
 * @returns {string} The site domain without 'www.' prefix
 */
function extractSite(hostname) {
  if (!hostname || typeof hostname !== 'string') {
    return '';
  }
  return hostname.replace(/^www\./, '');
}

/**
 * Formats time in milliseconds to a human-readable string
 * @param {number} timeMs - Time in milliseconds
 * @returns {string} Formatted time string (e.g., "2h 30m", "45m", "30s")
 */
function formatTime(timeMs) {
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
}

/**
 * Formats time in milliseconds to MM:SS format
 * @param {number} timeMs - Time in milliseconds
 * @returns {string} Time in MM:SS format
 */
function formatTimeDigital(timeMs) {
  if (!timeMs || timeMs < 0) return '00:00';
  
  const totalSeconds = Math.floor(timeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Validates if a URL/hostname is valid
 * @param {string} url - The URL or hostname to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidUrl(url) {
  if (!url || typeof url !== 'string') return false;
  
  // Remove protocol if present
  const cleanUrl = url.replace(/^https?:\/\//, '');
  
  // Basic hostname validation
  const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return hostnameRegex.test(cleanUrl);
}

/**
 * Gets the current date string in YYYY-MM-DD format
 * @returns {string} Today's date string
 */
function getTodayString() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * Calculates the next midnight timestamp
 * @returns {number} Timestamp for next midnight
 */
function getNextMidnight() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.getTime();
}

/**
 * Finds a matching site from a list of sites, including subdomain matching
 * @param {string} hostname - The hostname to match
 * @param {Map|Object} sites - Map or object of sites to search through
 * @returns {string|null} The matching site or null if not found
 */
function findMatchingSite(hostname, sites) {
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
}

/**
 * Debounces a function call
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @returns {Function} The debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Creates a safe async wrapper that handles errors gracefully
 * @param {Function} asyncFn - The async function to wrap
 * @param {*} defaultValue - Default value to return on error
 * @returns {Function} The wrapped function
 */
function safeAsync(asyncFn, defaultValue = null) {
  return async (...args) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      console.error('Safe async error:', error);
      return defaultValue;
    }
  };
}

/**
 * Checks if the current environment is a content script
 * @returns {boolean} True if running in content script context
 */
function isContentScript() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Checks if the current environment is a background script
 * @returns {boolean} True if running in background script context
 */
function isBackgroundScript() {
  return typeof window === 'undefined' && typeof chrome !== 'undefined' && chrome.runtime;
}

// Create global WTMUtils object for content scripts
window.WTMUtils = {
  extractSite,
  formatTime,
  formatTimeDigital,
  isValidUrl,
  getTodayString,
  getNextMidnight,
  findMatchingSite,
  debounce,
  safeAsync,
  isContentScript,
  isBackgroundScript
}; 
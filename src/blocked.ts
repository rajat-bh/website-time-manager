// Chrome APIs are available globally
declare const chrome: any;

import type { MessageAction } from './types/index.js';

// Site display names mapping
const SITE_DISPLAY_NAMES: Record<string, string> = {
  'youtube.com': 'YouTube',
  'facebook.com': 'Facebook',
  'twitter.com': 'Twitter',
  'instagram.com': 'Instagram',
  'tiktok.com': 'TikTok',
  'reddit.com': 'Reddit'
};

// Get site from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const site = urlParams.get('site') || 'this website';

// Format site name for display
function formatSiteName(site: string): string {
  return SITE_DISPLAY_NAMES[site] || site.charAt(0).toUpperCase() + site.slice(1);
}

// Update countdown to midnight
function updateCountdown(): void {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const timeDiff = tomorrow.getTime() - now.getTime();
  
  const hours = Math.floor(timeDiff / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
  
  const countdownElement = document.getElementById('countdown');
  if (countdownElement) {
    countdownElement.textContent = 
      `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}

// Load time data with better error handling
async function loadTimeData(): Promise<void> {
  try {
    if (!chrome?.runtime?.sendMessage) {
      console.warn('Chrome runtime not available');
      return;
    }

    const response = await chrome.runtime.sendMessage({
      action: 'getTimeData' as MessageAction,
      site: site
    });
    
    if (response?.success && response.data) {
      const timeUsedMs = response.data.timeSpent;
      const hours = Math.floor(timeUsedMs / (60 * 60 * 1000));
      const minutes = Math.floor((timeUsedMs % (60 * 60 * 1000)) / (60 * 1000));
      
      const timeUsedElement = document.getElementById('time-used');
      if (timeUsedElement) {
        timeUsedElement.textContent = 
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
    }
  } catch (error) {
    console.error('Error loading time data:', error);
    // Fallback: keep the default display
  }
}

// Open extension popup with better UX
function openExtensionPopup(): void {
  try {
    if (chrome?.tabs?.create) {
      chrome.tabs.create({ url: chrome.runtime.getURL('src/popup/popup.html') });
    } else {
      // Fallback: show helpful instructions
      alert('Click the Website Time Manager extension icon in your browser toolbar to view detailed statistics and manage settings.');
    }
  } catch (error) {
    console.error('Error opening popup:', error);
    alert('Click the Website Time Manager extension icon in your browser toolbar to view detailed statistics and manage settings.');
  }
}

// Show motivational quote
function showMotivationalQuote(): void {
  const quotes = [
    "The best time to plant a tree was 20 years ago. The second best time is now.",
    "Your future self will thank you for the choices you make today.",
    "Small steps in the right direction can turn out to be the biggest step of your life.",
    "Progress, not perfection.",
    "Time is the most valuable thing we have.",
    "Success is the sum of small efforts repeated day in and day out.",
    "The only way to do great work is to love what you do."
  ];

  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  const quoteElement = document.createElement('div');
  quoteElement.className = 'quote-container';
  quoteElement.innerHTML = `"${randomQuote}"`;
  
  const blockedContent = document.querySelector('.blocked-content');
  if (blockedContent) {
    blockedContent.appendChild(quoteElement);
  }
}

// Initialize page
function initializePage(): void {
  // Update site name
  const siteNameElement = document.getElementById('site-name');
  if (siteNameElement) {
    siteNameElement.textContent = formatSiteName(site);
  }
  
  updateCountdown();
  loadTimeData();
  
  // Update countdown every second
  setInterval(updateCountdown, 1000);

  // Show motivational quote after 2 seconds
  setTimeout(showMotivationalQuote, 2000);
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    window.close();
  } else if (e.key === 'Enter') {
    openExtensionPopup();
  }
});

// Make openExtensionPopup available globally for the HTML onclick handler
(window as any).openExtensionPopup = openExtensionPopup;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePage);
} else {
  initializePage();
} 
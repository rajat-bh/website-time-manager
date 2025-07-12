/**
 * Type definitions for Website Time Manager Chrome Extension
 */
// Error Types
export class ExtensionError extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = 'ExtensionError';
    }
}
export class StorageError extends ExtensionError {
    constructor(message) {
        super(message, 'STORAGE_ERROR');
        this.name = 'StorageError';
    }
}
export class ValidationError extends ExtensionError {
    constructor(message) {
        super(message, 'VALIDATION_ERROR');
        this.name = 'ValidationError';
    }
}
// Constants
export const DEFAULT_TIME_LIMIT = 30; // minutes
export const WARNING_THRESHOLD = 0.8; // 80%
export const MAX_UPDATE_INTERVAL = 5000; // 5 seconds
export const DEFAULT_SITES = [
    'youtube.com',
    'facebook.com',
    'instagram.com',
    'twitter.com',
    'tiktok.com',
    'reddit.com'
];
// Site Display Names and Icons
export const SITE_DISPLAY_NAMES = {
    'youtube.com': 'YouTube',
    'facebook.com': 'Facebook',
    'twitter.com': 'Twitter',
    'instagram.com': 'Instagram',
    'tiktok.com': 'TikTok',
    'reddit.com': 'Reddit'
};
export const SITE_ICONS = {
    'youtube.com': '🎥',
    'facebook.com': '👥',
    'twitter.com': '🐦',
    'instagram.com': '📷',
    'tiktok.com': '🎵',
    'reddit.com': '🤖'
};
//# sourceMappingURL=index.js.map
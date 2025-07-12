/**
 * Website Time Manager - Content Script
 * TypeScript version with improved type safety and Tailwind CSS styling
 */
interface SiteConfig {
    enabled: boolean;
    timeLimit: number;
    isDefault?: boolean;
}
interface TimeData {
    timeSpent: number;
    date: string;
    lastUpdate: number;
}
interface ChromeMessage {
    action: string;
    [key: string]: any;
}
interface ShowWarningMessage extends ChromeMessage {
    action: 'showWarning';
    message: string;
    remainingTime: number;
}
interface WarningElement extends HTMLElement {
    id: 'website-time-manager-warning';
}
interface ContentState {
    warningShown: boolean;
    warningElement: WarningElement | null;
    sites: Map<string, SiteConfig>;
    defaultTimeLimit: number;
}
declare const DEFAULT_TIME_LIMIT = 30;
declare const extractSite: (hostname: string) => string;
declare const formatTime: (timeMs: number) => string;
declare const findMatchingSite: (hostname: string, sites: Map<string, SiteConfig> | Record<string, SiteConfig>) => string | null;
declare const getErrorMessage: (error: unknown) => string;
/**
 * Content script manager for handling warnings and timers
 */
declare class ContentTimeManager {
    private state;
    constructor();
    /**
     * Initialize the content script
     */
    private initialize;
    /**
     * Load settings from storage
     */
    private loadSettings;
    /**
     * Set up message listener for communication with background script
     */
    private setupMessageListener;
    /**
     * Check the current site and show appropriate warnings
     */
    private checkCurrentSite;
    /**
     * Create warning template with Tailwind CSS classes
     */
    private createWarningTemplate;
    /**
     * Show warning overlay
     */
    private showWarning;
    /**
     * Hide warning overlay
     */
    private hideWarning;
    /**
     * Escape HTML to prevent XSS attacks
     */
    private escapeHtml;
}
/**
 * Initialize the content script manager
 */
declare function initializeContentScript(): void;
//# sourceMappingURL=index.d.ts.map
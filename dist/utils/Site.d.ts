/**
 * Site class for Website Time Manager Extension
 * TypeScript version with improved type safety and validation
 */
import type { ISite, SiteConfig } from '../types/index.js';
/**
 * Represents a website with time management configuration
 */
export declare class Site implements ISite {
    readonly domain: string;
    enabled: boolean;
    timeLimit: number;
    readonly isDefault: boolean;
    constructor(domain: string, config?: Partial<SiteConfig>);
    /**
     * Toggle the enabled state of the site
     */
    toggle(): void;
    /**
     * Set the time limit for the site
     * @param minutes - Time limit in minutes (1-480)
     * @throws ValidationError if the time limit is invalid
     */
    setTimeLimit(minutes: number): void;
    /**
     * Get the display name for the site
     * @returns Human-readable site name
     */
    getDisplayName(): string;
    /**
     * Get the icon for the site
     * @returns Emoji icon for the site
     */
    getIcon(): string;
    /**
     * Convert the site to a JSON object for storage
     * @returns Site configuration object
     */
    toJSON(): SiteConfig;
    /**
     * Create a Site instance from stored data
     * @param domain - The domain name
     * @param data - Stored site configuration
     * @returns New Site instance
     */
    static fromJSON(domain: string, data: SiteConfig): Site;
    /**
     * Validate if a domain matches this site (including subdomains)
     * @param hostname - The hostname to check
     * @returns True if the hostname matches this site
     */
    matches(hostname: string): boolean;
    /**
     * Get a string representation of the site
     * @returns String representation
     */
    toString(): string;
    /**
     * Check if two sites are equal
     * @param other - Other site to compare
     * @returns True if sites are equal
     */
    equals(other: Site): boolean;
    /**
     * Clone the site with optional configuration overrides
     * @param overrides - Configuration overrides
     * @returns New Site instance
     */
    clone(overrides?: Partial<SiteConfig>): Site;
}
//# sourceMappingURL=Site.d.ts.map
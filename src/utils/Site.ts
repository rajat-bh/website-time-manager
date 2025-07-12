/**
 * Site class for Website Time Manager Extension
 * TypeScript version with improved type safety and validation
 */

import type { ISite, SiteConfig } from '../types/index.js';
import { SITE_DISPLAY_NAMES, SITE_ICONS } from '../types/index.js';
import { validateDomain, validateTimeLimit } from './index.js';

/**
 * Represents a website with time management configuration
 */
export class Site implements ISite {
  public readonly domain: string;
  public enabled: boolean;
  public timeLimit: number; // in minutes
  public readonly isDefault: boolean;

  constructor(domain: string, config: Partial<SiteConfig> = {}) {
    this.domain = validateDomain(domain);
    this.enabled = config.enabled !== undefined ? config.enabled : true;
    this.timeLimit = config.timeLimit ? validateTimeLimit(config.timeLimit) : 30;
    this.isDefault = config.isDefault || false;
  }

  /**
   * Toggle the enabled state of the site
   */
  toggle(): void {
    this.enabled = !this.enabled;
  }

  /**
   * Set the time limit for the site
   * @param minutes - Time limit in minutes (1-480)
   * @throws ValidationError if the time limit is invalid
   */
  setTimeLimit(minutes: number): void {
    this.timeLimit = validateTimeLimit(minutes);
  }

  /**
   * Get the display name for the site
   * @returns Human-readable site name
   */
  getDisplayName(): string {
    return SITE_DISPLAY_NAMES[this.domain] || this.domain;
  }

  /**
   * Get the icon for the site
   * @returns Emoji icon for the site
   */
  getIcon(): string {
    return SITE_ICONS[this.domain] || '🌐';
  }

  /**
   * Convert the site to a JSON object for storage
   * @returns Site configuration object
   */
  toJSON(): SiteConfig {
    return {
      enabled: this.enabled,
      timeLimit: this.timeLimit,
      isDefault: this.isDefault
    };
  }

  /**
   * Create a Site instance from stored data
   * @param domain - The domain name
   * @param data - Stored site configuration
   * @returns New Site instance
   */
  static fromJSON(domain: string, data: SiteConfig): Site {
    return new Site(domain, data);
  }

  /**
   * Validate if a domain matches this site (including subdomains)
   * @param hostname - The hostname to check
   * @returns True if the hostname matches this site
   */
  matches(hostname: string): boolean {
    if (!hostname) return false;
    
    // Direct match
    if (hostname === this.domain) return true;
    
    // Subdomain match
    return hostname.endsWith('.' + this.domain);
  }

  /**
   * Get a string representation of the site
   * @returns String representation
   */
  toString(): string {
    return `Site(${this.domain}, enabled=${this.enabled}, timeLimit=${this.timeLimit}m)`;
  }

  /**
   * Check if two sites are equal
   * @param other - Other site to compare
   * @returns True if sites are equal
   */
  equals(other: Site): boolean {
    return this.domain === other.domain;
  }

  /**
   * Clone the site with optional configuration overrides
   * @param overrides - Configuration overrides
   * @returns New Site instance
   */
  clone(overrides: Partial<SiteConfig> = {}): Site {
    return new Site(this.domain, {
      ...this.toJSON(),
      ...overrides
    });
  }
} 
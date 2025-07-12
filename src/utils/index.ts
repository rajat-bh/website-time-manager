/**
 * Shared utility functions for Website Time Manager Extension
 * TypeScript version with improved type safety and error handling
 */

import type {
  ExtractSiteFunction,
  FormatTimeFunction,
  FormatTimeDigitalFunction,
  IsValidUrlFunction,
  GetTodayStringFunction,
  GetNextMidnightFunction,
  FindMatchingSiteFunction,
  DebounceFunction,
  SafeAsyncFunction,
  SiteConfig
} from '../types/index.js';

import { ValidationError } from '../types/index.js';

/**
 * Extracts the site domain from a hostname by removing the 'www.' prefix
 * @param hostname - The hostname to process
 * @returns The site domain without 'www.' prefix
 */
export const extractSite: ExtractSiteFunction = (hostname: string): string => {
  if (!hostname || typeof hostname !== 'string') {
    return '';
  }
  return hostname.replace(/^www\./, '');
};

/**
 * Formats time in milliseconds to a human-readable string
 * @param timeMs - Time in milliseconds
 * @returns Formatted time string (e.g., "2h 30m", "45m", "30s")
 */
export const formatTime: FormatTimeFunction = (timeMs: number): string => {
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
};

/**
 * Formats time in milliseconds to MM:SS format
 * @param timeMs - Time in milliseconds
 * @returns Time in MM:SS format
 */
export const formatTimeDigital: FormatTimeDigitalFunction = (timeMs: number): string => {
  if (!timeMs || timeMs < 0) return '00:00';
  
  const totalSeconds = Math.floor(timeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Validates if a URL/hostname is valid
 * @param url - The URL or hostname to validate
 * @returns True if valid, false otherwise
 */
export const isValidUrl: IsValidUrlFunction = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  
  // Remove protocol if present
  const cleanUrl = url.replace(/^https?:\/\//, '');
  
  // Basic hostname validation
  const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return hostnameRegex.test(cleanUrl);
};

/**
 * Gets the current date string in YYYY-MM-DD format
 * @returns Today's date string
 */
export const getTodayString: GetTodayStringFunction = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0] as string;
};

/**
 * Calculates the next midnight timestamp
 * @returns Timestamp for next midnight
 */
export const getNextMidnight: GetNextMidnightFunction = (): number => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.getTime();
};

/**
 * Finds a matching site from a list of sites, including subdomain matching
 * @param hostname - The hostname to match
 * @param sites - Map or object of sites to search through
 * @returns The matching site or null if not found
 */
export const findMatchingSite: FindMatchingSiteFunction = (
  hostname: string,
  sites: Map<string, SiteConfig> | Record<string, SiteConfig>
): string | null => {
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
};

/**
 * Debounces a function call with improved TypeScript support
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns The debounced function
 */
export const debounce: DebounceFunction = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: number | undefined;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = window.setTimeout(later, wait);
  };
};

/**
 * Creates a safe async wrapper that handles errors gracefully
 * @param asyncFn - The async function to wrap
 * @param defaultValue - Default value to return on error
 * @returns The wrapped function
 */
export const safeAsync: SafeAsyncFunction = <T extends (...args: any[]) => Promise<any>>(
  asyncFn: T,
  defaultValue: any = null
): ((...args: Parameters<T>) => Promise<any>) => {
  return async (...args: Parameters<T>) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      console.error('Safe async error:', error);
      return defaultValue;
    }
  };
};

/**
 * Validates a domain string
 * @param domain - The domain to validate
 * @returns The validated and normalized domain
 * @throws ValidationError if domain is invalid
 */
export const validateDomain = (domain: string): string => {
  if (!domain || typeof domain !== 'string') {
    throw new ValidationError('Domain must be a non-empty string');
  }

  // Remove protocol if present
  let cleanDomain = domain.replace(/^https?:\/\//, '');
  
  // Remove www if present
  cleanDomain = extractSite(cleanDomain);
  
  // Remove trailing slash
  cleanDomain = cleanDomain.replace(/\/$/, '');
  
  // Basic domain validation
  if (!cleanDomain || !cleanDomain.includes('.')) {
    throw new ValidationError('Invalid domain format');
  }

  if (!isValidUrl(cleanDomain)) {
    throw new ValidationError('Domain contains invalid characters');
  }

  return cleanDomain.toLowerCase();
};

/**
 * Validates time limit input
 * @param timeLimit - Time limit in minutes
 * @returns The validated time limit
 * @throws ValidationError if time limit is invalid
 */
export const validateTimeLimit = (timeLimit: number): number => {
  if (typeof timeLimit !== 'number' || isNaN(timeLimit)) {
    throw new ValidationError('Time limit must be a valid number');
  }

  if (timeLimit < 1 || timeLimit > 480) {
    throw new ValidationError('Time limit must be between 1 and 480 minutes');
  }

  return Math.floor(timeLimit);
};

/**
 * Safely parses JSON with error handling
 * @param jsonString - JSON string to parse
 * @param defaultValue - Default value if parsing fails
 * @returns Parsed object or default value
 */
export const safeJsonParse = <T>(jsonString: string, defaultValue: T): T => {
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return defaultValue;
  }
};

/**
 * Safely stringifies object with error handling
 * @param obj - Object to stringify
 * @param defaultValue - Default value if stringification fails
 * @returns JSON string or default value
 */
export const safeJsonStringify = (obj: any, defaultValue: string = '{}'): string => {
  try {
    return JSON.stringify(obj);
  } catch {
    return defaultValue;
  }
};

/**
 * Clamps a number between min and max values
 * @param value - The value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Checks if a value is a valid non-negative number
 * @param value - Value to check
 * @returns True if valid non-negative number
 */
export const isValidNonNegativeNumber = (value: any): value is number => {
  return typeof value === 'number' && !isNaN(value) && value >= 0;
};

/**
 * Formats a percentage value
 * @param value - Value between 0 and 1
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number, decimals: number = 0): string => {
  const percentage = value * 100;
  return `${percentage.toFixed(decimals)}%`;
};

/**
 * Gets a human-readable error message
 * @param error - The error object
 * @returns Human-readable error message
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
};

/**
 * Creates a delay promise for async operations
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after the delay
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Export all utilities as a single object for backward compatibility
export const WTMUtils = {
  extractSite,
  formatTime,
  formatTimeDigital,
  isValidUrl,
  getTodayString,
  getNextMidnight,
  findMatchingSite,
  debounce,
  safeAsync,
  validateDomain,
  validateTimeLimit,
  safeJsonParse,
  safeJsonStringify,
  clamp,
  isValidNonNegativeNumber,
  formatPercentage,
  getErrorMessage,
  delay
}; 
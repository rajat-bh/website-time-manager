/**
 * Shared utility functions for Website Time Manager Extension
 * TypeScript version with improved type safety and error handling
 */
import type { ExtractSiteFunction, FormatTimeFunction, FormatTimeDigitalFunction, IsValidUrlFunction, GetTodayStringFunction, GetNextMidnightFunction, FindMatchingSiteFunction, DebounceFunction, SafeAsyncFunction } from '../types/index.js';
/**
 * Extracts the site domain from a hostname by removing the 'www.' prefix
 * @param hostname - The hostname to process
 * @returns The site domain without 'www.' prefix
 */
export declare const extractSite: ExtractSiteFunction;
/**
 * Formats time in milliseconds to a human-readable string
 * @param timeMs - Time in milliseconds
 * @returns Formatted time string (e.g., "2h 30m", "45m", "30s")
 */
export declare const formatTime: FormatTimeFunction;
/**
 * Formats time in milliseconds to MM:SS format
 * @param timeMs - Time in milliseconds
 * @returns Time in MM:SS format
 */
export declare const formatTimeDigital: FormatTimeDigitalFunction;
/**
 * Validates if a URL/hostname is valid
 * @param url - The URL or hostname to validate
 * @returns True if valid, false otherwise
 */
export declare const isValidUrl: IsValidUrlFunction;
/**
 * Gets the current date string in YYYY-MM-DD format
 * @returns Today's date string
 */
export declare const getTodayString: GetTodayStringFunction;
/**
 * Calculates the next midnight timestamp
 * @returns Timestamp for next midnight
 */
export declare const getNextMidnight: GetNextMidnightFunction;
/**
 * Finds a matching site from a list of sites, including subdomain matching
 * @param hostname - The hostname to match
 * @param sites - Map or object of sites to search through
 * @returns The matching site or null if not found
 */
export declare const findMatchingSite: FindMatchingSiteFunction;
/**
 * Debounces a function call with improved TypeScript support
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns The debounced function
 */
export declare const debounce: DebounceFunction;
/**
 * Creates a safe async wrapper that handles errors gracefully
 * @param asyncFn - The async function to wrap
 * @param defaultValue - Default value to return on error
 * @returns The wrapped function
 */
export declare const safeAsync: SafeAsyncFunction;
/**
 * Validates a domain string
 * @param domain - The domain to validate
 * @returns The validated and normalized domain
 * @throws ValidationError if domain is invalid
 */
export declare const validateDomain: (domain: string) => string;
/**
 * Validates time limit input
 * @param timeLimit - Time limit in minutes
 * @returns The validated time limit
 * @throws ValidationError if time limit is invalid
 */
export declare const validateTimeLimit: (timeLimit: number) => number;
/**
 * Safely parses JSON with error handling
 * @param jsonString - JSON string to parse
 * @param defaultValue - Default value if parsing fails
 * @returns Parsed object or default value
 */
export declare const safeJsonParse: <T>(jsonString: string, defaultValue: T) => T;
/**
 * Safely stringifies object with error handling
 * @param obj - Object to stringify
 * @param defaultValue - Default value if stringification fails
 * @returns JSON string or default value
 */
export declare const safeJsonStringify: (obj: any, defaultValue?: string) => string;
/**
 * Clamps a number between min and max values
 * @param value - The value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export declare const clamp: (value: number, min: number, max: number) => number;
/**
 * Checks if a value is a valid non-negative number
 * @param value - Value to check
 * @returns True if valid non-negative number
 */
export declare const isValidNonNegativeNumber: (value: any) => value is number;
/**
 * Formats a percentage value
 * @param value - Value between 0 and 1
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted percentage string
 */
export declare const formatPercentage: (value: number, decimals?: number) => string;
/**
 * Gets a human-readable error message
 * @param error - The error object
 * @returns Human-readable error message
 */
export declare const getErrorMessage: (error: unknown) => string;
/**
 * Creates a delay promise for async operations
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after the delay
 */
export declare const delay: (ms: number) => Promise<void>;
export declare const WTMUtils: {
    extractSite: ExtractSiteFunction;
    formatTime: FormatTimeFunction;
    formatTimeDigital: FormatTimeDigitalFunction;
    isValidUrl: IsValidUrlFunction;
    getTodayString: GetTodayStringFunction;
    getNextMidnight: GetNextMidnightFunction;
    findMatchingSite: FindMatchingSiteFunction;
    debounce: DebounceFunction;
    safeAsync: SafeAsyncFunction;
    validateDomain: (domain: string) => string;
    validateTimeLimit: (timeLimit: number) => number;
    safeJsonParse: <T>(jsonString: string, defaultValue: T) => T;
    safeJsonStringify: (obj: any, defaultValue?: string) => string;
    clamp: (value: number, min: number, max: number) => number;
    isValidNonNegativeNumber: (value: any) => value is number;
    formatPercentage: (value: number, decimals?: number) => string;
    getErrorMessage: (error: unknown) => string;
    delay: (ms: number) => Promise<void>;
};
//# sourceMappingURL=index.d.ts.map
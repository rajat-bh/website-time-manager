/**
 * Type definitions for Website Time Manager Chrome Extension
 */

// Site Configuration Interface
export interface SiteConfig {
  enabled: boolean;
  timeLimit: number; // in minutes
  isDefault?: boolean;
}

// Time Data Interface
export interface TimeData {
  timeSpent: number; // in milliseconds
  date: string; // YYYY-MM-DD format
  lastUpdate: number; // timestamp
}

// Site Class Interface
export interface ISite {
  domain: string;
  enabled: boolean;
  timeLimit: number;
  isDefault: boolean;
  toggle(): void;
  setTimeLimit(minutes: number): void;
  getDisplayName(): string;
  getIcon(): string;
  toJSON(): SiteConfig;
}

// Storage Data Interfaces
export interface StorageData {
  defaultTimeLimit?: number;
  sites?: Record<string, SiteConfig>;
  timeData?: Record<string, TimeData>;
}

// Chrome Extension Message Types
export interface ChromeMessage {
  action: string;
  [key: string]: any;
}

export interface GetTimeDataMessage extends ChromeMessage {
  action: 'getTimeData';
  site: string;
}

export interface SetTimeDataMessage extends ChromeMessage {
  action: 'setTimeData';
  site: string;
  data: TimeData;
}

export interface GetAllTimeDataMessage extends ChromeMessage {
  action: 'getAllTimeData';
}

export interface UpdateSettingsMessage extends ChromeMessage {
  action: 'updateSettings';
  settings: {
    defaultTimeLimit: number;
    sites: Record<string, SiteConfig>;
  };
}

export interface ResetTodayDataMessage extends ChromeMessage {
  action: 'resetTodayData';
}

export interface ShowWarningMessage extends ChromeMessage {
  action: 'showWarning';
  message: string;
  remainingTime: number;
}

export interface HideWarningMessage extends ChromeMessage {
  action: 'hideWarning';
}

export interface SettingsUpdatedMessage extends ChromeMessage {
  action: 'settingsUpdated';
}

// Response Types
export interface ChromeResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface TimeDataResponse extends ChromeResponse {
  data?: TimeData;
}

export interface AllTimeDataResponse extends ChromeResponse {
  data?: Record<string, TimeData>;
}

// Tab Information
export interface TabInfo {
  site: string;
  tabId: number;
}

// Extension Settings
export interface ExtensionSettings {
  defaultTimeLimit: number;
  sites: Map<string, SiteConfig>;
}

// Warning Configuration
export interface WarningConfig {
  threshold: number; // percentage (0-1)
  message: string;
  remainingTime: number;
}

// Utility Function Types
export type ExtractSiteFunction = (hostname: string) => string;
export type FormatTimeFunction = (timeMs: number) => string;
export type FormatTimeDigitalFunction = (timeMs: number) => string;
export type IsValidUrlFunction = (url: string) => boolean;
export type GetTodayStringFunction = () => string;
export type GetNextMidnightFunction = () => number;
export type FindMatchingSiteFunction = (hostname: string, sites: Map<string, SiteConfig> | Record<string, SiteConfig>) => string | null;
export type DebounceFunction = <T extends (...args: any[]) => any>(func: T, wait: number) => (...args: Parameters<T>) => void;
export type SafeAsyncFunction = <T extends (...args: any[]) => Promise<any>>(asyncFn: T, defaultValue?: any) => (...args: Parameters<T>) => Promise<any>;

// DOM Element Types for Content Script
export interface WarningElement extends HTMLElement {
  id: 'website-time-manager-warning';
}

export interface TimerElement extends HTMLElement {
  id: 'website-time-manager-timer';
}

// Popup UI State
export interface PopupState {
  isLoading: boolean;
  timeData: Record<string, TimeData>;
  settings: ExtensionSettings;
}

// Background Script State
export interface BackgroundState {
  sites: Map<string, SiteConfig>;
  defaultTimeLimit: number;
  warningThreshold: number;
  activeTab: TabInfo | null;
  sessionStartTime: number | null;
  trackingInterval: number | null;
  maxUpdateInterval: number;
  lastUpdateTime: number;
}

// Content Script State
export interface ContentState {
  warningShown: boolean;
  warningElement: WarningElement | null;
  sites: Map<string, SiteConfig>;
  defaultTimeLimit: number;
}

// Error Types
export class ExtensionError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'ExtensionError';
  }
}

export class StorageError extends ExtensionError {
  constructor(message: string) {
    super(message, 'STORAGE_ERROR');
    this.name = 'StorageError';
  }
}

export class ValidationError extends ExtensionError {
  constructor(message: string) {
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
] as const;

export type DefaultSite = typeof DEFAULT_SITES[number];

// Site Display Names and Icons
export const SITE_DISPLAY_NAMES: Record<string, string> = {
  'youtube.com': 'YouTube',
  'facebook.com': 'Facebook',
  'twitter.com': 'Twitter',
  'instagram.com': 'Instagram',
  'tiktok.com': 'TikTok',
  'reddit.com': 'Reddit'
};

export const SITE_ICONS: Record<string, string> = {
  'youtube.com': '🎥',
  'facebook.com': '👥',
  'twitter.com': '🐦',
  'instagram.com': '📷',
  'tiktok.com': '🎵',
  'reddit.com': '🤖'
};

// Utility type for making all properties optional
export type Partial<T> = {
  [P in keyof T]?: T[P];
};

// Utility type for making all properties required
export type Required<T> = {
  [P in keyof T]-?: T[P];
};

// Utility type for Chrome API responses
export type ChromeApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
}; 
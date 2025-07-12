/**
 * Type definitions for Website Time Manager Chrome Extension
 */
export interface SiteConfig {
    enabled: boolean;
    timeLimit: number;
    isDefault?: boolean;
}
export interface TimeData {
    timeSpent: number;
    date: string;
    lastUpdate: number;
}
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
export interface StorageData {
    defaultTimeLimit?: number;
    sites?: Record<string, SiteConfig>;
    timeData?: Record<string, TimeData>;
}
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
export interface TabInfo {
    site: string;
    tabId: number;
}
export interface ExtensionSettings {
    defaultTimeLimit: number;
    sites: Map<string, SiteConfig>;
}
export interface WarningConfig {
    threshold: number;
    message: string;
    remainingTime: number;
}
export type ExtractSiteFunction = (hostname: string) => string;
export type FormatTimeFunction = (timeMs: number) => string;
export type FormatTimeDigitalFunction = (timeMs: number) => string;
export type IsValidUrlFunction = (url: string) => boolean;
export type GetTodayStringFunction = () => string;
export type GetNextMidnightFunction = () => number;
export type FindMatchingSiteFunction = (hostname: string, sites: Map<string, SiteConfig> | Record<string, SiteConfig>) => string | null;
export type DebounceFunction = <T extends (...args: any[]) => any>(func: T, wait: number) => (...args: Parameters<T>) => void;
export type SafeAsyncFunction = <T extends (...args: any[]) => Promise<any>>(asyncFn: T, defaultValue?: any) => (...args: Parameters<T>) => Promise<any>;
export interface WarningElement extends HTMLElement {
    id: 'website-time-manager-warning';
}
export interface TimerElement extends HTMLElement {
    id: 'website-time-manager-timer';
}
export interface PopupState {
    isLoading: boolean;
    timeData: Record<string, TimeData>;
    settings: ExtensionSettings;
}
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
export interface ContentState {
    warningShown: boolean;
    warningElement: WarningElement | null;
    sites: Map<string, SiteConfig>;
    defaultTimeLimit: number;
}
export declare class ExtensionError extends Error {
    code?: string | undefined;
    constructor(message: string, code?: string | undefined);
}
export declare class StorageError extends ExtensionError {
    constructor(message: string);
}
export declare class ValidationError extends ExtensionError {
    constructor(message: string);
}
export declare const DEFAULT_TIME_LIMIT = 30;
export declare const WARNING_THRESHOLD = 0.8;
export declare const MAX_UPDATE_INTERVAL = 5000;
export declare const DEFAULT_SITES: readonly ["youtube.com", "facebook.com", "instagram.com", "twitter.com", "tiktok.com", "reddit.com"];
export type DefaultSite = typeof DEFAULT_SITES[number];
export declare const SITE_DISPLAY_NAMES: Record<string, string>;
export declare const SITE_ICONS: Record<string, string>;
export type Partial<T> = {
    [P in keyof T]?: T[P];
};
export type Required<T> = {
    [P in keyof T]-?: T[P];
};
export type ChromeApiResponse<T = any> = {
    success: boolean;
    data?: T;
    error?: string;
};
//# sourceMappingURL=index.d.ts.map
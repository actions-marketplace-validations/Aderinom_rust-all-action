export declare function restoreFromCache(cachePath: string[], key: string, restoreKeys?: string[]): Promise<string | undefined>;
export declare function saveToCache(cachePath: string[], key: string): Promise<void>;
/**
 * Generates a cache key
 *
 * Format: {prefix}-{platform-arch?}-{version?}-{postFixes...}
 *
 */
export declare function generateCacheKey(prefix: string, version?: string, usePlatform?: boolean, postFixes?: string[]): string;

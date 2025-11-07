export declare function restoreFromCache(cachePath: string[], key: string, restoreKeys?: string[]): Promise<string | undefined>;
export declare function saveToCache(cachePath: string[], key: string): Promise<boolean>;
/**
 * Generates a cache key
 *
 * Format: {prefix}-{platform-arch?}-{version?}-{postFixes...}
 *
 */
export declare function generateCacheKey(prefix: string, version?: string, usePlatform?: boolean, postFixes?: string[]): string;
export declare function deleteCacheEntry(key: string): Promise<void>;

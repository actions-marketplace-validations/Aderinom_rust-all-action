export declare function restoreBuildCache(projectDir: string, fallbackBranch: string): Promise<void>;
export declare function saveBuildCache(projectDir: string, fallbackBranch: string): Promise<void>;
export declare function buildCacheStrategy(projectDir: string, strategy: string, fallbackBranch: string): {
    restore: () => Promise<void>;
    save: () => Promise<void>;
} | undefined;

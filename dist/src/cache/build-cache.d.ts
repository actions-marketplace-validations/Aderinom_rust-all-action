export interface BuildCacheStrategy {
    restore(): Promise<void>;
    save(): Promise<void>;
}
export declare function buildCacheStrategy(projectDir: string, strategy: string, toolchains: string[], fallbackBranch: string): BuildCacheStrategy | undefined;
export declare class GithubBuildCacheStrategy implements BuildCacheStrategy {
    private cacheKey;
    private fallbackKey;
    private projectDir;
    private fallbackBranch;
    private restoredFrom;
    constructor(projectDir: string, toolchains: string[], fallbackBranch: string);
    restore(): Promise<void>;
    save(): Promise<void>;
    static restoreBuildCache(projectDir: string, cacheKey: string, fallbackKey: string): Promise<string | undefined>;
    static saveBuildCache(projectDir: string, cacheKey: string): Promise<void>;
    static buildCacheKey(projectDir: string, toolchains: string[], fallbackBranch: string): string;
    static buildFallbackCacheKey(projectDir: string, toolchains: string[], fallbackBranch: string): string;
}

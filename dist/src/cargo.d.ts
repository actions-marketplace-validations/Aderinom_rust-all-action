import * as exec from '@actions/exec';
export declare class Cargo {
    /**
     * Ensures a cargo-installed binary exists. If not, installs it using cargo or cargo-binstall.
     * Optionally restores/saves to cache.
     *
     * @param program Program name (e.g. "cargo-nextest")
     * @param version Version or "latest"
     * @param cachePrefix Cache key prefix (omit or "no-cache" to skip caching)
     * @param restoreKeys Optional list of restore keys
     * @param useBinstall Use cargo-binstall if true
     */
    static install(program: string, version?: string, cachePrefix?: string, useBinstall?: boolean): Promise<void>;
    static exec(args: string[], options?: exec.ExecOptions): Promise<void>;
}

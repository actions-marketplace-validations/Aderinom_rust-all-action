import * as actionexec from '@actions/exec';
export declare class Cargo {
    /**
     * @returns Path to cargo target directory
     */
    static targetDir(projectDir: string): string;
    /**
     * @returns Path to cargo binary directory
     */
    static binDir(): string;
    static cargoHome(): string;
    /**
     * @returns Path to rustup home directory
     */
    static rustupHome(): string;
    static cargoLock(projectDir: string): string;
    static rustToolchainTomlChannel(dir?: string): Promise<string | undefined>;
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
    static exec(args: string[], options?: actionexec.ExecOptions): Promise<void>;
}

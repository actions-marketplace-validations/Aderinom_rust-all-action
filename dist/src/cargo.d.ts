import * as exec from '@actions/exec';
export declare class Cargo {
    readonly path: string;
    private constructor();
    /**
     * Fetches the currently-installed version of cargo.
     */
    static get(): Promise<Cargo>;
    /**
     * Looks for a cached version of `program`. If none is found,
     * executes `cargo install ${program}` and caches the result.
     *
     * @param program Program to install.
     * @param version Program version to install. If `undefined` or set to `'latest'`,
     *                the latest version will be installed.
     * @param primaryKey Primary cache key to use when caching program. If not
     *                   specified no caching will be done.
     * @param restoreKeys Optional additional cache keys to use when looking for
     *                    a cached version of the program.
     * @returns Path to installed program. Since program will be installed in
     *          the cargo bin directory which is on the `PATH`, this will be
     *          equal to `program` currently.
     */
    install(program: string, version?: string, primaryKey?: string, restoreKeys?: string[]): Promise<string>;
    /**
     * Looks for a cached version of `program`. If none is found,
     * executes `cargo binstall ${program}` and caches the result.
     *
     * @param program Program to install.
     * @param version Program version to install. If `undefined` or set to `'latest'`,
     *                the latest version will be installed.
     * @param primaryKey Primary cache key to use when caching program. If not
     *                   specified no caching will be done.
     * @param restoreKeys Optional additional cache keys to use when looking for
     *                    a cached version of the program.
     * @returns Path to installed program. Since program will be installed in
     *          the cargo bin directory which is on the `PATH`, this will be
     *          equal to `program` currently.
     */
    binstall(program: string, version?: string, primaryKey?: string, restoreKeys?: string[]): Promise<string>;
    /**
     * Runs a cargo command.
     *
     * @param args Arguments to pass to cargo.
     * @param options Optional exec options.
     * @returns Cargo exit code.
     */
    exec(args: string[], options?: exec.ExecOptions): Promise<number>;
    private tryLoadProgramFromCache;
    private trySaveProgramToCache;
    private cargoInstall;
    private cargoBinstall;
    private isInstalled;
}
/**
 * Resolves the latest version of a Cargo crate by contacting crates.io.
 *
 * @param crate Crate name.
 * @returns Latest crate version.
 */
export declare function resolveVersion(crate: string): Promise<string>;

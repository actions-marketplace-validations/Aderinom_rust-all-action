import * as cache from '@actions/cache';
import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as http from '@actions/http-client';
import * as io from '@actions/io';
import path from 'path';

export class Cargo {
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
  public static async install(
    program: string,
    version = 'latest',
    cachePrefix?: string,
    restoreKeys?: string[],
    useBinstall = true,
  ): Promise<void> {
    const cargoPath = await io.which('cargo', true);
    const binDir = path.dirname(cargoPath);
    const cachePath = [path.join(binDir, program)];

    // Helper to check if program is already installed
    async function isInstalled(): Promise<boolean> {
      try {
        await io.which(program, true);
        return true;
      } catch {
        return false;
      }
    }

    // Helper to resolve latest version from crates.io
    async function resolveVersion(crate: string): Promise<string> {
      if (version && version !== 'latest') return version;
      const client = new http.HttpClient('rust-all-action');
      const url = `https://crates.io/api/v1/crates/${crate}`;
      const resp: any = await client.getJson(url);
      if (!resp.result) throw new Error('Unable to fetch latest crate version');
      return resp.result.crate.newest_version;
    }

    // Helper to restore from cache
    async function restoreFromCache(key: string): Promise<boolean> {
      const restored = await cache.restoreCache(cachePath, key, restoreKeys);
      if (restored) {
        core.info(`Using cached ${program}@${version} from key ${restored}`);
        return true;
      }
      return false;
    }

    // Helper to save to cache
    async function saveToCache(key: string): Promise<void> {
      try {
        await cache.saveCache(cachePath, key);
        core.info(`Cached ${program}@${version} with key ${key}`);
      } catch (err: any) {
        if (err.name === cache.ValidationError.name) throw err;
        if (err.name === cache.ReserveCacheError.name)
          core.warning(`Caching failed: ${err.message}`);
      }
    }

    // Check if already installed
    if (await isInstalled()) {
      core.debug(`${program} already installed`);
      return;
    }

    // Restore from cache
    const resolvedVersion = await resolveVersion(program);
    const cacheKey =
      cachePrefix && cachePrefix !== 'no-cache'
        ? `${cachePrefix}-${program}-${resolvedVersion}`
        : undefined;
    if (cacheKey && (await restoreFromCache(cacheKey))) return;

    // If binstall requested, ensure it's installed
    if (useBinstall) {
      await Cargo.install(
        'cargo-binstall',
        'latest',
        cachePrefix,
        restoreKeys,
        false,
      );
    }

    // Install the program
    await core.group(
      `${useBinstall ? 'binstall' : 'install'} ${program}@${resolvedVersion}`,
      async () => {
        const args =
          useBinstall === true ? ['binstall', '--no-confirm'] : ['install'];
        if (resolvedVersion && resolvedVersion !== 'latest') {
          args.push('--version', resolvedVersion);
        }
        args.push(program);

        await exec.exec(cargoPath, args);
      },
    );

    // Save to cache
    if (cacheKey) await saveToCache(cacheKey);
    return;
  }

  // Executes a cargo command with given arguments
  public static async exec(
    args: string[],
    options?: exec.ExecOptions,
  ): Promise<void> {
    await exec.exec('cargo', args, options);
  }
}

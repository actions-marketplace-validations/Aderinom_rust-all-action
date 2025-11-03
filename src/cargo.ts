import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as http from '@actions/http-client';
import * as io from '@actions/io';
import path from 'path';
import { ensureBinstall } from './binstall';
import { generateCacheKey, restoreFromCache, saveToCache } from './cache';

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
    useBinstall = true,
  ): Promise<void> {
    const cargoPath = await io.which('cargo', true);
    const binDir = path.dirname(cargoPath);
    let cachePath: string[];

    if (process.platform === 'win32') {
      cachePath = [path.join(binDir, `${program}.exe`)];
    } else {
      cachePath = [path.join(binDir, program)];
    }

    const cachePrefixFinal =
      cachePrefix !== 'no-cache' ? cachePrefix : undefined;

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

    // Check if already installed
    if (await isInstalled()) {
      core.debug(`${program} already installed`);
      return;
    }

    // Restore from cache
    const resolvedVersion = await resolveVersion(program);
    const cacheKey = cachePrefixFinal
      ? generateCacheKey(
          `${cachePrefixFinal}-${program}`,
          resolvedVersion,
          true,
        )
      : undefined;

    if (cacheKey && (await restoreFromCache(cachePath, cacheKey))) return;

    // If binstall requested, ensure it's installed
    if (useBinstall) {
      await ensureBinstall(cachePrefixFinal);
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
    if (cacheKey) await saveToCache(cachePath, cacheKey);
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

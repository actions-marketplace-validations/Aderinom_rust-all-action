// Copied from https://github.com/clechasseur/rs-actions-core/
// The MIT License (MIT)

// Copyright (c) 2023-2025 Charles Lechasseur, actions-rs team and contributors

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

// Modifications are licensed under the UNLICENSE.

import * as cache from '@actions/cache';
import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as http from '@actions/http-client';
import * as io from '@actions/io';
import { debug } from 'console';
import * as path from 'path';

export class Cargo {
  readonly path: string;

  private constructor(path: string) {
    this.path = path;
  }

  /**
   * Fetches the currently-installed version of cargo.
   */
  public static async get(): Promise<Cargo> {
    try {
      const path = await io.which('cargo', true);

      return new Cargo(path);
    } catch (error) {
      core.error(
        'cargo is not installed on this runner, see https://help.github.com/en/articles/software-in-virtual-environments-for-github-actions',
      );
      core.error(
        'To install it, use an action such as: https://github.com/actions-rust-lang/setup-rust-toolchain',
      );

      throw error;
    }
  }

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
  public async install(
    program: string,
    version?: string,
    primaryKey?: string,
    restoreKeys?: string[],
  ): Promise<string> {
    // Check if program is already installed, can't check version
    if (await this.isInstalled(program)) {
      return program;
    }

    // Fill in version if needed
    if (!version || version === 'latest') {
      version = (await resolveVersion(program)) ?? '';
    }

    // Try to get installation from cache
    if (
      primaryKey &&
      (await this.tryLoadProgramFromCache(
        program,
        version,
        primaryKey,
        restoreKeys,
      ))
    ) {
      return program;
    }

    await this.cargoInstall(program, version);

    // Save installation to cache
    if (primaryKey) {
      await this.trySaveProgramToCache(program, version, primaryKey);
    }

    return program;
  }

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
  public async binstall(
    program: string,
    version?: string,
    primaryKey?: string,
    restoreKeys?: string[],
  ): Promise<string> {
    // Check if program is already installed, can't check version
    if (await this.isInstalled(program)) {
      return program;
    }

    // Ensure cargo-binstall is installed
    await this.install('cargo-binstall', 'latest', primaryKey, restoreKeys);

    // Fill in version if needed
    if (!version || version === 'latest') {
      version = (await resolveVersion(program)) ?? '';
    }

    // Try to get installation from cache
    if (
      primaryKey &&
      (await this.tryLoadProgramFromCache(
        program,
        version,
        primaryKey,
        restoreKeys,
      ))
    ) {
      return program;
    }

    await this.cargoBinstall(program, version);

    // Save installation to cache
    if (primaryKey) {
      await this.trySaveProgramToCache(program, version, primaryKey);
    }

    return program;
  }

  /**
   * Runs a cargo command.
   *
   * @param args Arguments to pass to cargo.
   * @param options Optional exec options.
   * @returns Cargo exit code.
   */
  public async exec(
    args: string[],
    options?: exec.ExecOptions,
  ): Promise<number> {
    return await exec.exec(this.path, args, options);
  }

  // Tries to load a cached version of a program.
  //
  // Returns true if cache was found and loaded, false otherwise.
  private async tryLoadProgramFromCache(
    program: string,
    version: string,
    primaryKey: string,
    restoreKeys?: string[],
  ): Promise<boolean> {
    const cachePath = [path.join(path.dirname(this.path), program)];
    const programKey = `${primaryKey}-${program}-${version}`;
    const programRestoreKeys = (restoreKeys ?? []).map(
      (key) => `${program}-${version}-${key}`,
    );

    if (primaryKey !== 'no-cache') {
      const cacheKey = await cache.restoreCache(
        cachePath,
        programKey,
        programRestoreKeys,
      );
      if (cacheKey) {
        core.info(`Using cached \`${program}@${version}\``);
        return true;
      }
    }

    return false;
  }

  // Saves a program to cache.
  //
  // Returns true if cache was saved, false otherwise.
  private async trySaveProgramToCache(
    program: string,
    version: string,
    primaryKey: string,
  ): Promise<boolean> {
    const cachePath = [path.join(path.dirname(this.path), program)];
    const programKey = `${primaryKey}-${program}-${version}`;

    if (primaryKey === 'no-cache') {
      return false;
    }

    try {
      core.info(`Caching \`${program}@${version}\` with key \`${programKey}\``);
      await cache.saveCache(cachePath, programKey);
      return true;
    } catch (error) {
      if ((error as Error).name === cache.ValidationError.name) {
        throw error;
      } else if ((error as Error).name === cache.ReserveCacheError.name) {
        core.warning(`Caching failed: ${(error as Error).message}`);
      }

      return false;
    }
  }

  // Installs a program using cargo-binstall
  //
  // Returns name of the installed program.
  private async cargoInstall(
    program: string,
    version: string,
  ): Promise<string> {
    const args = ['install'];
    if (version !== 'latest') {
      args.push('--version');
      args.push(version);
    }
    args.push(program);

    await core.group(
      `install ${program}@${version}`,
      async () => await this.exec(args),
    );

    return program;
  }

  // Installs a program using cargo-binstall
  //
  // Returns name of the installed program.
  private async cargoBinstall(
    program: string,
    version: string,
  ): Promise<string> {
    const args = ['binstall', '--no-confirm'];
    if (version !== 'latest') {
      args.push('--version');
      args.push(version);
    }

    args.push(program);

    await core.group(
      `binstall ${program}@${version}`,
      async () => await this.exec(args),
    );

    return program;
  }

  // Checks if a program is installed and available in PATH.
  //
  // This does not check if the program is of an expected version
  private async isInstalled(program: string): Promise<boolean> {
    try {
      const path = await io.which(program, true);
      debug(`Found installed program "${program}" at path: ${path}`);
      return path !== '';
    } catch {
      debug(`Program "${program}" is not installed`);
      return false;
    }
  }
}

/**
 * Resolves the latest version of a Cargo crate by contacting crates.io.
 *
 * @param crate Crate name.
 * @returns Latest crate version.
 */
export async function resolveVersion(crate: string): Promise<string> {
  const url = `https://crates.io/api/v1/crates/${crate}`;
  const client = new http.HttpClient(
    '@clechasseur/rs-actions-core (https://github.com/clechasseur/rs-actions-core)',
  );

  const resp: any = await client.getJson(url); // eslint-disable-line @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (!resp.result) {
    throw new Error('Unable to fetch latest crate version');
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
  return resp.result.crate.newest_version;
}

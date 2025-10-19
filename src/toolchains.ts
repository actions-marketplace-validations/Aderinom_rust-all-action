import * as cache from '@actions/cache';
import * as core from '@actions/core';
import * as exec from '@actions/exec';
import { existsSync } from 'fs';
import { readdir } from 'fs/promises';
import os from 'os';
import * as path from 'path';

// Lists installed Rust toolchains
async function listToolchains(): Promise<string[]> {
  const dir = path.join(os.homedir(), '.rustup', 'toolchains');
  try {
    return await readdir(dir);
  } catch (err) {
    throw new Error(`Cannot read toolchains directory: ${err}`);
  }
}

// Resolves the full path of a toolchain installation
async function resolveToolchainPath(toolchain: string): Promise<{
  path: string;
  postfix: string;
} | null> {
  const toolchains = await listToolchains();
  const stable = toolchains.find((t) => t.startsWith('stable'));
  if (!stable) return null;
  const postfix = stable.slice(stable.indexOf('-'));
  const foundPath = path.join(
    os.homedir(),
    '.rustup',
    'toolchains',
    `${toolchain}${postfix}`,
  );
  return {
    path: foundPath,
    postfix,
  };
}

// Prepares a Rust toolchain by installing it and caching if needed
async function restoreFromCache(
  toolchainPath: string,
  key: string,
): Promise<boolean> {
  const restored = await cache.restoreCache([toolchainPath], key);
  if (restored) {
    core.info(`Restored ${toolchainPath} from cache key ${restored}`);
    return true;
  }
  return false;
}

// Saves a Rust toolchain installation to cache
async function saveToCache(toolchainPath: string, key: string): Promise<void> {
  if (!existsSync(toolchainPath)) {
    core.warning(`Expected path ${toolchainPath} missing, skip caching`);
    return;
  }
  try {
    await cache.saveCache([toolchainPath], key);
    core.info(
      `Cached toolchain ${path.basename(toolchainPath)} with key ${key}`,
    );
  } catch (err: any) {
    if (err.name === cache.ValidationError.name) throw err;
    if (err.name === cache.ReserveCacheError.name)
      core.warning(`Caching failed: ${err.message}`);
  }
}

// Prepares the specified Rust toolchain, installing and caching as needed
export async function prepareToolchain(
  toolchain: string,
  cachePrefix?: string,
): Promise<void> {
  await core.group(`Preparing toolchain ${toolchain}`, async () => {
    const toolchains = await listToolchains();
    if (toolchains.some((t) => t.includes(toolchain))) {
      core.debug(`Toolchain ${toolchain} already installed`);
      return;
    }

    const pathGuess = await resolveToolchainPath(toolchain);

    const cacheKey = cachePrefix
      ? `${cachePrefix}-${toolchain}${pathGuess?.postfix}`
      : undefined;

    if (
      cacheKey &&
      pathGuess &&
      (await restoreFromCache(pathGuess.path, cacheKey))
    )
      return;

    core.info(`Installing toolchain ${toolchain}`);
    // To support all components, install with 'default' profile
    await exec.exec('rustup', ['install', toolchain, '--profile', 'default']);

    if (cacheKey && pathGuess) await saveToCache(pathGuess.path, cacheKey);
  });
}

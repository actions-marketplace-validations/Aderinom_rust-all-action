import * as cache from '@actions/cache';
import * as core from '@actions/core';
import * as exec from '@actions/exec';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { readdir } from 'fs/promises';
import * as path from 'path';
import { generateCacheKey } from './cache';
import { Cargo } from './cargo';

// Lists installed Rust toolchains
async function listToolchains(): Promise<string[]> {
  const dir = path.join(Cargo.rustupHome(), 'toolchains');
  try {
    return await readdir(dir);
  } catch (err) {
    throw new Error(`Cannot read toolchains directory: ${err}`);
  }
}

export async function listInstalledComponents(toolchain?: string) {
  const args = ['component', 'list', '--installed'];

  if (toolchain) {
    args.unshift(`+${toolchain}`);
  }

  args.unshift('rustup');
  const ret = execSync(args.join(' '));

  // Parse
  return ret.toString().trim().split('\n');
}

export async function isComponentInstalled(
  component: string,
  toolchain?: string,
): Promise<boolean> {
  const installed = await listInstalledComponents(toolchain);
  // Try to find component in installed list, we ignore the host triple suffix
  return installed.find((c) => c.startsWith(component)) !== undefined;
}

export async function installComponent(
  component: string,
  toolchain?: string,
): Promise<void> {
  const args = ['component', 'add', component];
  if (toolchain) {
    args.unshift(`+${toolchain}`);
  }
  args.unshift('rustup');

  await exec.exec('rustup', args);
}

export async function getHostTriple(): Promise<string> {
  const stdoutBuf = execSync('rustc -vV').toString();

  const lines = stdoutBuf.toString().split('\n');
  for (const line of lines) {
    if (line.startsWith('host:')) {
      return line.slice('host:'.length).trim();
    }
  }

  throw new Error('Cannot determine host triple from rustc -vV output');
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
  additionalComponents: string[] = [],
  cachePrefix?: string,
): Promise<void> {
  const ensureComponents = async () => {
    let hadToInstall = false;
    for (const component of additionalComponents) {
      const installed = await isComponentInstalled(component, toolchain);
      if (installed) {
        core.debug(
          `Component ${component} already installed for toolchain ${toolchain}`,
        );
      } else {
        core.info(
          `Installing component ${component} for toolchain ${toolchain}`,
        );
        await installComponent(component, toolchain);
        hadToInstall = true;
      }
    }

    return hadToInstall;
  };

  await core.group(`Preparing toolchain ${toolchain}`, async () => {
    const cachePrefixFinal =
      cachePrefix == 'no-cache' ? undefined : cachePrefix;

    const hostTriple = await getHostTriple();
    const toolchains = await listToolchains();
    const toolchainPath = path.join(
      Cargo.rustupHome(),
      'toolchains',
      `${toolchain}-${hostTriple}`,
    );
    const cacheKey = generateCacheKey(
      `${cachePrefixFinal}-${toolchain}-${hostTriple}`,
      undefined,
      false,
    );

    if (toolchains.some((t) => t.includes(toolchain))) {
      core.debug(`Toolchain ${toolchain} already installed`);
      const hadToInstall = await ensureComponents();

      // If a component was installed, update the cache
      if (hadToInstall && cachePrefixFinal) {
        await saveToCache(toolchainPath, cacheKey);
        core.info(
          `Saved updated toolchain ${toolchain} to cache key ${cacheKey}`,
        );
      }

      return;
    }

    core.info(`Installing toolchain ${toolchain}`);
    // To support all components, install with 'default' profile
    await exec.exec('rustup', ['install', toolchain, '--profile', 'default']);
    await ensureComponents();

    if (cachePrefixFinal) {
      await saveToCache(toolchainPath, cacheKey);
      core.info(`Saved toolchain ${toolchain} to cache key ${cacheKey}`);
    }
  });
}

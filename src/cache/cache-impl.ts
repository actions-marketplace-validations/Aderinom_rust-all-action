import * as cache from '@actions/cache';
import * as core from '@actions/core';
import { existsSync } from 'fs';

export async function restoreFromCache(
  cachePath: string[],
  key: string,
  restoreKeys: string[] = [],
): Promise<string | undefined> {
  const restored = await cache.restoreCache(cachePath, key, restoreKeys);
  if (restored) {
    core.info(`Using cached ${key} from restored through key: ${restored}`);
    return restored;
  }
  return restored;
}

export async function saveToCache(
  cachePath: string[],
  key: string,
): Promise<boolean> {
  let anyExists = false;
  for (const path of cachePath) {
    if (!existsSync(path)) {
      core.info(`Cache path ${path} is missing`);
    } else {
      anyExists = true;
    }
  }

  if (!anyExists) {
    core.warning(
      `No paths from ${cachePath} exist, skip caching for key ${key}`,
    );
    return false;
  }

  try {
    await cache.saveCache(cachePath, key);
    core.info(`Cached key ${key}`);
  } catch (err: any) {
    core.error(`Caching failed for ${key}: ${err.message}`);
    return false;
  }

  return true;
}

/**
 * Generates a cache key
 *
 * Format: {prefix}-{platform-arch?}-{version?}-{postFixes...}
 *
 */
export function generateCacheKey(
  prefix: string,
  version?: string,
  usePlatform = true,
  postFixes: string[] = [],
): string {
  const platform = usePlatform ? `-${process.platform}-${process.arch}` : '';
  const ver = version ? `-${version}` : '';
  const postfix = postFixes.length > 0 ? `-${postFixes.join('-')}` : '';
  return `${prefix}${platform}${ver}${postfix}`;
}

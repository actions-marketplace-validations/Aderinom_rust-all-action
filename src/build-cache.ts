import { info, warning } from '@actions/core';
import { existsSync } from 'fs';
import { restoreFromCache, saveToCache } from './cache';
import { Cargo } from './cargo';

// Optimized for keeping dependencies cached between builds
// Uses a fallbackBranch to restore from
// Then saves cache based on Cargo.lock hash or branch name
//
// Advantages:
// - We most of the time restore all dependencies from cache
// - We have one cache entry per updated lock file
// Disadvantages:
// - Every branch will have to rebuild changes to internal dependencies

// Format: {prefix}-build-{platform-arch}-{hash(cargo.lock) or branch-name}
function buildCacheKey(projectDir: string, fallbackBranch: string): string {
  const lockFile = Cargo.cargoLock(projectDir);
  let lockHashOrBranch = process.env.GITHUB_REF_NAME || 'not-in-gh-action'; //branch

  if (fallbackBranch == lockHashOrBranch) {
    // This branch is the fallback branch, we don't use the lock file hash
  } else if (existsSync(lockFile)) {
    const lockContent = require('fs').readFileSync(lockFile, 'utf8');
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(lockContent).digest('hex');
    lockHashOrBranch = hash.slice(0, 20); // use first 20 chars of hash
  }

  const platform = process.platform;
  const arch = process.arch;

  return `rax-cache-build-${platform}-${arch}-${lockHashOrBranch}`;
}
// Format: {prefix}-build-{platform-arch}-{fallback-branch}
function buildFallbackCacheKey(fallbackBranch: string): string {
  const platform = process.platform;
  const arch = process.arch;

  return `rax-cache-build-${platform}-${arch}-${fallbackBranch}`;
}

// Restores target folders from cache
export async function restoreBuildCache(
  projectDir: string,
  fallbackBranch: string,
) {
  const targetDir = Cargo.targetDir(projectDir);
  const cacheKey = buildCacheKey(projectDir, fallbackBranch);
  const fallbackKey = buildFallbackCacheKey(fallbackBranch);

  const restoredKey = await restoreFromCache([targetDir], cacheKey, [
    fallbackKey,
  ]);
  if (restoredKey) {
    console.info(`Restored build cache from key: ${restoredKey}`);
  } else {
    console.info(`No build cache found for keys: ${cacheKey}, ${fallbackKey}`);
  }
}

export async function saveBuildCache(
  projectDir: string,
  fallbackBranch: string,
) {
  const targetDir = Cargo.targetDir(projectDir);
  const cacheKey = buildCacheKey(projectDir, fallbackBranch);
  // TODO: Need to prune the target folder to reduce size

  if (!existsSync(targetDir)) {
    warning(
      `Target directory does not exist: ${targetDir}, skipping cache save.`,
    );
    return;
  }

  await saveToCache([targetDir], cacheKey);

  info(`Saved build cache with key: ${cacheKey}`);
}

export function buildCacheStrategy(
  projectDir: string,
  strategy: string,
  fallbackBranch: string,
): { restore: () => Promise<void>; save: () => Promise<void> } | undefined {
  switch (strategy) {
    case 'github':
      return {
        restore: async () => {
          await restoreBuildCache(projectDir, fallbackBranch);
        },
        save: async () => {
          await saveBuildCache(projectDir, fallbackBranch);
        },
      };
    default:
      return undefined;
  }
}

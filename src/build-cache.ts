// import { warning } from '@actions/core';
// import { existsSync } from 'fs';
// import { saveToCache } from './cache';
// import { Cargo } from './cargo';

// // Optimized for keeping dependencies cached between builds
// // Uses a fallbackBranch to restore from
// // Then saves cache based on Cargo.lock hash or branch name
// //
// // Advantages:
// // - We most of the time restore all dependencies from cache
// // - We have one cache entry per updated lock file
// // Disadvantages:
// // - Every branch will have to rebuild changes to internal dependencies

// // Format: {prefix}-build-{platform-arch}-{hash(cargo.lock) or branch-name}
// function buildCacheKey(projectDir: string, fallbackBranch: string): string {
//   const targetDir = Cargo.targetDir(projectDir);
//   if (!existsSync(targetDir)) {
//     warning(
//       `Target directory does not exist: ${targetDir}, cannot build cache key.`,
//     );
//   }

//   const lockFile = Cargo.cargoLock(projectDir);
//   let lockHashOrBranch = process.env.GITHUB_REF_NAME || 'not-in-gh-action'; //branch

//   if (fallbackBranch == lockHashOrBranch) {
//     // This branch is the fallback branch, we don't use the lock file hash
//   } else if (existsSync(lockFile)) {
//     const lockContent = require('fs').readFileSync(lockFile, 'utf8');
//     const crypto = require('crypto');
//     const hash = crypto.createHash('sha256').update(lockContent).digest('hex');
//     lockHashOrBranch = hash.slice(0, 20); // use first 20 chars of hash
//   }

//   const platform = process.platform;;
//   const arch = process.arch;

//   return `rax-cache-build-${platform}-${arch}-${lockHashOrBranch}`;

// // Format: {prefix}-build-{platform-arch}-{fallback-branch}
// function buildFallbackCacheKey(fallbackBranch: string): string {
//   return `rax-cache-build-${platform}-${arch}-${fallbackBranch}`;
// }

// // Restores target folders from cache
// export async function restoreBuildCache(projectDir: string) {
//   const targetDir = Cargo.targetDir(projectDir);
//   const cacheKey = buildCacheKey(projectDir);
//   const fallbackKey = buildFallbackCacheKey();
// }

// export async function saveBuildCache(projectDir: string) {
//   const targetDir = Cargo.targetDir(projectDir);

//   // TODO: Need to prune the target folder to reduce size

//   if (!existsSync(targetDir)) {
//     warning(
//       `Target directory does not exist: ${targetDir}, skipping cache save.`,
//     );
//     return;
//   }

//   saveToCache([targetDir], '');
// }

// function buildCacheStrategy(): {restore: () => Boolean, save: () => Boolean }{
//   return {
//     restore: async () => {
//       await restoreBuildCache();
//       return true;
//     },
//     save: async () => {
//       await saveBuildCache();
//       return true;
//     }
//   };
// }

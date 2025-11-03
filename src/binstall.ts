import * as core from '@actions/core';
import * as io from '@actions/io';
import { execSync } from 'child_process';
import * as path from 'path';
import { generateCacheKey, restoreFromCache, saveToCache } from './cache';
import { Cargo } from './cargo';

// Ensures that cargo-binstall is installed, using caching if specified
// otherwise installs it directly
export async function ensureBinstall(cachePrefix?: string): Promise<void> {
  const binstallPath = await io.which('binstall', false);
  if (binstallPath) {
    core.debug('binstall already installed');
    return;
  }

  const cachePrefixFinal = cachePrefix == 'no-cache' ? undefined : cachePrefix;

  const cargoPath = await io.which('cargo', true);
  const binDir = path.dirname(cargoPath);

  // try get from cache first
  const cacheKey = generateCacheKey('binstall', 'any', true);
  if (cachePrefixFinal && (await restoreFromCache([binDir], cacheKey))) {
    core.info('Restored binstall from cache');
    return;
  }

  await core.group('Installing binstall', async () => {
    if (process.platform === 'win32') {
      await installBinstallWindows();
    } else if (process.platform === 'linux' || process.platform === 'darwin') {
      await installBinstallLinuxMac();
    } else {
      Cargo.install('cargo-binstall', 'latest', undefined, false);
    }

    core.info('Installed cargo-binstall');

    // save to cache
    if (cachePrefixFinal) {
      await saveToCache([binDir], cacheKey);
    }
  });
}

// Installs cargo-binstall on Linux or macOS
async function installBinstallLinuxMac(): Promise<void> {
  execSync(
    `curl -L --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/cargo-bins/cargo-binstall/main/install-from-binstall-release.sh | bash`,
  );
}

// Installs cargo-binstall on Windows
async function installBinstallWindows(): Promise<void> {
  execSync(
    `Set-ExecutionPolicy Unrestricted -Scope Process; iex (iwr "https://raw.githubusercontent.com/cargo-bins/cargo-binstall/main/install-from-binstall-release.ps1").Content`,
    { shell: 'powershell.exe' },
  );
}

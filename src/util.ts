import * as core from '@actions/core';
import { spawn, SpawnOptions } from 'node:child_process';

export interface SpawnResult {
  code: number;
  stdout: string;
  stderr: string;
}
/// Spawns a command asynchronously, returning a promise that resolves
export function spawnAsync(
  cmd: string,
  args: string[] = [],
  opts: SpawnOptions = {
    stdio: 'inherit',
  },
): Promise<SpawnResult> {
  return new Promise((resolve, reject) => {
    core.info(`running: ${cmd} ${args.join(' ')}`);

    const child = spawn(cmd, args, opts);

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (d) => {
      stdout += d;
    });
    child.stderr?.on('data', (d) => {
      stderr += d;
    });

    child.on('error', reject);

    child.on('close', (code) => {
      if (code === 0) resolve({ code, stdout, stderr });
      reject(
        Object.assign(new Error(`exit ${code}`), { code, stdout, stderr }),
      );
    });
  });
}

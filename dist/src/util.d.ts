import { SpawnOptions } from 'node:child_process';
export interface SpawnResult {
    code: number;
    stdout: string;
    stderr: string;
}
export declare function spawnAsync(cmd: string, args?: string[], opts?: SpawnOptions): Promise<SpawnResult>;

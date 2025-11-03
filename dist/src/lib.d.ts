import { Input } from './input.js';
interface RunResult {
    installedToolchains: string[];
    installedTools: [string, string][];
    workflowResults: Record<string, true | string>;
    succeeded: boolean;
}
export declare function run(cfg: Input): Promise<RunResult>;
export type FlowConfig<T extends keyof Input['flow']> = Omit<Input['flow'][T], 'overrideArgs'> & {
    project: string;
    cacheKey: string;
    toolchain?: string;
    overrideArgs?: string[];
};
export declare function workflowConfig<T extends keyof Input['flow']>(cfg: Input, flow: T): FlowConfig<T>;
export declare function addCargoToPath(): void;
export {};

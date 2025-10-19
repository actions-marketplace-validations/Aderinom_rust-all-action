import { Input } from './input.js';
export declare function run(cfg: Input): Promise<boolean>;
export type FlowConfig<T extends keyof Input['flow']> = Omit<Input['flow'][T], 'overrideArgs'> & {
    project: string;
    cacheKey: string;
    toolchain?: string;
    overrideArgs?: string[];
};
export declare function workflowConfig<T extends keyof Input['flow']>(cfg: Input, flow: T): FlowConfig<T>;

import { Cargo } from './cargo.js';
import { ConfigSchema } from './config.js';
export declare function run(cargo: Cargo, cfg: ConfigSchema): Promise<boolean>;
export declare function workflowConfig(cfg: ConfigSchema, flow: keyof ConfigSchema['flow']): any;

import { Cargo } from './cargo';
import { WorkflowConfigSchema } from './config';
export interface WorkflowConfig extends WorkflowConfigSchema {
    project: string;
    cacheKey?: string;
    toolchain?: string;
    overrideFlags?: string[];
}
interface Workflow {
    readonly name: string;
    readonly run: (cargo: Cargo) => Promise<void>;
}
export declare class TestWorkflow implements Workflow {
    readonly config: WorkflowConfig;
    readonly name = "test";
    constructor(config: WorkflowConfig);
    run(cargo: Cargo): Promise<void>;
    z: any;
}
export interface ClippyConfig extends WorkflowConfig {
    denyWarnings: boolean;
}
export declare class ClippyWorkflow implements Workflow {
    readonly config: ClippyConfig;
    readonly name = "clippy";
    constructor(config: ClippyConfig);
    run(cargo: Cargo): Promise<void>;
}
export declare class FormatWorkflow implements Workflow {
    readonly config: WorkflowConfig;
    readonly name = "fmt";
    constructor(config: WorkflowConfig);
    run(cargo: Cargo): Promise<void>;
}
export declare class DocsWorkflow implements Workflow {
    readonly config: WorkflowConfig;
    readonly name = "doc";
    constructor(config: WorkflowConfig);
    run(cargo: Cargo): Promise<void>;
}
export declare class ShearWorkflow implements Workflow {
    readonly config: WorkflowConfig;
    readonly name = "shear";
    constructor(config: WorkflowConfig);
    run(cargo: Cargo): Promise<void>;
}
export declare class DenyWorkflow implements Workflow {
    readonly config: WorkflowConfig;
    readonly name = "deny";
    constructor(config: WorkflowConfig);
    run(cargo: Cargo): Promise<void>;
}
export {};

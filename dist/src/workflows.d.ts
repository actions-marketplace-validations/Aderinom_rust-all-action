import { FlowConfig } from './lib';
interface Workflow {
    readonly name: string;
    readonly run: () => Promise<void>;
}
export declare class TestWorkflow implements Workflow {
    readonly config: FlowConfig<'test'>;
    readonly name = "test";
    constructor(config: FlowConfig<'test'>);
    run(): Promise<void>;
}
export declare class ClippyWorkflow implements Workflow {
    readonly config: FlowConfig<'clippy'>;
    readonly name = "clippy";
    constructor(config: FlowConfig<'clippy'>);
    run(): Promise<void>;
}
export declare class FormatWorkflow implements Workflow {
    readonly config: FlowConfig<'fmt'>;
    readonly name = "fmt";
    constructor(config: FlowConfig<'fmt'>);
    run(): Promise<void>;
}
export declare class DocsWorkflow implements Workflow {
    readonly config: FlowConfig<'doc'>;
    readonly name = "doc";
    constructor(config: FlowConfig<'doc'>);
    run(): Promise<void>;
}
export declare class ShearWorkflow implements Workflow {
    readonly config: FlowConfig<'shear'>;
    readonly name = "shear";
    constructor(config: FlowConfig<'shear'>);
    run(): Promise<void>;
}
export declare class DenyWorkflow implements Workflow {
    readonly config: FlowConfig<'deny'>;
    readonly name = "deny";
    constructor(config: FlowConfig<'deny'>);
    run(): Promise<void>;
}
export {};

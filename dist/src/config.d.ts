export interface WorkflowConfigSchema {
    toolchain?: string;
    overrideArgs?: string;
}
export interface ConfigSchema {
    run: string[];
    project: string;
    cacheKey: string;
    toolchain?: string;
    flow: {
        test: WorkflowConfigSchema;
        clippy: {
            denyWarnings: boolean;
        } & WorkflowConfigSchema;
        fmt: WorkflowConfigSchema;
        doc: WorkflowConfigSchema;
        shear: WorkflowConfigSchema;
        deny: WorkflowConfigSchema;
    };
}
export declare const defaultConfig: ConfigSchema;
export declare function loadConfig(env?: NodeJS.ProcessEnv): ConfigSchema;
export type Config = ReturnType<typeof loadConfig>;

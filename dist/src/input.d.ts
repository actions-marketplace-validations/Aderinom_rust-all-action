export interface Input {
    project: string;
    profile?: string;
    run: string[];
    cacheKey: string;
    toolchain?: string;
    installOnly?: boolean;
    installAdditional?: string[];
    flow: {
        test: {
            toolchain?: string;
            overrideArgs?: string;
            failFast: boolean;
        };
        clippy: {
            toolchain?: string;
            overrideArgs?: string;
            denyWarnings: boolean;
        };
        fmt: {
            toolchain?: string;
            overrideArgs?: string;
        };
        doc: {
            toolchain?: string;
            overrideArgs?: string;
        };
        shear: {
            toolchain?: string;
            overrideArgs?: string;
        };
        deny: {
            toolchain?: string;
            overrideArgs?: string;
        };
    };
}
export declare function loadInput(): Input;

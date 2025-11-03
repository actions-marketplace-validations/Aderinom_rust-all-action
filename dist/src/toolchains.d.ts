export declare function listInstalledComponents(toolchain?: string): Promise<string[]>;
export declare function isComponentInstalled(component: string, toolchain?: string): Promise<boolean>;
export declare function installComponent(component: string, toolchain?: string): Promise<void>;
export declare function getHostTriple(): Promise<string>;
export declare function prepareToolchain(toolchain: string, additionalComponents?: string[], cachePrefix?: string): Promise<void>;

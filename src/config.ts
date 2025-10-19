import { ConfigBuilder } from 'typedconf';

export interface WorkflowConfigSchema {
  // Toolchain to use for this workflow
  toolchain?: string;
  // Override arguments for this workflow
  overrideArgs?: string;
}

export interface ConfigSchema {
  // List of workflows to run
  run: string[];
  // Path to the Rust project
  project: string;
  // Cache key for caching installed programs `no-cache` to disable caching
  cacheKey: string;
  // Default toolchain for all workflows
  toolchain?: string;
  flow: {
    // Configuration for Test workflow
    test: WorkflowConfigSchema;
    // Configuration for Clippy workflow
    clippy: {
      denyWarnings: boolean;
    } & WorkflowConfigSchema;
    // Configuration for Fmt workflow
    fmt: WorkflowConfigSchema;
    // Configuration for Doc workflow
    doc: WorkflowConfigSchema;
    // Configuration for Shear workflow
    shear: WorkflowConfigSchema;
    // Configuration for Deny workflow
    deny: WorkflowConfigSchema;
  };
}

export const defaultConfig: ConfigSchema = {
  run: ['test', 'clippy', 'doc', 'fmt', 'shear'],
  project: './',
  cacheKey: 'rax-installed',
  flow: {
    clippy: {
      denyWarnings: true,
    },
    // Make sure the object exist
    test: {},
    fmt: {},
    doc: {},
    shear: {},
    deny: {},
  },
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ConfigSchema {
  const cfg = new ConfigBuilder<ConfigSchema>()
    .applyStaticConfig(defaultConfig)
    .loadEnv(env, 'RAX', '_', { parser : (key, value) => {
      // Special parser for run to split by comma
      if (key === 'run') {
        return value.split(',').map((s) => s.trim());
      }

      // Other values: try to parse as JSON, fallback to string
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }})
    .buildConfig();

  // Set default toolchain for each workflow if not set
  if (cfg.toolchain) {
    for (const wf of Object.values(cfg.flow)) {
      if (!wf.toolchain) {
        wf.toolchain = cfg.toolchain;
      }
    }
  }

  // All workflow conf
  return cfg;
}

export type Config = ReturnType<typeof loadConfig>;

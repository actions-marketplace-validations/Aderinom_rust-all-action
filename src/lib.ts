import { error, group, info, setFailed } from '@actions/core';
import { warn } from 'node:console';
import path from 'node:path';
import parseArgsStringToArgv from 'string-argv';
import { Cargo } from './cargo.js';
import { Input } from './input.js';
import { check_sccache } from './sccache.js';
import { prepareToolchain } from './toolchains.js';
import {
  ClippyWorkflow,
  DenyWorkflow,
  DocsWorkflow,
  FormatWorkflow,
  ShearWorkflow,
  TestWorkflow,
} from './workflows.js';

interface RunResult {
  installedToolchains: string[];
  installedTools: [string, string][];
  workflowResults: Record<string, true | string>;
  succeeded: boolean;
}

// Default workflows to run if 'all' is specified
const all_default = ['fmt', 'clippy', 'shear', 'test', 'doc'];

// Main function to run selected workflows
//
// Returns true if all workflows succeeded, false otherwise
export async function run(cfg: Input): Promise<RunResult> {
  const start = Date.now();
  info(`cwd: ${process.cwd()}`);
  info(`project path: ${cfg.project}`);

  const tomlChannel = await Cargo.rustToolchainTomlChannel(cfg.project);

  if (tomlChannel) {
    info(`Detected rust-toolchain.toml channel: ${tomlChannel}`);
    if (cfg.toolchain) {
      warn(
        `Global toolchain is set to '${cfg.toolchain}', but rust-toolchain.toml specifies '${tomlChannel}'. Overriding global toolchain.`,
      );
    }

    cfg.toolchain = tomlChannel;
  }

  await check_sccache();
  const cacheKey = cfg.cacheKey === 'no-cache' ? undefined : 'rax-cache';

  // Prepare toolchains
  const toolchains = new Set<string>();
  if (cfg.toolchain) {
    toolchains.add(cfg.toolchain);
  }
  for (const flow of Object.values(cfg.flow)) {
    if (flow.toolchain) {
      toolchains.add(flow.toolchain);
    }
  }

  const installedToolchains: string[] = [];
  // Prepare all required toolchains
  for (const tc of toolchains) {
    await prepareToolchain(start, tc, cfg.extraComponents, cacheKey);
    installedToolchains.push(tc);
  }

  const allWorkflows = [
    new FormatWorkflow(workflowConfig(cfg, 'fmt')),
    new ClippyWorkflow(workflowConfig(cfg, 'clippy')),
    new ShearWorkflow(workflowConfig(cfg, 'shear')),
    new TestWorkflow(workflowConfig(cfg, 'test')),
    new DocsWorkflow(workflowConfig(cfg, 'doc')),
    new DenyWorkflow(workflowConfig(cfg, 'deny')),
  ];

  let runfilter = cfg.run.flatMap((r) => {
    if (r === 'all-default') {
      return all_default;
    } else {
      return [r];
    }
  });

  const enabledWorkflows = allWorkflows.filter((wf) =>
    runfilter.includes(wf.name),
  );

  const installedTools: [string, string][] = [];
  // Installation of required tools for enabled workflows
  await group(`Installing tools: ${timeSinceStart(start)}`, async () => {
    for (const wf of enabledWorkflows) {
      for (const [tool, version] of wf.requiredTools) {
        await Cargo.install(tool, version, cacheKey);
        installedTools.push([tool, version]);
      }
    }

    if (cfg.installAdditional) {
      for (const toolSpec of cfg.installAdditional) {
        // Split toolSpec into tool and version (default to 'latest' if no version specified)
        const [tool, version] = toolSpec.split('@');
        await Cargo.install(tool, version || 'latest', cacheKey);
        installedTools.push([tool, version || 'latest']);
      }
    }
  });

  // If installOnly is set, skip workflow execution
  if (cfg.installOnly) {
    info('Install-only mode enabled, skipping workflow execution.');
    return {
      installedToolchains,
      installedTools,
      workflowResults: {},
      succeeded: true,
    };
  }

  const workflowResults: Record<string, true | string> = {};
  // Run workflows
  let failingWorkflows: string[] = [];
  let allSucceeded = true;
  for (const wf of enabledWorkflows) {
    await group(`${wf.name}: ${timeSinceStart(start)}`, async () => {
      try {
        await wf.run();
        workflowResults[wf.name] = true;
      } catch (e) {
        allSucceeded = false;
        setFailed(`Workflow ${wf.name} failed: ${e}`);
        failingWorkflows.push(wf.name);
        workflowResults[wf.name] = e instanceof Error ? e.message : `${e}`;
      }
    });
  }

  info(`Finished after: ${timeSinceStart(start)}`);

  if (!allSucceeded) {
    error(`The following workflows failed:`);
    for (const wf of failingWorkflows) {
      error(` - ${wf}`);
    }
  }

  return {
    installedToolchains,
    installedTools,
    workflowResults,
    succeeded: allSucceeded,
  };
}

export type FlowConfig<T extends keyof Input['flow']> = Omit<
  Input['flow'][T],
  'overrideArgs'
> & {
  project: string;
  cacheKey: string;
  buildProfile?: string;
  toolchain?: string;
  overrideArgs?: string[];
};

// Helper to build workflow config by merging base config with specific flow config
export function workflowConfig<T extends keyof Input['flow']>(
  cfg: Input,
  flow: T,
): FlowConfig<T> {
  let cacheKey: String | undefined = undefined;

  // Set to default cache key unless 'no-cache' is specified
  if (cfg.cacheKey !== 'no-cache') {
    cacheKey = cfg.cacheKey;
  }

  const flowConfig = structuredClone(cfg.flow[flow]) as any;
  const overrideArgs =
    typeof flowConfig.overrideArgs === 'string'
      ? parseArgsStringToArgv(flowConfig.overrideArgs)
      : undefined;

  const finalConfig = {
    ...flowConfig,
    project: cfg.project,
    toolchain: flowConfig.toolchain ?? cfg.toolchain, // Flow-specific toolchain overrides global
    buildProfile: cfg.profile,
    cacheKey,
    overrideArgs,
  };

  return finalConfig;
}

export function addCargoToPath(): void {
  const cargoHome = process.env.CARGO_HOME
    ? process.env.CARGO_HOME
    : process.platform === 'win32'
      ? path.join(process.env.USERPROFILE || '', '.cargo')
      : path.join(process.env.HOME || '', '.cargo');
  const cargoBin = path.join(cargoHome, 'bin');
  process.env.PATH = `${cargoBin}${path.delimiter}${process.env.PATH}`;
}

export function timeSinceStart(start: number): string {
  const duration = Date.now() - start;
  if (duration < 1000) {
    // ms format
    return `${duration}ms`;
  } else if (duration < 60_000) {
    // ss format
    return `${(duration / 1000).toFixed(0)}s`;
  } else {
    // mm:ss format
    const minutes = Math.floor(duration / 60_000);
    const seconds = ((duration % 60_000) / 1000).toFixed(0).padStart(2, '0');
    return `${minutes}m:${seconds}s`;
  }
}

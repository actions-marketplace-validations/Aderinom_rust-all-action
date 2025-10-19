import { error, group, setFailed } from '@actions/core';
import parseArgsStringToArgv from 'string-argv';
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

// Default workflows to run if 'all' is specified
const all_default = ['fmt', 'clippy', 'shear', 'test', 'doc'];

// Main function to run selected workflows
//
// Returns true if all workflows succeeded, false otherwise
export async function run(cfg: Input): Promise<boolean> {
  check_sccache();

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

  for (const tc of toolchains) {
    await prepareToolchain(
      tc,
      cfg.cacheKey === 'no-cache' ? undefined : 'rax-cache',
    );
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

  let failingWorkflows: string[] = [];

  let allSucceeded = true;
  for (const wf of enabledWorkflows) {
    await group(`${wf.name}`, async () => {
      try {
        await wf.run();
      } catch (e) {
        allSucceeded = false;
        setFailed(`Workflow ${wf.name} failed: ${e}`);
        failingWorkflows.push(wf.name);
      }
    });
  }

  if (!allSucceeded) {
    error(`The following workflows failed:`);
    for (const wf of failingWorkflows) {
      error(` - ${wf}`);
    }
  }

  return allSucceeded;
}

export type FlowConfig<T extends keyof Input['flow']> = Omit<
  Input['flow'][T],
  'overrideArgs'
> & {
  project: string;
  cacheKey: string;
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

  // Base config common to all workflows, defined by the top level cfg
  const baseConfig = {
    project: cfg.project,
    toolchain: cfg.toolchain,
    cacheKey,
  };

  const finalConfig = {
    ...baseConfig,
    ...flowConfig,
  };
  finalConfig.overrideArgs = overrideArgs;

  return finalConfig;
}

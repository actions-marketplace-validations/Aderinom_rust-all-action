import { group, info, setFailed } from '@actions/core';
import parseArgsStringToArgv from 'string-argv';
import { Cargo } from './cargo.js';
import { ConfigSchema } from './config.js';
import { check_sccache } from './sccache.js';
import {
  ClippyWorkflow,
  DenyWorkflow,
  DocsWorkflow,
  FormatWorkflow,
  ShearWorkflow,
  TestWorkflow,
  WorkflowConfig,
} from './workflows.js';

// Main function to run selected workflows
//
// Returns true if all workflows succeeded, false otherwise
export async function run(cargo: Cargo, cfg: ConfigSchema): Promise<boolean> {
  check_sccache();

  // Ordered by fastest to slowest
  const allWorkflows = [
    new FormatWorkflow(workflowConfig(cfg, 'fmt')),
    new ClippyWorkflow(workflowConfig(cfg, 'clippy')),
    new ShearWorkflow(workflowConfig(cfg, 'shear')),
    new TestWorkflow(workflowConfig(cfg, 'test')),
    new DocsWorkflow(workflowConfig(cfg, 'doc')),
    new DenyWorkflow(workflowConfig(cfg, 'deny')),
  ];

  const enabledWorkflows = allWorkflows.filter((wf) =>
    cfg.run.includes(wf.name),
  );

  let allSucceeded = true;
  for (const wf of enabledWorkflows) {
    info(`Running workflow: ${wf.name}`);
    await group(`${wf.name}`, async () => {
      try {
        await wf.run(cargo);
      } catch (e) {
        allSucceeded = false;
        setFailed(`Workflow ${wf.name} failed: ${e}`);
      }
    });
  }
  return allSucceeded;
}

// Helper to build workflow config by merging base config with specific flow config
export function workflowConfig(
  cfg: ConfigSchema,
  flow: keyof ConfigSchema['flow'],
): any {
  let cacheKey: String | undefined = undefined;
  if (cfg.cacheKey !== 'no-cache') {
    cacheKey = cfg.cacheKey;
  }

  const baseConfig = {
    project: cfg.project,
    toolchain: cfg.toolchain,
    cacheKey,
  } as WorkflowConfig;

  const flowConfig = structuredClone(cfg.flow[flow]) as any;

  flowConfig.overrideArgs =
    typeof flowConfig.overrideArgs === 'string'
      ? parseArgsStringToArgv(flowConfig.overrideArgs)
      : [];

  return {
    ...baseConfig,
    ...flowConfig,
  };
}
